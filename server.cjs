// Servidor de desenvolvimento para API MongoDB
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração MongoDB
const MONGODB_URI = 'mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco';
const JWT_SECRET = 'cec877368c531f476fda198b8af39f88cff536f2f2d92a16b07a8f957147d05dae116d0178dc5214450b4544b2f0fa88483ec5fedc2e7f434b2e1beae0184b14';

// Schema do usuário
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: String,
  roles: [String],
  department: String,
  position: String,
  language: { type: String, default: 'pt-BR' },
  timezone: { type: String, default: 'America/Sao_Paulo' },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false }
  },
  preferences: {
    theme: { type: String, default: 'light' },
    dashboard_layout: { type: String, default: 'default' }
  },
  security: {
    two_factor_enabled: { type: Boolean, default: false },
    login_attempts: { type: Number, default: 0 },
    password_changed_at: Date
  },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Schema da máquina
const machineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['ativa', 'manutencao', 'parada', 'inativa'],
    default: 'ativa',
    index: true
  },
  oee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  availability: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  performance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  quality: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  current_production: {
    type: Number,
    default: 0,
    min: 0
  },
  target_production: {
    type: Number,
    default: 1,
    min: 1
  },
  capacity: {
    type: Number,
    default: 1000,
    min: 1
  },
  permissions: {
    type: [String],
    default: []
  },
  access_level: {
    type: String,
    enum: ['administrador', 'supervisor', 'operador'],
    default: 'operador'
  },
  last_production_update: {
    type: Date
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
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices para otimização
machineSchema.index({ code: 1 }, { unique: true });
machineSchema.index({ status: 1 });
machineSchema.index({ name: 'text', code: 'text' });

// Middleware para atualizar updated_at
machineSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Machine = mongoose.model('Machine', machineSchema);

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas');
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
  });

// Rotas

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

// Criar usuário
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, full_name, roles, department, position } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe com este email' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const newUser = new User({
      email,
      password: hashedPassword,
      full_name: full_name || email.split('@')[0],
      roles: roles || ['operador'],
      department,
      position,
      security: {
        password_changed_at: new Date()
      }
    });
    
    await newUser.save();
    
    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = newUser.toObject();
    res.status(201).json(userWithoutPassword);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Gerar token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    
    res.json({
      user: userWithoutPassword,
      token
    });
    
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Verificar token
app.post('/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    
    // Retornar usuário sem senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('❌ Erro na verificação do token:', error);
    res.status(401).json({ message: 'Token inválido' });
  }
});

// ===== ROTAS DE MÁQUINAS =====

