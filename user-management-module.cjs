// Módulo de Gerenciamento de Usuários - Sistema OEE
// Engenheiro: Especialista em Autenticação e Bancos de Dados
// Data: Janeiro 2025

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ===== SCHEMAS OTIMIZADOS =====

// Schema de Perfis de Acesso
const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    enum: ['Administrador', 'Supervisor', 'Operador']
  },
  description: {
    type: String,
    required: true
  },
  permissions: [{
    module: {
      type: String,
      required: true,
      enum: ['users', 'machines', 'production', 'reports', 'settings', 'oee']
    },
    actions: [{
      type: String,
      enum: ['create', 'read', 'update', 'delete', 'export', 'import']
    }]
  }],
  hierarchy_level: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'profiles',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices otimizados para consultas rápidas
profileSchema.index({ name: 1 }, { unique: true });
profileSchema.index({ hierarchy_level: 1 });
profileSchema.index({ is_active: 1 });

const Profile = mongoose.model('Profile', profileSchema);

// Schema de Usuários Aprimorado
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  full_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  profile_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
    index: true
  },
  department: {
    type: String,
    trim: true,
    maxlength: 50
  },
  position: {
    type: String,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9][\d\s\-\(\)]{8,20}$/, 'Telefone inválido']
  },
  language: {
    type: String,
    default: 'pt-BR',
    enum: ['pt-BR', 'en-US', 'es-ES']
  },
  timezone: {
    type: String,
    default: 'America/Sao_Paulo'
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  preferences: {
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    dashboard_layout: {
      type: String,
      default: 'default',
      enum: ['default', 'compact', 'detailed']
    }
  },
  security: {
    two_factor_enabled: { type: Boolean, default: false },
    login_attempts: { type: Number, default: 0, max: 5 },
    locked_until: Date,
    password_changed_at: Date,
    last_login: Date,
    password_reset_token: String,
    password_reset_expires: Date
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'suspended', 'pending']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices otimizados para performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ profile_id: 1 });
userSchema.index({ status: 1 });
userSchema.index({ department: 1 });
userSchema.index({ created_at: -1 });
userSchema.index({ full_name: 'text', email: 'text' }); // Busca textual

// Middleware para hash de senha
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.security.password_changed_at = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Método para verificar senha
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para verificar se conta está bloqueada
userSchema.methods.isLocked = function() {
  return !!(this.security.locked_until && this.security.locked_until > Date.now());
};

// Método para incrementar tentativas de login
userSchema.methods.incLoginAttempts = function() {
  if (this.security.locked_until && this.security.locked_until < Date.now()) {
    return this.updateOne({
      $unset: { 'security.locked_until': 1 },
      $set: { 'security.login_attempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.login_attempts': 1 } };
  
  if (this.security.login_attempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { 'security.locked_until': Date.now() + 2 * 60 * 60 * 1000 }; // 2 horas
  }
  
  return this.updateOne(updates);
};

// Método para resetar tentativas de login
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      'security.login_attempts': 1,
      'security.locked_until': 1
    },
    $set: {
      'security.last_login': new Date()
    }
  });
};

const User = mongoose.model('User', userSchema);

// Schema de Log de Auditoria
const auditLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'profile_change']
  },
  target_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  ip_address: String,
  user_agent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  collection: 'audit_logs',
  capped: { size: 100000000, max: 1000000 } // 100MB, máximo 1M documentos
});

// Índices para auditoria
auditLogSchema.index({ user_id: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ===== MIDDLEWARE DE AUTENTICAÇÃO =====

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token de acesso requerido' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    const user = await User.findById(decoded.userId).populate('profile_id');
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({ message: 'Usuário inválido ou inativo' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};

// Middleware de autorização
const authorize = (requiredModule, requiredAction) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user.profile_id) {
      return res.status(403).json({ message: 'Perfil de usuário não definido' });
    }
    
    const profile = user.profile_id;
    const hasPermission = profile.permissions.some(permission => 
      permission.module === requiredModule && 
      permission.actions.includes(requiredAction)
    );
    
    if (!hasPermission) {
      return res.status(403).json({ 
        message: `Acesso negado. Permissão necessária: ${requiredAction} em ${requiredModule}` 
      });
    }
    
    next();
  };
};

// ===== FUNÇÕES UTILITÁRIAS =====

// Função para registrar auditoria
const logAudit = async (userId, action, targetUserId = null, details = {}, req = null) => {
  try {
    const auditData = {
      user_id: userId,
      action,
      target_user_id: targetUserId,
      details,
      timestamp: new Date()
    };
    
    if (req) {
      auditData.ip_address = req.ip || req.connection.remoteAddress;
      auditData.user_agent = req.get('User-Agent');
    }
    
    await new AuditLog(auditData).save();
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
  }
};

// Função para inicializar perfis padrão
const initializeDefaultProfiles = async () => {
  try {
    const profiles = [
      {
        name: 'Administrador',
        description: 'Acesso completo ao sistema',
        hierarchy_level: 1,
        permissions: [
          { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'machines', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'production', actions: ['create', 'read', 'update', 'delete'] },
          { module: 'reports', actions: ['create', 'read', 'export'] },
          { module: 'settings', actions: ['read', 'update'] },
          { module: 'oee', actions: ['read', 'update'] }
        ]
      },
      {
        name: 'Supervisor',
        description: 'Supervisão de produção e relatórios',
        hierarchy_level: 2,
        permissions: [
          { module: 'users', actions: ['read'] },
          { module: 'machines', actions: ['read', 'update'] },
          { module: 'production', actions: ['create', 'read', 'update'] },
          { module: 'reports', actions: ['read', 'export'] },
          { module: 'oee', actions: ['read'] }
        ]
      },
      {
        name: 'Operador',
        description: 'Operação básica de máquinas',
        hierarchy_level: 3,
        permissions: [
          { module: 'machines', actions: ['read'] },
          { module: 'production', actions: ['create', 'read'] },
          { module: 'oee', actions: ['read'] }
        ]
      }
    ];
    
    for (const profileData of profiles) {
      await Profile.findOneAndUpdate(
        { name: profileData.name },
        profileData,
        { upsert: true, new: true }
      );
    }
    
    console.log('✅ Perfis padrão inicializados com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar perfis:', error);
  }
};

module.exports = {
  User,
  Profile,
  AuditLog,
  authenticateToken,
  authorize,
  logAudit,
  initializeDefaultProfiles
};