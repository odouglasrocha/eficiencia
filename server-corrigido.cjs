// Servidor Principal Corrigido - Sistema OEE
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Importar módulo de gerenciamento de usuários
const { User, Profile, AuditLog, authenticateToken, authorize, logAudit, initializeDefaultProfiles } = require('./user-management-module.cjs');
const userManagementRoutes = require('./user-management-routes.cjs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas do módulo de gerenciamento de usuários
app.use('/api', userManagementRoutes);

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco';

// Schema do usuário removido - usando o do módulo de gerenciamento de usuários

// Schema da máquina
const machineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true, uppercase: true },
  status: { type: String, enum: ['ativa', 'inativa', 'manutencao', 'parada'], default: 'ativa' },
  description: { type: String, trim: true },
  location: { type: String, trim: true },
  target_production: { type: Number, default: 1, min: 1 },
  capacity: { type: Number, default: 1000, min: 1 },
  permissions: { type: [String], default: [] },
  access_level: { type: String, enum: ['administrador', 'supervisor', 'operador'], default: 'operador' },
  last_production_update: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const Machine = mongoose.model('Machine', machineSchema);

// Schema do registro de produção
const productionRecordSchema = new mongoose.Schema({
  machine_id: { type: String, required: true, index: true },
  start_time: { type: Date, required: true, index: true },
  end_time: { type: Date },
  good_production: { type: Number, required: true, min: 0 },
  film_waste: { type: Number, required: true, min: 0 },
  organic_waste: { type: Number, required: true, min: 0 },
  planned_time: { type: Number, required: true, min: 0 },
  downtime_minutes: { type: Number, required: true, min: 0 },
  downtime_reason: { type: String },
  material_code: { type: String, index: true },
  shift: { type: String, enum: ['A', 'B', 'C', 'Manhã', 'Tarde', 'Noite'], index: true },
  operator_id: { type: String, index: true },
  notes: { type: String },
  batch_number: { type: String, index: true },
  quality_check: { type: Boolean, default: true },
  temperature: { type: Number },
  pressure: { type: Number },
  speed: { type: Number },
  oee_calculated: { type: Number, min: 0, max: 100 },
  availability_calculated: { type: Number, min: 0, max: 100 },
  performance_calculated: { type: Number, min: 0, max: 100 },
  quality_calculated: { type: Number, min: 0, max: 100 },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Middleware para calcular métricas OEE
productionRecordSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  if (this.planned_time > 0) {
    this.availability_calculated = Math.min(100, Math.max(0, ((this.planned_time - this.downtime_minutes) / this.planned_time) * 100));
    
    const actualRuntime = this.planned_time - this.downtime_minutes;
    let performance = 0;
    const defaultProductionRate = 65;
    const targetProduction = this.planned_time * defaultProductionRate * 0.85;
    
    if (targetProduction > 0 && actualRuntime > 0) {
      const expectedProduction = (targetProduction * actualRuntime) / this.planned_time;
      performance = Math.min((this.good_production / expectedProduction) * 100, 100);
    }
    
    this.performance_calculated = Math.min(100, Math.max(0, performance));
    
    const totalProduction = this.good_production + this.film_waste + this.organic_waste;
    this.quality_calculated = totalProduction > 0 ? Math.min(100, Math.max(0, (this.good_production / totalProduction) * 100)) : 100;
    
    this.oee_calculated = (this.availability_calculated * this.performance_calculated * this.quality_calculated) / 10000;
  }
  
  next();
});

const ProductionRecord = mongoose.model('ProductionRecord', productionRecordSchema);

