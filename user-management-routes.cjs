// Rotas do Módulo de Gerenciamento de Usuários - Sistema OEE
// Engenheiro: Especialista em Autenticação e Bancos de Dados
// Data: Janeiro 2025

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, Profile, AuditLog, authenticateToken, authorize, logAudit } = require('./user-management-module.cjs');

const router = express.Router();

// ===== ENDPOINTS DE AUTENTICAÇÃO =====

// Login de usuário
router.post('/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário com perfil
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('profile_id')
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email');
    
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar se conta está bloqueada
    if (user.isLocked()) {
      console.log('🔒 Conta bloqueada:', email);
      return res.status(423).json({ 
        message: 'Conta temporariamente bloqueada devido a muitas tentativas de login' 
      });
    }
    
    // Verificar status do usuário
    if (user.status !== 'active') {
      console.log('⚠️ Usuário inativo:', email);
      return res.status(401).json({ message: 'Conta inativa ou suspensa' });
    }
    
    // Verificar senha
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      console.log('❌ Senha incorreta para:', email);
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Reset tentativas de login e atualizar último login
    await user.resetLoginAttempts();
    
    // Gerar JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        profileId: user.profile_id._id,
        profileName: user.profile_id.name
      },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '8h' }
    );
    
    // Registrar auditoria
    await logAudit(user._id, 'login', null, { ip: req.ip }, req);
    
    console.log('✅ Login bem-sucedido:', email);
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        profile: {
          _id: user.profile_id._id,
          name: user.profile_id.name,
          permissions: user.profile_id.permissions
        },
        preferences: user.preferences,
        last_login: user.security.last_login
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    await logAudit(req.user._id, 'logout', null, {}, req);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token
router.get('/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('profile_id')
      .select('-password');
    
    res.json({
      valid: true,
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        profile: {
          _id: user.profile_id._id,
          name: user.profile_id.name,
          permissions: user.profile_id.permissions
        },
        preferences: user.preferences
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token inválido' });
  }
});

// ===== ENDPOINTS DE GERENCIAMENTO DE USUÁRIOS =====