// Listar todas as máquinas
app.get('/api/machines', async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    // Filtro por status
    if (status) {
      query.status = status;
    }
    
    // Busca por texto (nome ou código)
    if (search) {
      query.$text = { $search: search };
    }
    
    const machines = await Machine.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ created_at: -1 });
    
    const total = await Machine.countDocuments(query);
    
    res.json({
      machines,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar máquinas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar máquina por ID
app.get('/api/machines/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    res.json(machine);
    
  } catch (error) {
    console.error('❌ Erro ao buscar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar nova máquina
app.post('/api/machines', async (req, res) => {
  try {
    const { name, code, status, permissions, access_level, capacity, target_production } = req.body;
    
    // Validações obrigatórias
    if (!name || !code) {
      return res.status(400).json({ message: 'Nome e código são obrigatórios' });
    }
    
    // Verificar se já existe máquina com o mesmo código
    const existingMachine = await Machine.findOne({ code: code.toUpperCase() });
    if (existingMachine) {
      return res.status(409).json({ message: `Já existe uma máquina com o código '${code.toUpperCase()}'` });
    }
    
    // Verificar se já existe máquina com o mesmo nome
    const existingMachineByName = await Machine.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingMachineByName) {
      return res.status(409).json({ message: `Já existe uma máquina com o nome '${name}'` });
    }
    
    // Criar nova máquina
    const newMachine = new Machine({
      name: name.trim(),
      code: code.toUpperCase().trim(),
      status: status || 'inativa',
      permissions: permissions || [],
      access_level: access_level || 'operador',
      capacity: capacity || 1000,
      target_production: target_production || 1
    });
    
    await newMachine.save();
    
    console.log(`✅ Nova máquina criada: ${newMachine.name} (${newMachine.code})`);
    
    res.status(201).json(newMachine);
    
  } catch (error) {
    console.error('❌ Erro ao criar máquina:', error);
    
    // Tratar erro de duplicata (caso o índice único falhe)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({ 
        message: `Já existe uma máquina com ${field === 'code' ? 'código' : 'nome'} '${value}'` 
      });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar máquina
app.put('/api/machines/:id', async (req, res) => {
  try {
    const { name, code, status, permissions, access_level, capacity, target_production } = req.body;
    
    // Verificar se a máquina existe
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    // Se o código está sendo alterado, verificar duplicata
    if (code && code.toUpperCase() !== machine.code) {
      const existingMachine = await Machine.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (existingMachine) {
        return res.status(409).json({ message: `Já existe uma máquina com o código '${code.toUpperCase()}'` });
      }
    }
    
    // Se o nome está sendo alterado, verificar duplicata
    if (name && name.toLowerCase() !== machine.name.toLowerCase()) {
      const existingMachineByName = await Machine.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingMachineByName) {
        return res.status(409).json({ message: `Já existe uma máquina com o nome '${name}'` });
      }
    }
    
    // Atualizar campos
    const updates = {};
    if (name) updates.name = name.trim();
    if (code) updates.code = code.toUpperCase().trim();
    if (status) updates.status = status;
    if (permissions !== undefined) updates.permissions = permissions;
    if (access_level) updates.access_level = access_level;
    if (capacity !== undefined) updates.capacity = capacity;
    if (target_production !== undefined) updates.target_production = target_production;
    
    const updatedMachine = await Machine.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Máquina atualizada: ${updatedMachine.name} (${updatedMachine.code})`);
    
    res.json(updatedMachine);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar máquina:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const value = error.keyValue[field];
      return res.status(409).json({ 
        message: `Já existe uma máquina com ${field === 'code' ? 'código' : 'nome'} '${value}'` 
      });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar máquina
app.delete('/api/machines/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    await Machine.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Máquina deletada: ${machine.name} (${machine.code})`);
    
    res.json({ message: 'Máquina deletada com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao deletar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Inicializar máquinas padrão
app.post('/api/init/machines', async (req, res) => {
  try {
    const defaultMachines = [
      {
        name: 'Extrusora Principal',
        code: 'EXT-001',
        status: 'ativa',
        permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas'],
        access_level: 'operador',
        capacity: 1500,
        target_production: 1200
      },
      {
        name: 'Injetora Automática',
        code: 'INJ-002',
        status: 'ativa',
        permissions: ['visualizar_oee', 'editar_producao'],
        access_level: 'operador',
        capacity: 800,
        target_production: 600
      },
      {
        name: 'Linha de Montagem A',
        code: 'LMA-003',
        status: 'manutencao',
        permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas', 'gerenciar_manutencao'],
        access_level: 'supervisor',
        capacity: 2000,
        target_production: 1800
      },
      {
        name: 'Prensa Hidráulica',
        code: 'PRH-004',
        status: 'ativa',
        permissions: ['visualizar_oee', 'editar_producao'],
        access_level: 'operador',
        capacity: 500,
        target_production: 400
      },
      {
        name: 'Centro de Usinagem CNC',
        code: 'CNC-005',
        status: 'parada',
        permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas', 'configurar_parametros'],
        access_level: 'supervisor',
        capacity: 300,
        target_production: 250
      }
    ];
    
    const results = [];
    
    for (const machineData of defaultMachines) {
      try {
        // Verificar se máquina já existe
        const existingMachine = await Machine.findOne({ code: machineData.code });
        if (existingMachine) {
          results.push({ 
            code: machineData.code, 
            name: machineData.name,
            status: 'já existe' 
          });
          continue;
        }
        
        // Criar máquina
        const newMachine = new Machine(machineData);
        await newMachine.save();
        
        results.push({ 
          code: newMachine.code, 
          name: newMachine.name,
          status: 'criada',
          id: newMachine._id
        });
        
        console.log(`✅ Máquina criada: ${newMachine.name} (${newMachine.code})`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar máquina ${machineData.name}:`, error);
        results.push({ 
          code: machineData.code, 
          name: machineData.name,
          status: 'erro', 
          error: error.message
        });
      }
    }
    
    const summary = {
      total: defaultMachines.length,
      created: results.filter(r => r.status === 'criada').length,
      existing: results.filter(r => r.status === 'já existe').length,
      errors: results.filter(r => r.status === 'erro').length
    };
    
    res.json({ 
      message: 'Inicialização de máquinas concluída', 
      results,
      summary
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização de máquinas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Inicializar usuários padrão
app.post('/api/init/users', async (req, res) => {
  try {
    const defaultUsers = [
      {
        email: 'admin@sistema-oee.com',
        password: 'admin123',
        full_name: 'Administrador do Sistema',
        roles: ['administrador'],
        department: 'TI',
        position: 'Administrador de Sistema'
      },
      {
        email: 'supervisor@sistema-oee.com',
        password: 'supervisor123',
        full_name: 'João Silva',
        roles: ['supervisor'],
        department: 'Produção',
        position: 'Supervisor de Produção'
      },
      {
        email: 'operador1@sistema-oee.com',
        password: 'operador123',
        full_name: 'Maria Santos',
        roles: ['operador'],
        department: 'Produção',
        position: 'Operador de Máquina'
      }
    ];
    
    const results = [];
    
    for (const userData of defaultUsers) {
      try {
        // Verificar se usuário já existe
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          results.push({ email: userData.email, status: 'já existe' });
          continue;
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Criar usuário
        const newUser = new User({
          ...userData,
          password: hashedPassword,
          security: {
            password_changed_at: new Date()
          }
        });
        
        await newUser.save();
        results.push({ email: userData.email, status: 'criado' });
        
      } catch (error) {
        results.push({ email: userData.email, status: 'erro', error: error.message });
      }
    }
    
    res.json({ message: 'Inicialização concluída', results });
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API MongoDB rodando na porta ${PORT}`);
  console.log(`📋 Endpoints disponíveis:`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`   POST /api/users - Criar usuário`);
  console.log(`   POST /api/auth/login - Login`);
  console.log(`   POST /api/auth/verify - Verificar token`);
  console.log(`   POST /api/init/users - Inicializar usuários padrão`);
  console.log(`   GET  /api/machines - Listar máquinas`);
  console.log(`   GET  /api/machines/:id - Buscar máquina por ID`);
  console.log(`   POST /api/machines - Criar nova máquina`);
  console.log(`   PUT  /api/machines/:id - Atualizar máquina`);
  console.log(`   DELETE /api/machines/:id - Deletar máquina`);
  console.log(`   POST /api/init/machines - Inicializar máquinas padrão`);
});