// Schema do histórico OEE
const oeeHistorySchema = new mongoose.Schema({
  machine_id: { type: String, required: true, index: true },
  production_record_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductionRecord', required: true, index: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  oee: { type: Number, required: true, min: 0, max: 100 },
  availability: { type: Number, required: true, min: 0, max: 100 },
  performance: { type: Number, required: true, min: 0, max: 100 },
  quality: { type: Number, required: true, min: 0, max: 100 },
  good_production: { type: Number, required: true, min: 0 },
  total_waste: { type: Number, required: true, min: 0 },
  downtime_minutes: { type: Number, required: true, min: 0 },
  planned_time: { type: Number, required: true, min: 0 },
  shift: { type: String, enum: ['A', 'B', 'C', 'Manhã', 'Tarde', 'Noite'], index: true },
  operator_id: { type: String, index: true },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

// Índices compostos para otimização
oeeHistorySchema.index({ machine_id: 1, timestamp: -1 });
oeeHistorySchema.index({ production_record_id: 1 });

const OeeHistory = mongoose.model('OeeHistory', oeeHistorySchema);

// Função para criar entrada automática no histórico OEE
async function createOeeHistoryEntry(productionRecord) {
  try {
    console.log('📊 Criando entrada automática no histórico OEE...');
    
    const historyEntry = new OeeHistory({
      machine_id: productionRecord.machine_id,
      production_record_id: productionRecord._id,
      timestamp: new Date(),
      oee: productionRecord.oee_calculated || 0,
      availability: productionRecord.availability_calculated || 0,
      performance: productionRecord.performance_calculated || 0,
      quality: productionRecord.quality_calculated || 0,
      good_production: productionRecord.good_production || 0,
      total_waste: (productionRecord.film_waste || 0) + (productionRecord.organic_waste || 0),
      downtime_minutes: productionRecord.downtime_minutes || 0,
      planned_time: productionRecord.planned_time || 0,
      shift: productionRecord.shift,
      operator_id: productionRecord.operator_id
    });
    
    await historyEntry.save();
    console.log(`✅ Entrada no histórico OEE criada automaticamente para máquina ${productionRecord.machine_id}`);
    return historyEntry;
    
  } catch (error) {
    console.error('❌ Erro ao criar entrada no histórico OEE:', error);
    // Não interromper o fluxo principal se houver erro no histórico
    return null;
  }
}

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado ao MongoDB Atlas');
    
    // Inicializar perfis padrão do sistema
    await initializeDefaultProfiles();
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
  });

// ===== ENDPOINTS BÁSICOS =====

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check chamado');
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Teste simples
app.get('/api/test', (req, res) => {
  console.log('🔍 GET /api/test chamado');
  res.json({ message: 'Servidor funcionando!', timestamp: new Date() });
});

// ===== ENDPOINTS DE USUÁRIOS =====

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Tentativa de login');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }
    
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

