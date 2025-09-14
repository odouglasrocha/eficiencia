// Servidor Principal Funcional - Sistema OEE
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco';

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
}, { collection: 'users' });

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
    enum: ['ativa', 'inativa', 'manutencao', 'parada'],
    default: 'ativa'
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
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
    this.availability_calculated = Math.min(100, Math.max(0, ((this.planned_time - this.downtime_minutes) / this.planned_time) * 100));
    
    // Performance = Produção Real / Produção Esperada * 100
    const actualRuntime = this.planned_time - this.downtime_minutes;
    let performance = 0;
    
    const defaultProductionRate = 65; // PPm padrão
    const targetProduction = this.planned_time * defaultProductionRate * 0.85;
    
    if (targetProduction > 0 && actualRuntime > 0) {
      const expectedProduction = (targetProduction * actualRuntime) / this.planned_time;
      performance = Math.min((this.good_production / expectedProduction) * 100, 100);
    }
    
    this.performance_calculated = Math.min(100, Math.max(0, performance));
    
    // Qualidade = Produção Boa / (Produção Boa + Refugo) * 100
    const totalProduction = this.good_production + this.film_waste + this.organic_waste;
    this.quality_calculated = totalProduction > 0 ? Math.min(100, Math.max(0, (this.good_production / totalProduction) * 100)) : 100;
    
    // OEE = Disponibilidade × Performance × Qualidade / 10000
    this.oee_calculated = (this.availability_calculated * this.performance_calculated * this.quality_calculated) / 10000;
  }
  
  next();
});

const ProductionRecord = mongoose.model('ProductionRecord', productionRecordSchema);

// Schema do histórico OEE
const oeeHistorySchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  production_record_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductionRecord',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  oee: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  availability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  performance: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  quality: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  good_production: {
    type: Number,
    required: true,
    min: 0
  },
  total_waste: {
    type: Number,
    required: true,
    min: 0
  },
  downtime_minutes: {
    type: Number,
    required: true,
    min: 0
  },
  planned_time: {
    type: Number,
    required: true,
    min: 0
  },
  shift: {
    type: String,
    enum: ['A', 'B', 'C', 'Manhã', 'Tarde', 'Noite']
  },
  operator_id: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false }
});

// Índices compostos para otimização
oeeHistorySchema.index({ machine_id: 1, timestamp: -1 });
oeeHistorySchema.index({ timestamp: -1 });
oeeHistorySchema.index({ machine_id: 1, shift: 1, timestamp: -1 });