// Listar usuários
router.get('/users', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    console.log('📋 Listando usuários');
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status, 
      profile, 
      department,
      sort = '-created_at'
    } = req.query;
    
    let query = {};
    
    // Filtros
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) query.status = status;
    if (department) query.department = department;
    if (profile) {
      const profileDoc = await Profile.findOne({ name: profile });
      if (profileDoc) query.profile_id = profileDoc._id;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query)
      .populate('profile_id', 'name description permissions')
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email')
      .select('-password -security.password_reset_token')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    console.log(`✅ Retornando ${users.length} usuários`);
    res.json({
      users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_users: total,
        per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar usuário por ID
router.get('/users/:id', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    console.log('🔍 Buscando usuário:', req.params.id);
    
    const user = await User.findById(req.params.id)
      .populate('profile_id')
      .populate('created_by', 'full_name email')
      .populate('updated_by', 'full_name email')
      .select('-password -security.password_reset_token');
    
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    res.json(user);
    
  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo usuário
router.post('/users', authenticateToken, authorize('users', 'create'), async (req, res) => {
  try {
    console.log('➕ Criando novo usuário');
    const {
      email,
      password,
      full_name,
      profile_name,
      department,
      position,
      phone,
      language,
      timezone,
      notifications,
      preferences
    } = req.body;
    
    // Validações
    if (!email || !password || !full_name || !profile_name) {
      return res.status(400).json({ 
        message: 'Email, senha, nome completo e perfil são obrigatórios' 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    // Verificar se email já existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Buscar perfil
    const profile = await Profile.findOne({ name: profile_name, is_active: true });
    if (!profile) {
      return res.status(400).json({ message: 'Perfil inválido ou inativo' });
    }
    
    // Criar usuário
    const userData = {
      email: email.toLowerCase(),
      password,
      full_name,
      profile_id: profile._id,
      department,
      position,
      phone,
      language: language || 'pt-BR',
      timezone: timezone || 'America/Sao_Paulo',
      notifications: notifications || {},
      preferences: preferences || {},
      created_by: req.user._id,
      status: 'active'
    };
    
    const newUser = new User(userData);
    await newUser.save();
    
    // Buscar usuário criado com populate
    const createdUser = await User.findById(newUser._id)
      .populate('profile_id')
      .populate('created_by', 'full_name email')
      .select('-password');
    
    // Registrar auditoria
    await logAudit(
      req.user._id, 
      'create', 
      newUser._id, 
      { 
        email: newUser.email, 
        full_name: newUser.full_name,
        profile: profile.name
      }, 
      req
    );
    
    console.log('✅ Usuário criado com sucesso:', newUser.email);
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: createdUser
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar usuário
router.put('/users/:id', authenticateToken, authorize('users', 'update'), async (req, res) => {
  try {
    console.log('✏️ Atualizando usuário:', req.params.id);
    const userId = req.params.id;
    const {
      email,
      full_name,
      profile_name,
      department,
      position,
      phone,
      language,
      timezone,
      notifications,
      preferences,
      status
    } = req.body;
    
    // Buscar usuário existente
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Preparar dados de atualização
    const updateData = {
      updated_by: req.user._id,
      updated_at: new Date()
    };
    
    // Validar e atualizar campos
    if (email && email !== existingUser.email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      if (emailExists) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
      updateData.email = email.toLowerCase();
    }
    
    if (full_name) updateData.full_name = full_name;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (phone) updateData.phone = phone;
    if (language) updateData.language = language;
    if (timezone) updateData.timezone = timezone;
    if (notifications) updateData.notifications = { ...existingUser.notifications, ...notifications };
    if (preferences) updateData.preferences = { ...existingUser.preferences, ...preferences };
    if (status && ['active', 'inactive', 'suspended'].includes(status)) {
      updateData.status = status;
    }
    
    // Atualizar perfil se fornecido
    if (profile_name) {
      const profile = await Profile.findOne({ name: profile_name, is_active: true });
      if (!profile) {
        return res.status(400).json({ message: 'Perfil inválido ou inativo' });
      }
      updateData.profile_id = profile._id;
    }
    
    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('profile_id')
    .populate('created_by', 'full_name email')
    .populate('updated_by', 'full_name email')
    .select('-password');
    
    // Registrar auditoria
    await logAudit(
      req.user._id, 
      'update', 
      userId, 
      { 
        changes: updateData,
        previous_email: existingUser.email
      }, 
      req
    );
    
    console.log('✅ Usuário atualizado com sucesso:', updatedUser.email);
    res.json({
      message: 'Usuário atualizado com sucesso',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Alterar senha de usuário
router.put('/users/:id/password', authenticateToken, authorize('users', 'update'), async (req, res) => {
  try {
    console.log('🔐 Alterando senha do usuário:', req.params.id);
    const { current_password, new_password } = req.body;
    const userId = req.params.id;
    const isOwnPassword = userId === req.user._id.toString();
    
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ 
        message: 'Nova senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Se for a própria senha, verificar senha atual
    if (isOwnPassword) {
      if (!current_password) {
        return res.status(400).json({ message: 'Senha atual é obrigatória' });
      }
      
      const isValidPassword = await user.comparePassword(current_password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Senha atual incorreta' });
      }
    }
    
    // Atualizar senha
    user.password = new_password;
    user.updated_by = req.user._id;
    await user.save();
    
    // Registrar auditoria
    await logAudit(
      req.user._id, 
      'password_change', 
      userId, 
      { 
        target_user: user.email,
        changed_by_self: isOwnPassword
      }, 
      req
    );
    
    console.log('✅ Senha alterada com sucesso para:', user.email);
    res.json({ message: 'Senha alterada com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir usuário (soft delete)
router.delete('/users/:id', authenticateToken, authorize('users', 'delete'), async (req, res) => {
  try {
    console.log('🗑️ Excluindo usuário:', req.params.id);
    const userId = req.params.id;
    
    // Não permitir auto-exclusão
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Não é possível excluir sua própria conta' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Soft delete - marcar como inativo
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { 
        status: 'inactive',
        updated_by: req.user._id,
        updated_at: new Date()
      },
      { new: true }
    ).select('-password');
    
    // Registrar auditoria
    await logAudit(
      req.user._id, 
      'delete', 
      userId, 
      { 
        target_user: user.email,
        soft_delete: true
      }, 
      req
    );
    
    console.log('✅ Usuário excluído (soft delete):', user.email);
    res.json({
      message: 'Usuário excluído com sucesso',
      user: deletedUser
    });
    
  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE GERENCIAMENTO DE PERFIS =====

// Listar perfis
router.get('/profiles', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    console.log('📋 Listando perfis');
    const { active_only = true } = req.query;
    
    let query = {};
    if (active_only === 'true') {
      query.is_active = true;
    }
    
    const profiles = await Profile.find(query)
      .sort({ hierarchy_level: 1, name: 1 });
    
    console.log(`✅ Retornando ${profiles.length} perfis`);
    res.json({ profiles });
    
  } catch (error) {
    console.error('❌ Erro ao listar perfis:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar perfil por ID
router.get('/profiles/:id', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado' });
    }
    
    res.json(profile);
    
  } catch (error) {
    console.error('❌ Erro ao buscar perfil:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar permissões de perfil
router.put('/profiles/:id/permissions', authenticateToken, authorize('users', 'update'), async (req, res) => {
  try {
    console.log('🔧 Atualizando permissões do perfil:', req.params.id);
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissões inválidas' });
    }
    
    const profile = await Profile.findByIdAndUpdate(
      req.params.id,
      { 
        permissions,
        updated_at: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!profile) {
      return res.status(404).json({ message: 'Perfil não encontrado' });
    }
    
    // Registrar auditoria
    await logAudit(
      req.user._id, 
      'profile_change', 
      null, 
      { 
        profile_id: profile._id,
        profile_name: profile.name,
        new_permissions: permissions
      }, 
      req
    );
    
    console.log('✅ Permissões atualizadas para perfil:', profile.name);
    res.json({
      message: 'Permissões atualizadas com sucesso',
      profile
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar permissões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE AUDITORIA =====

// Listar logs de auditoria
router.get('/audit-logs', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    console.log('📋 Listando logs de auditoria');
    const { 
      page = 1, 
      limit = 50, 
      user_id, 
      action, 
      start_date, 
      end_date 
    } = req.query;
    
    let query = {};
    
    if (user_id) query.user_id = user_id;
    if (action) query.action = action;
    
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await AuditLog.find(query)
      .populate('user_id', 'full_name email')
      .populate('target_user_id', 'full_name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await AuditLog.countDocuments(query);
    
    console.log(`✅ Retornando ${logs.length} logs de auditoria`);
    res.json({
      logs,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_logs: total,
        per_page: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao listar logs de auditoria:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE ESTATÍSTICAS =====

// Estatísticas de usuários
router.get('/users/stats/overview', authenticateToken, authorize('users', 'read'), async (req, res) => {
  try {
    console.log('📊 Gerando estatísticas de usuários');
    
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const profileStats = await User.aggregate([
      {
        $lookup: {
          from: 'profiles',
          localField: 'profile_id',
          foreignField: '_id',
          as: 'profile'
        }
      },
      {
        $unwind: '$profile'
      },
      {
        $group: {
          _id: '$profile.name',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const recentUsers = await User.countDocuments({
      created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    console.log('✅ Estatísticas geradas com sucesso');
    res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      recent_users: recentUsers,
      status_distribution: stats,
      profile_distribution: profileStats
    });
    
  } catch (error) {
    console.error('❌ Erro ao gerar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;