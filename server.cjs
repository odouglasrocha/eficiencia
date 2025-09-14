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

// Schema do registro de produção
const productionRecordSchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  start_time: {
    type: Date,
    required: true,
    index: true
  },
  end_time: {
    type: Date
  },
  good_production: {
    type: Number,
    required: true,
    min: 0
  },
  film_waste: {
    type: Number,
    required: true,
    min: 0
  },
  organic_waste: {
    type: Number,
    required: true,
    min: 0
  },
  planned_time: {
    type: Number,
    required: true,
    min: 0
  },
  downtime_minutes: {
    type: Number,
    required: true,
    min: 0
  },
  downtime_reason: {
    type: String
  },
  material_code: {
    type: String,
    index: true
  },
  shift: {
    type: String,
    enum: ['A', 'B', 'C', 'Manhã', 'Tarde', 'Noite'],
    index: true
  },
  operator_id: {
    type: String,
    index: true
  },
  notes: {
    type: String
  },
  batch_number: {
    type: String,
    index: true
  },
  quality_check: {
    type: Boolean,
    default: true
  },
  temperature: {
    type: Number
  },
  pressure: {
    type: Number
  },
  speed: {
    type: Number
  },
  oee_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  availability_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  performance_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  quality_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices compostos para otimização
productionRecordSchema.index({ machine_id: 1, start_time: -1 });
productionRecordSchema.index({ shift: 1, start_time: -1 });
productionRecordSchema.index({ operator_id: 1, start_time: -1 });
productionRecordSchema.index({ material_code: 1, start_time: -1 });
productionRecordSchema.index({ batch_number: 1 });

// Middleware para calcular métricas OEE
productionRecordSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Calcular métricas OEE se não foram fornecidas
  if (this.planned_time > 0) {
    // Disponibilidade = (Tempo Planejado - Tempo de Parada) / Tempo Planejado * 100
    this.availability_calculated = ((this.planned_time - this.downtime_minutes) / this.planned_time) * 100;
    
    // Performance = Produção Real / Produção Planejada * 100 (assumindo produção planejada = planned_time)
    const plannedProduction = this.planned_time; // Simplificado
    this.performance_calculated = (this.good_production / plannedProduction) * 100;
    
    // Qualidade = Produção Boa / (Produção Boa + Refugo) * 100
    const totalProduction = this.good_production + this.film_waste + this.organic_waste;
    this.quality_calculated = totalProduction > 0 ? (this.good_production / totalProduction) * 100 : 100;
    
    // OEE = Disponibilidade * Performance * Qualidade / 10000
    this.oee_calculated = (this.availability_calculated * this.performance_calculated * this.quality_calculated) / 10000;
  }
  
  next();
});

const ProductionRecord = mongoose.model('ProductionRecord', productionRecordSchema);

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

// ===== ROTAS DE REGISTROS DE PRODUÇÃO =====