// Alteração de senha
app.post('/api/change-password', async (req, res) => {
  try {
    console.log('🔄 ALTERAÇÃO DE SENHA INICIADA');
    const { userId, currentPassword, newPassword } = req.body;
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
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
    
    if (result.modifiedCount === 1) {
      console.log('🎉 Senha alterada com sucesso!');
      res.json({ 
        message: 'Senha alterada com sucesso!',
        success: true,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ message: 'Erro ao alterar senha' });
    }
    
  } catch (error) {
    console.error('❌ Erro na alteração de senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE MÁQUINAS =====

// Listar máquinas
app.get('/api/machines', async (req, res) => {
  try {
    console.log('🔍 GET /api/machines chamado');
    const { status, search, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (status) query.status = status;
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
    
    console.log(`✅ Retornando ${machines.length} máquinas`);
    res.json({ machines, total, limit: parseInt(limit), offset: parseInt(offset) });
    
  } catch (error) {
    console.error('❌ Erro ao buscar máquinas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar máquina por ID
app.get('/api/machines/:id', async (req, res) => {
  try {
    console.log('🔍 GET /api/machines/:id chamado');
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
    console.log('🔍 POST /api/machines chamado');
    const machineData = req.body;
    
    const existingMachine = await Machine.findOne({ code: machineData.code });
    if (existingMachine) {
      return res.status(400).json({ message: 'Código da máquina já existe' });
    }
    
    const machine = new Machine(machineData);
    await machine.save();
    
    console.log(`✅ Nova máquina criada: ${machine.name}`);
    res.status(201).json(machine);
    
  } catch (error) {
    console.error('❌ Erro ao criar máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE REGISTROS DE PRODUÇÃO =====

// Listar registros de produção
app.get('/api/production-records', async (req, res) => {
  try {
    console.log('🔍 GET /api/production-records chamado');
    const { machine_id, start_date, end_date, shift, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    if (machine_id) query.machine_id = machine_id;
    if (shift) query.shift = shift;
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
    
    console.log(`✅ Retornando ${records.length} registros`);
    res.json({ records, total, limit: parseInt(limit), offset: parseInt(offset) });
    
  } catch (error) {
    console.error('❌ Erro ao buscar registros:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar registro por ID
app.get('/api/production-records/:id', async (req, res) => {
  try {
    console.log('🔍 GET /api/production-records/:id chamado');
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
    console.log('🔍 POST /api/production-records chamado');
    const record = new ProductionRecord(req.body);
    await record.save();
    
    console.log(`✅ Novo registro criado para máquina ${record.machine_id}`);
    res.status(201).json(record);
    
  } catch (error) {
    console.error('❌ Erro ao criar registro:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Upsert de registro de produção (criar ou atualizar) - VERSÃO CORRIGIDA
app.post('/api/production-records/upsert', async (req, res) => {
  try {
    console.log('🔄 POST /api/production-records/upsert chamado');
    console.log('📋 Dados recebidos:', JSON.stringify(req.body, null, 2));
    
    const { machine_id, start_time, batch_number, ...recordData } = req.body;
    
    // Validar dados obrigatórios
    if (!machine_id || !start_time) {
      return res.status(400).json({ 
        message: 'machine_id e start_time são obrigatórios' 
      });
    }
    
    let existingRecord = null;
    
    // Estratégia 1: Se batch_number fornecido, buscar por machine_id + batch_number
    if (batch_number) {
      console.log('🔍 Buscando por machine_id + batch_number...');
      existingRecord = await ProductionRecord.findOne({
        machine_id: machine_id,
        batch_number: batch_number
      });
      console.log('🔍 Resultado busca por batch:', existingRecord ? `Encontrado: ${existingRecord._id}` : 'Não encontrado');
    }
    
    // Estratégia 2: Se não encontrou por batch, buscar por machine_id + janela de tempo
    if (!existingRecord) {
      console.log('🔍 Buscando por machine_id + janela de tempo...');
      const startTimeDate = new Date(start_time);
      const timeWindow = 60 * 60 * 1000; // 1 hora em milliseconds
      
      existingRecord = await ProductionRecord.findOne({
        machine_id: machine_id,
        start_time: {
          $gte: new Date(startTimeDate.getTime() - timeWindow),
          $lte: new Date(startTimeDate.getTime() + timeWindow)
        }
      });
      console.log('🔍 Resultado busca por tempo:', existingRecord ? `Encontrado: ${existingRecord._id}` : 'Não encontrado');
    }
    
    if (existingRecord) {
      // ATUALIZAR registro existente
      console.log('📝 Atualizando registro existente:', existingRecord._id);
      
      const updateData = {
        ...recordData,
        machine_id,
        start_time: new Date(start_time),
        updated_at: new Date()
      };
      
      if (batch_number) {
        updateData.batch_number = batch_number;
      }
      
      const updatedRecord = await ProductionRecord.findByIdAndUpdate(
         existingRecord._id,
         updateData,
         { new: true, runValidators: true }
       );
       
       // ✅ CRIAR ENTRADA AUTOMÁTICA NO HISTÓRICO OEE (UPDATE)
       await createOeeHistoryEntry(updatedRecord);
       
       console.log(`✅ Registro ATUALIZADO (upsert) para máquina ${machine_id}`);
       return res.json({
         message: 'Registro atualizado com sucesso',
         record: updatedRecord,
         action: 'updated'
       });
      
    } else {
      // CRIAR novo registro
      console.log('➕ Criando novo registro...');
      
      const newRecordData = {
        machine_id,
        start_time: new Date(start_time),
        ...recordData
      };
      
      if (batch_number) {
        newRecordData.batch_number = batch_number;
      }
      
      const newRecord = new ProductionRecord(newRecordData);
       await newRecord.save();
       
       // ✅ CRIAR ENTRADA AUTOMÁTICA NO HISTÓRICO OEE (CREATE)
       await createOeeHistoryEntry(newRecord);
       
       console.log(`✅ Novo registro CRIADO (upsert) para máquina ${machine_id}`);
       return res.status(201).json({
         message: 'Registro criado com sucesso',
         record: newRecord,
         action: 'created'
       });
    }
    
  } catch (error) {
    console.error('❌ Erro no upsert de registro:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// ===== ENDPOINTS DE HISTÓRICO OEE =====

// Buscar histórico OEE
app.get('/api/oee-history', async (req, res) => {
  try {
    console.log('🔍 GET /api/oee-history chamado');
    const { machine_id, start_date, end_date, date, limit = 100, offset = 0 } = req.query;
    
    let query = {};
    
    if (machine_id) {
      query.machine_id = machine_id;
    }
    
    // Se 'date' for fornecido, usar como filtro de data específica
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      query.timestamp = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    } else if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const history = await OeeHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('production_record_id')
      .lean();
    
    const total = await OeeHistory.countDocuments(query);
    
    console.log(`✅ Retornando ${history.length} registros de histórico OEE`);
    res.json({ history, total });
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico OEE:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar histórico OEE por máquina específica
app.get('/api/oee-history/:machineId', async (req, res) => {
  try {
    console.log('🔍 GET /api/oee-history/:machineId chamado');
    const { machineId } = req.params;
    const { start_date, end_date, date, limit = 100 } = req.query;
    
    let query = { machine_id: machineId };
    
    if (date) {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);
      
      query.timestamp = {
        $gte: startOfDay,
        $lt: endOfDay
      };
    } else if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) query.timestamp.$gte = new Date(start_date);
      if (end_date) query.timestamp.$lte = new Date(end_date);
    }
    
    const history = await OeeHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('production_record_id')
      .lean();
    
    console.log(`✅ Retornando ${history.length} registros de histórico OEE para máquina ${machineId}`);
    res.json(history);
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico OEE da máquina:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// ===== INICIALIZADORES =====

// Inicializar usuários padrão
app.post('/api/init/users', async (req, res) => {
  try {
    console.log('🔍 POST /api/init/users chamado');
    const defaultUsers = [
      {
        email: 'admin@sistema-oee.com',
        password: 'admin123',
        full_name: 'Administrador do Sistema',
        roles: ['administrador'],
        department: 'TI',
        position: 'Administrador de Sistema'
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
    
    console.log('✅ Inicialização de usuários concluída');
    res.json({ message: 'Inicialização concluída', results });
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Inicializar máquinas padrão
app.post('/api/init/machines', async (req, res) => {
  try {
    console.log('🔍 POST /api/init/machines chamado');
    const defaultMachines = [
      {
        name: 'Extrusora Principal',
        code: 'EXT-001',
        status: 'ativa',
        description: 'Extrusora principal para produção de filmes plásticos',
        location: 'Setor A - Linha 1',
        capacity: 1500,
        target_production: 1200
      },
      {
        name: 'Injetora Automática',
        code: 'INJ-002',
        status: 'ativa',
        description: 'Injetora automática para peças plásticas',
        location: 'Setor B - Linha 2',
        capacity: 800,
        target_production: 600
      }
    ];
    
    const results = [];
    
    for (const machineData of defaultMachines) {
      try {
        const existingMachine = await Machine.findOne({ code: machineData.code });
        if (existingMachine) {
          results.push({ code: machineData.code, name: machineData.name, status: 'já existe' });
          continue;
        }
        
        const newMachine = new Machine(machineData);
        await newMachine.save();
        
        results.push({ code: newMachine.code, name: newMachine.name, status: 'criada' });
        
      } catch (error) {
        results.push({ code: machineData.code, name: machineData.name, status: 'erro', error: error.message });
      }
    }
    
    console.log('✅ Inicialização de máquinas concluída');
    res.json({ message: 'Inicialização concluída', results });
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor CORRIGIDO rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log('');
  console.log('🔐 AUTENTICAÇÃO:');
  console.log(`   POST /api/auth/login - Login de usuário`);
  console.log(`   POST /api/auth/logout - Logout de usuário`);
  console.log(`   GET  /api/auth/verify - Verificar token`);
  console.log('');
  console.log('👥 GERENCIAMENTO DE USUÁRIOS:');
  console.log(`   GET  /api/users - Listar usuários (paginado, filtros)`);
  console.log(`   GET  /api/users/:id - Buscar usuário por ID`);
  console.log(`   POST /api/users - Criar novo usuário`);
  console.log(`   PUT  /api/users/:id - Atualizar usuário`);
  console.log(`   PUT  /api/users/:id/password - Alterar senha`);
  console.log(`   DELETE /api/users/:id - Excluir usuário (soft delete)`);
  console.log(`   GET  /api/users/stats/overview - Estatísticas de usuários`);
  console.log('');
  console.log('🎭 PERFIS E PERMISSÕES:');
  console.log(`   GET  /api/profiles - Listar perfis`);
  console.log(`   GET  /api/profiles/:id - Buscar perfil por ID`);
  console.log(`   PUT  /api/profiles/:id/permissions - Atualizar permissões`);
  console.log('');
  console.log('📋 AUDITORIA:');
  console.log(`   GET  /api/audit-logs - Logs de auditoria`);
  console.log('');
  console.log('🏭 SISTEMA OEE:');
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/test - Teste simples`);
  console.log(`   GET  /api/machines - Listar máquinas`);
  console.log(`   GET  /api/machines/:id - Buscar máquina por ID`);
  console.log(`   POST /api/machines - Criar nova máquina`);
  console.log(`   GET  /api/production-records - Listar registros de produção`);
  console.log(`   GET  /api/production-records/:id - Buscar registro por ID`);
  console.log(`   POST /api/production-records - Criar registro de produção`);
  console.log(`   POST /api/production-records/upsert - Criar ou atualizar registro (anti-duplicação)`);
  console.log(`   GET  /api/oee-history - Buscar histórico OEE`);
  console.log(`   GET  /api/oee-history/:machineId - Buscar histórico OEE por máquina`);
  console.log(`   POST /api/init/users - Inicializar usuários padrão`);
  console.log(`   POST /api/init/machines - Inicializar máquinas padrão`);
  console.log('');
  console.log('✨ MÓDULO DE GERENCIAMENTO DE USUÁRIOS HABILITADO!');
  console.log('🔒 Autenticação JWT, Perfis, Permissões e Auditoria Completos');
  console.log('📊 Sistema OEE Integrado com Controle de Acesso Avançado');
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});