const OeeHistory = mongoose.model('OeeHistory', oeeHistorySchema);

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
  });

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check chamado');
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Endpoint de teste simples
app.get('/api/test', (req, res) => {
  console.log('🔍 GET /api/test chamado');
  res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    // Buscar usuário
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Senha incorreta para:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
    console.log('✅ Login bem-sucedido:', email);
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        roles: user.roles
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE MÁQUINAS =====

// Listar máquinas
app.get('/api/machines', async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const machines = await Machine.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ name: 1 });
    
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
    const machineData = req.body;
    
    // Verificar se código já existe
    const existingMachine = await Machine.findOne({ code: machineData.code });
    if (existingMachine) {
      return res.status(400).json({ message: 'Código da máquina já existe' });
    }
    
    const machine = new Machine(machineData);
    await machine.save();
    
    console.log(`✅ Nova máquina criada: ${machine.name} (${machine.code})`);
    res.status(201).json(machine);
    
  } catch (error) {
    console.error('❌ Erro ao criar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar máquina
app.put('/api/machines/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    console.log(`✅ Máquina atualizada: ${machine.name} (${machine.code})`);
    res.json(machine);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar máquina
app.delete('/api/machines/:id', async (req, res) => {
  try {
    const machineId = req.params.id;
    
    const machine = await Machine.findById(machineId);
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    // Contar registros relacionados
    const productionRecords = await ProductionRecord.countDocuments({ machine_id: machineId });
    const oeeHistoryRecords = await OeeHistory.countDocuments({ machine_id: machineId });
    
    console.log(`🗑️ Excluindo máquina: ${machine.name} (${machine.code})`);
    console.log(`   - Registros de produção: ${productionRecords}`);
    console.log(`   - Histórico OEE: ${oeeHistoryRecords}`);
    
    // Excluir registros relacionados
    if (oeeHistoryRecords > 0) {
      await OeeHistory.deleteMany({ machine_id: machineId });
      console.log(`✅ ${oeeHistoryRecords} registros de histórico OEE excluídos`);
    }
    
    if (productionRecords > 0) {
      await ProductionRecord.deleteMany({ machine_id: machineId });
      console.log(`✅ ${productionRecords} registros de produção excluídos`);
    }
    
    await Machine.findByIdAndDelete(machineId);
    
    console.log(`✅ Máquina excluída com sucesso: ${machine.name}`);
    res.json({ 
      message: 'Máquina e todos os registros relacionados excluídos com sucesso',
      details: {
        machine: { id: machineId, name: machine.name, code: machine.code },
        deletedRecords: { productionRecords, oeeHistoryRecords }
      }
    });
    
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
    
    if (machine_id) query.machine_id = machine_id;
    if (shift) query.shift = shift;
    if (operator_id) query.operator_id = operator_id;
    if (material_code) query.material_code = material_code;
    if (batch_number) query.batch_number = batch_number;
    
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

// Buscar registro por ID
app.get('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findById(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    res.json(record);
    
  } catch (error) {
    console.error('❌ Erro ao buscar registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar registro de produção
app.post('/api/production-records', async (req, res) => {
  try {
    const record = new ProductionRecord(req.body);
    await record.save();
    
    console.log(`✅ Novo registro de produção criado para máquina ${record.machine_id}`);
    res.status(201).json(record);
    
  } catch (error) {
    console.error('❌ Erro ao criar registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar registro
app.put('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    console.log(`✅ Registro atualizado: ${record._id}`);
    res.json(record);
    
  } catch (error) {
    console.error('❌ Erro ao atualizar registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar registro
app.delete('/api/production-records/:id', async (req, res) => {
  try {
    const record = await ProductionRecord.findByIdAndDelete(req.params.id);
    
    if (!record) {
      return res.status(404).json({ message: 'Registro não encontrado' });
    }
    
    // Deletar histórico OEE relacionado
    await OeeHistory.deleteMany({ production_record_id: req.params.id });
    
    console.log(`✅ Registro excluído: ${record._id}`);
    res.json({ message: 'Registro excluído com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao deletar registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar ou atualizar registro (upsert)
app.post('/api/production-records/upsert', async (req, res) => {
  try {
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
    
    // Buscar registro existente
    const startDate = new Date(start_time);
    const searchQuery = {
      machine_id: machine_id,
      start_time: {
        $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()),
        $lt: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1)
      }
    };
    
    let existingRecord = await ProductionRecord.findOne(searchQuery);
    
    if (existingRecord) {
      // Atualizar registro existente
      console.log('🔄 Atualizando registro existente:', existingRecord._id);
      
      existingRecord.end_time = end_time ? new Date(end_time) : existingRecord.end_time;
      existingRecord.good_production = good_production;
      existingRecord.film_waste = film_waste;
      existingRecord.organic_waste = organic_waste;
      existingRecord.planned_time = planned_time;
      existingRecord.downtime_minutes = downtime_minutes;
      existingRecord.downtime_reason = downtime_reason || existingRecord.downtime_reason;
      existingRecord.material_code = material_code || existingRecord.material_code;
      existingRecord.shift = shift || existingRecord.shift;
      existingRecord.operator_id = operator_id || existingRecord.operator_id;
      existingRecord.notes = notes || existingRecord.notes;
      existingRecord.batch_number = batch_number || existingRecord.batch_number;
      existingRecord.quality_check = quality_check !== undefined ? quality_check : existingRecord.quality_check;
      existingRecord.temperature = temperature || existingRecord.temperature;
      existingRecord.pressure = pressure || existingRecord.pressure;
      existingRecord.speed = speed || existingRecord.speed;
      
      await existingRecord.save();
      
      // Criar nova entrada no histórico OEE
      try {
        const historyEntry = new OeeHistory({
          machine_id: existingRecord.machine_id,
          production_record_id: existingRecord._id,
          timestamp: new Date(),
          oee: existingRecord.oee_calculated || 0,
          availability: existingRecord.availability_calculated || 0,
          performance: existingRecord.performance_calculated || 0,
          quality: existingRecord.quality_calculated || 0,
          good_production: existingRecord.good_production,
          total_waste: (existingRecord.film_waste || 0) + (existingRecord.organic_waste || 0),
          downtime_minutes: existingRecord.downtime_minutes,
          planned_time: existingRecord.planned_time,
          shift: existingRecord.shift,
          operator_id: existingRecord.operator_id
        });
        
        await historyEntry.save();
        console.log('✅ Nova entrada no histórico OEE criada para atualização:', existingRecord._id);
      } catch (historyError) {
        console.error('⚠️ Erro ao criar entrada no histórico OEE:', historyError);
      }
      
      console.log(`✅ Registro atualizado para máquina ${machine_id}`);
      res.json({ ...existingRecord.toObject(), action: 'updated' });
      
    } else {
      // Criar novo registro
      console.log('➕ Criando novo registro de produção');
      
      const newRecord = new ProductionRecord({
        machine_id,
        start_time: new Date(start_time),
        end_time: end_time ? new Date(end_time) : undefined,
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
      });
      
      await newRecord.save();
      
      // Criar entrada no histórico OEE
      try {
        const historyEntry = new OeeHistory({
          machine_id: newRecord.machine_id,
          production_record_id: newRecord._id,
          timestamp: newRecord.start_time,
          oee: newRecord.oee_calculated || 0,
          availability: newRecord.availability_calculated || 0,
          performance: newRecord.performance_calculated || 0,
          quality: newRecord.quality_calculated || 0,
          good_production: newRecord.good_production,
          total_waste: (newRecord.film_waste || 0) + (newRecord.organic_waste || 0),
          downtime_minutes: newRecord.downtime_minutes,
          planned_time: newRecord.planned_time,
          shift: newRecord.shift,
          operator_id: newRecord.operator_id
        });
        
        await historyEntry.save();
        console.log('✅ Entrada no histórico OEE criada');
      } catch (historyError) {
        console.error('⚠️ Erro ao criar entrada no histórico OEE:', historyError);
      }
      
      console.log(`✅ Novo registro criado para máquina ${machine_id}`);
      res.status(201).json({ ...newRecord.toObject(), action: 'created' });
    }
    
  } catch (error) {
    console.error('❌ Erro no upsert:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE HISTÓRICO OEE =====

// Buscar histórico OEE
app.get('/api/oee-history', async (req, res) => {
  try {
    const { machine_id, start_date, end_date, limit = 100, offset = 0 } = req.query;
    
    let query = {};
    
    if (machine_id) {
      query.machine_id = machine_id;
    }
    
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const history = await OeeHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('machine_id', 'name code')
      .lean();
    
    const total = await OeeHistory.countDocuments(query);
    
    res.json({ history, total });
  } catch (error) {
    console.error('❌ Erro ao buscar histórico OEE:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar histórico OEE por máquina
app.get('/api/oee-history/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const { start_date, end_date, limit = 100 } = req.query;
    
    let query = { machine_id: machineId };
    
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const history = await OeeHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json(history);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico OEE da máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ESTATÍSTICAS DE PRODUÇÃO =====

// Buscar estatísticas de produção
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
    
    const statistics = await ProductionRecord.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalGoodProduction: { $sum: '$good_production' },
          totalFilmWaste: { $sum: '$film_waste' },
          totalOrganicWaste: { $sum: '$organic_waste' },
          totalPlannedTime: { $sum: '$planned_time' },
          totalDowntime: { $sum: '$downtime_minutes' },
          avgOEE: { $avg: '$oee_calculated' },
          avgAvailability: { $avg: '$availability_calculated' },
          avgPerformance: { $avg: '$performance_calculated' },
          avgQuality: { $avg: '$quality_calculated' },
          minOEE: { $min: '$oee_calculated' },
          maxOEE: { $max: '$oee_calculated' }
        }
      }
    ]);
    
    const result = statistics[0] || {
      totalRecords: 0,
      totalGoodProduction: 0,
      totalFilmWaste: 0,
      totalOrganicWaste: 0,
      totalPlannedTime: 0,
      totalDowntime: 0,
      avgOEE: 0,
      avgAvailability: 0,
      avgPerformance: 0,
      avgQuality: 0,
      minOEE: 0,
      maxOEE: 0
    };
    
    // Calcular métricas adicionais
    result.totalWaste = result.totalFilmWaste + result.totalOrganicWaste;
    result.totalProduction = result.totalGoodProduction + result.totalWaste;
    result.wastePercentage = result.totalProduction > 0 ? (result.totalWaste / result.totalProduction) * 100 : 0;
    result.uptimePercentage = result.totalPlannedTime > 0 ? ((result.totalPlannedTime - result.totalDowntime) / result.totalPlannedTime) * 100 : 0;
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erro ao calcular estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== INICIALIZADORES =====

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
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          results.push({ email: userData.email, status: 'já existe' });
          continue;
        }
        
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const newUser = new User({
          ...userData,
          password: hashedPassword,
          security: { password_changed_at: new Date() }
        });
        
        await newUser.save();
        results.push({ email: userData.email, status: 'criado' });
        
      } catch (error) {
        results.push({ email: userData.email, status: 'erro', error: error.message });
      }
    }
    
    res.json({ message: 'Inicialização de usuários concluída', results });
    
  } catch (error) {
    console.error('❌ Erro na inicialização de usuários:', error);
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
        description: 'Extrusora principal para produção de filmes plásticos',
        location: 'Setor A - Linha 1',
        permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas'],
        access_level: 'operador',
        capacity: 1500,
        target_production: 1200
      },
      {
        name: 'Injetora Automática',
        code: 'INJ-002',
        status: 'ativa',
        description: 'Injetora automática para peças plásticas',
        location: 'Setor B - Linha 2',
        permissions: ['visualizar_oee', 'editar_producao'],
        access_level: 'operador',
        capacity: 800,
        target_production: 600
      },
      {
        name: 'Linha de Montagem A',
        code: 'LMA-003',
        status: 'manutencao',
        description: 'Linha de montagem automatizada',
        location: 'Setor C - Linha 3',
        permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas', 'gerenciar_manutencao'],
        access_level: 'supervisor',
        capacity: 2000,
        target_production: 1800
      }
    ];
    
    const results = [];
    
    for (const machineData of defaultMachines) {
      try {
        const existingMachine = await Machine.findOne({ code: machineData.code });
        if (existingMachine) {
          results.push({ 
            code: machineData.code, 
            name: machineData.name,
            status: 'já existe',
            id: existingMachine._id
          });
          continue;
        }
        
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

// Inicializar registros de produção padrão
app.post('/api/init/production-records', async (req, res) => {
  try {
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
        good_production: 1200,
        film_waste: 45,
        organic_waste: 15,
        planned_time: 120,
        downtime_minutes: 10,
        downtime_reason: 'Troca de material',
        material_code: 'MAT002',
        shift: 'B',
        operator_id: 'OP002',
        notes: 'Boa performance, qualidade dentro do padrão',
        batch_number: 'LOTE2025002',
        quality_check: true,
        temperature: 190.0,
        pressure: 11.8,
        speed: 92.1
      }
    ];
    
    const results = [];
    
    for (const recordData of defaultRecords) {
      try {
        const newRecord = new ProductionRecord(recordData);
        await newRecord.save();
        
        // Criar entrada no histórico OEE
        const historyEntry = new OeeHistory({
          machine_id: newRecord.machine_id,
          production_record_id: newRecord._id,
          timestamp: newRecord.start_time,
          oee: newRecord.oee_calculated || 0,
          availability: newRecord.availability_calculated || 0,
          performance: newRecord.performance_calculated || 0,
          quality: newRecord.quality_calculated || 0,
          good_production: newRecord.good_production,
          total_waste: (newRecord.film_waste || 0) + (newRecord.organic_waste || 0),
          downtime_minutes: newRecord.downtime_minutes,
          planned_time: newRecord.planned_time,
          shift: newRecord.shift,
          operator_id: newRecord.operator_id
        });
        
        await historyEntry.save();
        
        results.push({ 
          machine_id: newRecord.machine_id,
          status: 'criado',
          id: newRecord._id,
          oee: newRecord.oee_calculated
        });
        
      } catch (error) {
        results.push({ 
          machine_id: recordData.machine_id,
          status: 'erro', 
          error: error.message
        });
      }
    }
    
    const summary = {
      total: defaultRecords.length,
      created: results.filter(r => r.status === 'criado').length,
      errors: results.filter(r => r.status === 'erro').length
    };
    
    res.json({ 
      message: 'Inicialização de registros de produção concluída', 
      results,
      summary
    });
    
  } catch (error) {
    console.error('❌ Erro na inicialização de registros:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar usuário
app.post('/api/users', async (req, res) => {
  try {
    const { email, password, full_name, roles, department, position } = req.body;
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário
    const newUser = new User({
      email,
      password: hashedPassword,
      full_name,
      roles: roles || ['operador'],
      department,
      position,
      security: { password_changed_at: new Date() }
    });
    
    await newUser.save();
    
    // Remover senha da resposta
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    console.log(`✅ Novo usuário criado: ${email}`);
    res.status(201).json(userResponse);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Endpoint FUNCIONAL de alteração de senha
app.post('/api/change-password', async (req, res) => {
  try {
    console.log('🔄 ALTERAÇÃO DE SENHA INICIADA');
    const { userId, currentPassword, newPassword } = req.body;
    
    console.log('📋 Dados recebidos:', { userId, currentPassword: '***', newPassword: '***' });
    
    // Validações
    if (!userId || !currentPassword || !newPassword) {
      console.log('❌ Campos obrigatórios não fornecidos');
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    if (newPassword.length < 6) {
      console.log('❌ Nova senha muito curta');
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    
    // Garantir conexão MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Reconectando ao MongoDB...');
      await mongoose.connect(MONGODB_URI);
    }
    
    console.log('✅ MongoDB conectado - Estado:', mongoose.connection.readyState);
    
    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    console.log('🔐 Hash atual:', user.password.substring(0, 20) + '...');
    
    // Verificar senha atual
    const isValid = await bcrypt.compare(currentPassword, user.password);
    console.log('🔍 Verificação senha atual:', isValid ? 'VÁLIDA ✅' : 'INVÁLIDA ❌');
    
    if (!isValid) {
      console.log('❌ Senha atual incorreta');
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    console.log('🔐 Gerando hash da nova senha...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Novo hash gerado:', hashedPassword.substring(0, 20) + '...');
    
    // Atualizar no MongoDB
    console.log('💾 Atualizando senha no MongoDB...');
    const result = await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          'security.password_changed_at': new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('📊 Resultado da atualização:', JSON.stringify(result, null, 2));
    
    if (result.modifiedCount === 1) {
      console.log('🎉 SUCESSO: Senha alterada no MongoDB!');
      
      // Verificação final
      const updatedUser = await User.findById(userId);
      console.log('🔍 Verificação final - Hash no banco:', updatedUser.password.substring(0, 20) + '...');
      
      res.json({ 
        message: 'Senha alterada com sucesso no MongoDB!',
        success: true,
        modified: result.modifiedCount,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Nenhum documento foi modificado');
      res.status(500).json({ message: 'Erro: Nenhum documento foi modificado' });
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error.message);
    console.error('📋 Stack:', error.stack);
    res.status(500).json({ message: 'Erro interno: ' + error.message });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PRINCIPAL FUNCIONAL rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/test - Teste simples`);
  console.log(`   POST /api/users - Criar usuário`);
  console.log(`   POST /api/auth/login - Login de usuário`);
  console.log(`   POST /api/change-password - Alteração de senha (FUNCIONAL)`);
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
  console.log(`   POST /api/production-records/upsert - Criar ou atualizar registro (anti-duplicação)`);
  console.log(`   PUT  /api/production-records/:id - Atualizar registro`);
  console.log(`   DELETE /api/production-records/:id - Deletar registro`);
  console.log(`   GET  /api/production-statistics - Estatísticas de produção`);
  console.log(`   GET  /api/oee-history - Buscar histórico OEE`);
  console.log(`   GET  /api/oee-history/:machineId - Buscar histórico OEE por máquina`);
  console.log(`   POST /api/init/production-records - Inicializar registros padrão`);
  console.log('');
  console.log('🔧 Para alterar senha:');
  console.log('   POST http://localhost:3001/api/change-password');
  console.log('   Body: { "userId": "ID", "currentPassword": "atual", "newPassword": "nova" }');
  console.log('');
  console.log('✨ Servidor COMPLETO pronto para uso!');
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});