// Listar registros de produção
app.get('/api/production-records', async (req, res) => {
  try {
    const { 
      machine_id, 
      start_date, 
      end_date, 
      shift, 
      operator_id, 
      material_code,
      batch_number,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let query = {};
    
    // Filtros
    if (machine_id) query.machine_id = machine_id;
    if (shift) query.shift = shift;
    if (operator_id) query.operator_id = operator_id;
    if (material_code) query.material_code = material_code;
    if (batch_number) query.batch_number = batch_number;
    
    // Filtro por data
    if (start_date || end_date) {
      query.start_time = {};
      if (start_date) query.start_time.$gte = new Date(start_date);
      if (end_date) query.start_time.$lte = new Date(end_date);
    }
    
    const records = await ProductionRecord.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ start_time: -1 });
    
    const total = await ProductionRecord.countDocuments(query);
    
    res.json({
      records,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar registros de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar registro de produção por ID
app.get('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Registro de produção não encontrado' });
    }
    
    res.json(record);
    
  } catch (error) {
    console.error('❌ Erro ao buscar registro de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo registro de produção
app.post('/api/production-records', async (req, res) => {
  try {
    console.log('🔍 Dados recebidos para criar registro de produção:', JSON.stringify(req.body, null, 2));
    
    const {
      machine_id,
      start_time,
      end_time,
      good_production,
      film_waste,
      organic_waste,
      planned_time,
      downtime_minutes,
      downtime_reason,
      material_code,
      shift,
      operator_id,
      notes,
      batch_number,
      quality_check,
      temperature,
      pressure,
      speed
    } = req.body;
    
    console.log('🔍 machine_id recebido:', machine_id, 'tipo:', typeof machine_id);
    
    // Validações obrigatórias
    if (!machine_id || !start_time || good_production === undefined || 
        film_waste === undefined || organic_waste === undefined || 
        planned_time === undefined || downtime_minutes === undefined) {
      console.log('❌ Validação falhou - campos obrigatórios ausentes');
      return res.status(400).json({ 
        message: 'Campos obrigatórios: machine_id, start_time, good_production, film_waste, organic_waste, planned_time, downtime_minutes' 
      });
    }
    
    // Validar se o machine_id é um ObjectId válido
    console.log('🔍 Validando machine_id:', machine_id, 'tipo:', typeof machine_id);
    if (!machine_id || typeof machine_id !== 'string' || !mongoose.Types.ObjectId.isValid(machine_id)) {
      console.log('❌ machine_id não é um ObjectId válido:', machine_id);
      return res.status(400).json({ message: 'ID da máquina inválido' });
    }
    
    // Verificar se a máquina existe
    console.log('🔍 Buscando máquina com ID:', machine_id);
    const machine = await Machine.findById(machine_id);
    if (!machine) {
      console.log('❌ Máquina não encontrada com ID:', machine_id);
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    console.log('✅ Máquina encontrada:', machine.name);
    
    // Criar registro de produção
    const newRecord = new ProductionRecord({
      machine_id,
      start_time: new Date(start_time),
      end_time: end_time ? new Date(end_time) : undefined,
      good_production: Number(good_production),
      film_waste: Number(film_waste),
      organic_waste: Number(organic_waste),
      planned_time: Number(planned_time),
      downtime_minutes: Number(downtime_minutes),
      downtime_reason,
      material_code,
      shift,
      operator_id,
      notes,
      batch_number,
      quality_check: quality_check !== undefined ? Boolean(quality_check) : true,
      temperature: temperature ? Number(temperature) : undefined,
      pressure: pressure ? Number(pressure) : undefined,
      speed: speed ? Number(speed) : undefined
    });
    
    await newRecord.save();
    
    console.log(`✅ Novo registro de produção criado para máquina ${machine.name}`);
    
    res.status(201).json(newRecord);
    
  } catch (error) {
    console.error('❌ Erro ao criar registro de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar registro de produção
app.put('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Registro de produção não encontrado' });
    }
    
    // Atualizar campos permitidos
    const allowedUpdates = [
      'end_time', 'good_production', 'film_waste', 'organic_waste', 
      'planned_time', 'downtime_minutes', 'downtime_reason', 
      'material_code', 'shift', 'operator_id', 'notes', 'batch_number',
      'quality_check', 'temperature', 'pressure', 'speed'
    ];
    
    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'end_time') {
          updates[field] = new Date(req.body[field]);
        } else if (['good_production', 'film_waste', 'organic_waste', 'planned_time', 'downtime_minutes', 'temperature', 'pressure', 'speed'].includes(field)) {
          updates[field] = Number(req.body[field]);
        } else if (field === 'quality_check') {
          updates[field] = Boolean(req.body[field]);
        } else {
          updates[field] = req.body[field];
        }
      }
    });
    
    const updatedRecord = await ProductionRecord.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    console.log(`✅ Registro de produção atualizado: ${updatedRecord._id}`);
    
    res.json(updatedRecord);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar registro de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar registro de produção
app.delete('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Registro de produção não encontrado' });
    }
    
    await ProductionRecord.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Registro de produção deletado: ${record._id}`);
    
    res.json({ message: 'Registro de produção deletado com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao deletar registro de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Estatísticas de produção
app.get('/api/production-statistics', async (req, res) => {
  try {
    const { machine_id, start_date, end_date, shift } = req.query;
    
    let matchQuery = {};
    if (machine_id) matchQuery.machine_id = machine_id;
    if (shift) matchQuery.shift = shift;
    if (start_date || end_date) {
      matchQuery.start_time = {};
      if (start_date) matchQuery.start_time.$gte = new Date(start_date);
      if (end_date) matchQuery.start_time.$lte = new Date(end_date);
    }
    
    const stats = await ProductionRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalProduction: { $sum: '$good_production' },
          totalWaste: { $sum: { $add: ['$film_waste', '$organic_waste'] } },
          totalDowntime: { $sum: '$downtime_minutes' },
          totalPlannedTime: { $sum: '$planned_time' },
          averageOEE: { $avg: '$oee_calculated' },
          averageAvailability: { $avg: '$availability_calculated' },
          averagePerformance: { $avg: '$performance_calculated' },
          averageQuality: { $avg: '$quality_calculated' }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRecords: 0,
      totalProduction: 0,
      totalWaste: 0,
      totalDowntime: 0,
      totalPlannedTime: 0,
      averageOEE: 0,
      averageAvailability: 0,
      averagePerformance: 0,
      averageQuality: 0
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Inicializar registros de produção padrão
app.post('/api/init/production-records', async (req, res) => {
  try {
    // Buscar máquinas disponíveis
    const machines = await Machine.find({ status: { $in: ['ativa', 'manutencao'] } }).limit(5);
    
    if (machines.length === 0) {
      return res.status(400).json({ 
        message: 'Nenhuma máquina disponível. Inicialize as máquinas primeiro.' 
      });
    }
    
    const defaultRecords = [
      {
        machine_id: machines[0]._id,
        start_time: new Date(Date.now() - 4 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 2 * 60 * 60 * 1000),
        good_production: 950,
        film_waste: 30,
        organic_waste: 20,
        planned_time: 120,
        downtime_minutes: 25,
        downtime_reason: 'Manutenção preventiva; Ajuste de parâmetros',
        material_code: 'MAT001',
        shift: 'A',
        operator_id: 'OP001',
        notes: 'Produção normal, sem intercorrências',
        batch_number: 'LOTE2025001',
        quality_check: true,
        temperature: 185.5,
        pressure: 12.3,
        speed: 85.2
      },
      {
        machine_id: machines[Math.min(1, machines.length - 1)]._id,
        start_time: new Date(Date.now() - 8 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 6 * 60 * 60 * 1000),
        good_production: 1150,
        film_waste: 45,
        organic_waste: 25,
        planned_time: 120,
        downtime_minutes: 20,
        downtime_reason: 'Troca de material',
        material_code: 'MAT002',
        shift: 'B',
        operator_id: 'OP002',
        notes: 'Boa produtividade no turno B',
        batch_number: 'LOTE2025002',
        quality_check: true,
        temperature: 190.0,
        pressure: 11.8,
        speed: 92.1
      },
      {
        machine_id: machines[Math.min(2, machines.length - 1)]._id,
        start_time: new Date(Date.now() - 12 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 10 * 60 * 60 * 1000),
        good_production: 800,
        film_waste: 60,
        organic_waste: 40,
        planned_time: 120,
        downtime_minutes: 50,
        downtime_reason: 'Problema técnico; Limpeza',
        material_code: 'MAT003',
        shift: 'C',
        operator_id: 'OP003',
        notes: 'Problemas técnicos resolvidos',
        batch_number: 'LOTE2025003',
        quality_check: false,
        temperature: 175.2,
        pressure: 13.1,
        speed: 78.5
      },
      {
        machine_id: machines[0]._id,
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 22 * 60 * 60 * 1000),
        good_production: 1050,
        film_waste: 25,
        organic_waste: 15,
        planned_time: 120,
        downtime_minutes: 10,
        downtime_reason: 'Pausa programada',
        material_code: 'MAT001',
        shift: 'A',
        operator_id: 'OP001',
        notes: 'Excelente performance',
        batch_number: 'LOTE2025004',
        quality_check: true,
        temperature: 188.7,
        pressure: 12.0,
        speed: 89.3
      },
      {
        machine_id: machines[Math.min(1, machines.length - 1)]._id,
        start_time: new Date(Date.now() - 6 * 60 * 60 * 1000),
        end_time: new Date(Date.now() - 4 * 60 * 60 * 1000),
        good_production: 920,
        film_waste: 35,
        organic_waste: 30,
        planned_time: 120,
        downtime_minutes: 25,
        downtime_reason: 'Ajuste de qualidade',
        material_code: 'MAT002',
        shift: 'B',
        operator_id: 'OP002',
        notes: 'Ajustes realizados com sucesso',
        batch_number: 'LOTE2025005',
        quality_check: true,
        temperature: 192.1,
        pressure: 11.5,
        speed: 87.8
      }
    ];
    
    const results = [];
    
    for (const recordData of defaultRecords) {
      try {
        // Verificar se já existe registro com o mesmo lote
        const existingRecord = await ProductionRecord.findOne({ batch_number: recordData.batch_number });
        if (existingRecord) {
          const machine = machines.find(m => m._id.toString() === recordData.machine_id.toString());
          results.push({ 
            batch_number: recordData.batch_number,
            machine: machine?.name || 'Desconhecida',
            status: 'já existe' 
          });
          continue;
        }
        
        // Criar registro de produção
        const newRecord = new ProductionRecord(recordData);
        await newRecord.save();
        
        const machine = machines.find(m => m._id.toString() === recordData.machine_id.toString());
        results.push({ 
          batch_number: recordData.batch_number,
          machine: machine?.name || 'Desconhecida',
          status: 'criado',
          id: newRecord._id,
          oee: newRecord.oee_calculated?.toFixed(1) + '%'
        });
        
        console.log(`✅ Registro de produção criado: ${recordData.batch_number} - ${machine?.name}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar registro ${recordData.batch_number}:`, error);
        results.push({ 
          batch_number: recordData.batch_number,
          status: 'erro', 
          error: error.message
        });
      }
    }
    
    const summary = {
      total: defaultRecords.length,
      created: results.filter(r => r.status === 'criado').length,
      existing: results.filter(r => r.status === 'já existe').length,
      errors: results.filter(r => r.status === 'erro').length
    };
    
    res.json({ 
      message: 'Inicialização de registros de produção concluída', 
      results,
      summary
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização de registros de produção:', error);
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
  console.log(`   GET  /api/production-records - Listar registros de produção`);
  console.log(`   GET  /api/production-records/:id - Buscar registro por ID`);
  console.log(`   POST /api/production-records - Criar registro de produção`);
  console.log(`   PUT  /api/production-records/:id - Atualizar registro`);
  console.log(`   DELETE /api/production-records/:id - Deletar registro`);
  console.log(`   GET  /api/production-statistics - Estatísticas de produção`);
  console.log(`   POST /api/init/production-records - Inicializar registros padrão`);
});