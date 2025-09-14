// Servidor de desenvolvimento para API MongoDB
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// SOLUÇÃO DEFINITIVA: Endpoint funcional de alteração de senha
app.post('/api/change-password-working', async (req, res) => {
  try {
    console.log('🔄 ENDPOINT FUNCIONAL CHAMADO: /api/change-password-working');
    const { userId, currentPassword, newPassword } = req.body;
    
    console.log('📋 Dados:', { userId, currentPassword: '***', newPassword: '***' });
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
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
      console.log('❌ Usuário não encontrado');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    
    // Verificar senha atual
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      console.log('❌ Senha atual incorreta');
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    console.log('✅ Senha atual válida');
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Nova senha hasheada');
    
    // Atualizar no MongoDB - FORÇAR COLEÇÃO USERS
    console.log('💾 Iniciando atualização no MongoDB...');
    console.log('🔍 Coleção alvo: users');
    console.log('🆔 ID do usuário:', userId);
    console.log('🔐 Hash da nova senha:', hashedPassword.substring(0, 20) + '...');
    
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
    
    console.log('📊 Resultado COMPLETO da atualização:', JSON.stringify(result, null, 2));
    console.log('📈 Documentos encontrados (matchedCount):', result.matchedCount);
    console.log('📝 Documentos modificados (modifiedCount):', result.modifiedCount);
    
    // Verificação adicional - buscar usuário novamente
    const userAfterUpdate = await User.findById(userId);
    console.log('🔍 Verificação pós-atualização:');
    console.log('📧 Email:', userAfterUpdate.email);
    console.log('🔐 Hash atual no banco:', userAfterUpdate.password.substring(0, 20) + '...');
    console.log('⏰ Última alteração:', userAfterUpdate.security?.password_changed_at);
    
    if (result.modifiedCount === 1) {
      console.log('🎉 SUCESSO: Senha alterada no MongoDB!');
      res.json({ 
        message: 'Senha alterada com sucesso!',
        success: true,
        modified: result.modifiedCount,
        timestamp: new Date()
      });
    } else {
      console.log('❌ Nenhum documento foi modificado');
      res.status(500).json({ message: 'Erro: Nenhum documento foi modificado' });
    }
    
  } catch (error) {
    console.error('❌ ERRO:', error);
    res.status(500).json({ message: 'Erro interno: ' + error.message });
  }
});

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

const User = mongoose.model('User', userSchema, 'users');

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

// Schema do histórico OEE
const oeeHistorySchema = new mongoose.Schema({
  machine_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Machine',
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
    // Usar a mesma lógica dos serviços para consistência
    const actualRuntime = this.planned_time - this.downtime_minutes;
    let performance = 0;
    
    // Buscar a meta de produção real baseada no material (se disponível)
    // Por enquanto, usar uma taxa padrão mais realista baseada nos dados do sistema
    const defaultProductionRate = 65; // PPm padrão baseado nos materiais do sistema
    const targetProduction = this.planned_time * defaultProductionRate * 0.85; // 85% de eficiência esperada
    
    if (targetProduction > 0 && actualRuntime > 0) {
      const expectedProduction = (targetProduction * actualRuntime) / this.planned_time;
      performance = Math.min((this.good_production / expectedProduction) * 100, 100);
    }
    
    this.performance_calculated = Math.min(100, Math.max(0, performance));
    
    // Qualidade = Produção Boa / (Produção Boa + Refugo) * 100
    const totalProduction = this.good_production + this.film_waste + this.organic_waste;
    this.quality_calculated = totalProduction > 0 ? Math.min(100, Math.max(0, (this.good_production / totalProduction) * 100)) : 100;
    
    // OEE = Disponibilidade * Performance * Qualidade / 10000
    this.oee_calculated = Math.min(100, Math.max(0, (this.availability_calculated * this.performance_calculated * this.quality_calculated) / 10000));
  } else {
    this.availability_calculated = 0;
    this.performance_calculated = 0;
    this.quality_calculated = 0;
    this.oee_calculated = 0;
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

// Teste simples
app.put('/api/test-put', (req, res) => {
  res.json({ message: 'PUT endpoint funcionando' });
});

// Endpoint de teste para alteração de senha (funcional)
app.post('/api/test-change-password', async (req, res) => {
  try {
    console.log('🔄 TESTE: Iniciando alteração de senha...');
    const { userId, currentPassword, newPassword } = req.body;
    
    console.log('📋 Dados recebidos:', { userId, currentPassword: '***', newPassword: '***' });
    
    // Conectar ao MongoDB
    if (!mongoose.connection.readyState) {
      console.log('🔌 Conectando ao MongoDB...');
      await mongoose.connect(MONGODB_URI);
    }
    
    console.log('✅ MongoDB conectado');
    
    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Usuário não encontrado:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log('🔍 Usuário encontrado:', user.email);
    console.log('🔐 Hash atual da senha:', user.password.substring(0, 20) + '...');
    
    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    console.log('🔍 Verificação de senha atual:', isValidPassword ? 'VÁLIDA' : 'INVÁLIDA');
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    console.log('🔐 Gerando hash da nova senha...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Novo hash gerado:', hashedPassword.substring(0, 20) + '...');
    
    // Atualizar senha diretamente
    const updateResult = await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          'security.password_changed_at': new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('📊 Resultado da atualização:', updateResult);
    
    if (updateResult.modifiedCount === 1) {
      console.log('✅ SUCESSO: Senha alterada no MongoDB!');
      
      // Verificar se realmente foi salvo
      const updatedUser = await User.findById(userId);
      console.log('🔍 Verificação: Novo hash salvo:', updatedUser.password.substring(0, 20) + '...');
      
      res.json({ 
        message: 'Senha alterada com sucesso no MongoDB!',
        modified: updateResult.modifiedCount,
        newHashPreview: hashedPassword.substring(0, 20) + '...'
      });
    } else {
      console.log('❌ ERRO: Nenhum documento foi modificado');
      res.status(500).json({ message: 'Erro: Nenhum documento foi modificado' });
    }
    
  } catch (error) {
    console.error('❌ ERRO no teste de alteração de senha:', error);
    res.status(500).json({ message: 'Erro interno: ' + error.message });
  }
});

// Alterar senha do usuário (FUNCIONAL - CORRIGIDO)
app.post('/api/users/:id/change-password', async (req, res) => {
  console.log('🔄 ENDPOINT CHAMADO: POST /api/users/:id/change-password');
  
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    console.log(`🔄 ALTERAÇÃO DE SENHA - Usuário: ${userId}`);
    console.log('📋 Dados recebidos:', { currentPassword: '***', newPassword: '***' });
    
    // Validações básicas
    if (!currentPassword || !newPassword) {
      console.log('❌ Validação falhou: senhas não fornecidas');
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }
    
    if (newPassword.length < 6) {
      console.log('❌ Validação falhou: nova senha muito curta');
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    
    // Garantir conexão com MongoDB
    if (mongoose.connection.readyState !== 1) {
      console.log('🔌 Reconectando ao MongoDB...');
      await mongoose.connect(MONGODB_URI);
    }
    
    console.log('✅ MongoDB conectado - Estado:', mongoose.connection.readyState);
    
    // Buscar usuário no MongoDB
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ Usuário não encontrado no MongoDB:', userId);
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    console.log(`🔍 Usuário encontrado: ${user.email}`);
    console.log('🔐 Hash atual da senha:', user.password.substring(0, 20) + '...');
    
    // Verificar senha atual com bcrypt
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    console.log('🔍 Verificação de senha atual:', isValidPassword ? 'VÁLIDA ✅' : 'INVÁLIDA ❌');
    
    if (!isValidPassword) {
      console.log('❌ Senha atual incorreta - Acesso negado');
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Gerar hash da nova senha
    console.log('🔐 Gerando hash da nova senha com bcrypt...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('✅ Novo hash gerado:', hashedPassword.substring(0, 20) + '...');
    
    // Atualizar senha no MongoDB usando updateOne
    console.log('💾 Atualizando senha no MongoDB...');
    const updateResult = await User.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          'security.password_changed_at': new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('📊 Resultado da operação updateOne:', JSON.stringify(updateResult, null, 2));
    
    // Verificar se a atualização foi bem-sucedida
    if (updateResult.modifiedCount === 1) {
      console.log('🎉 SUCESSO TOTAL: Senha alterada no MongoDB!');
      
      // Verificação final - buscar usuário novamente
      const updatedUser = await User.findById(userId);
      console.log('🔍 Verificação final - Novo hash no banco:', updatedUser.password.substring(0, 20) + '...');
      
      // Resposta de sucesso
      res.json({ 
        message: 'Senha alterada com sucesso no MongoDB!',
        success: true,
        modified: updateResult.modifiedCount,
        timestamp: new Date().toISOString()
      });
      
    } else {
      console.log('❌ ERRO: Nenhum documento foi modificado no MongoDB');
      console.log('📊 UpdateResult completo:', updateResult);
      res.status(500).json({ 
        message: 'Erro: Nenhum documento foi modificado',
        updateResult: updateResult
      });
    }
    
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na alteração de senha:', error.message);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Erro interno do servidor: ' + error.message,
      error: error.name
    });
  }
});

// Alterar senha do usuário (PUT - mantido para compatibilidade)
app.put('/api/users/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;
    
    // Validações
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }
    
    // Buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    user.password = hashedPassword;
    user.security = user.security || {};
    user.security.password_changed_at = new Date();
    user.updated_at = new Date();
    
    await user.save();
    
    console.log(`✅ Senha alterada para usuário: ${user.email}`);
    res.json({ message: 'Senha alterada com sucesso' });
    
  } catch (error) {
    console.error('❌ Erro ao alterar senha:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
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

// Deletar máquina e todos os registros relacionados
app.delete('/api/machines/:id', async (req, res) => {
  try {
    const machineId = req.params.id;
    
    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(machineId)) {
      return res.status(400).json({ message: 'ID da máquina inválido' });
    }
    
    const machine = await Machine.findById(machineId);
    
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    console.log(`🔄 Iniciando exclusão da máquina: ${machine.name} (${machine.code})`);
    
    // Verificar registros relacionados antes da exclusão
    const productionRecords = await ProductionRecord.countDocuments({ machine_id: machineId });
    const oeeHistoryRecords = await OeeHistory.countDocuments({ machine_id: machineId });
    
    console.log(`📊 Registros relacionados encontrados:`);
    console.log(`   - Registros de produção: ${productionRecords}`);
    console.log(`   - Histórico OEE: ${oeeHistoryRecords}`);
    
    // Excluir registros relacionados em ordem (integridade referencial)
    
    // 1. Excluir histórico OEE
    if (oeeHistoryRecords > 0) {
      const deletedOeeHistory = await OeeHistory.deleteMany({ machine_id: machineId });
      console.log(`✅ ${deletedOeeHistory.deletedCount} registros de histórico OEE excluídos`);
    }
    
    // 2. Excluir registros de produção
    if (productionRecords > 0) {
      const deletedProduction = await ProductionRecord.deleteMany({ machine_id: machineId });
      console.log(`✅ ${deletedProduction.deletedCount} registros de produção excluídos`);
    }
    
    // 3. Excluir a máquina
    await Machine.findByIdAndDelete(machineId);
    
    console.log(`✅ Máquina excluída com sucesso: ${machine.name} (${machine.code})`);
    console.log(`📋 Resumo da exclusão:`);
    console.log(`   - Máquina: ${machine.name}`);
    console.log(`   - Registros de produção removidos: ${productionRecords}`);
    console.log(`   - Registros de histórico OEE removidos: ${oeeHistoryRecords}`);
    
    res.json({ 
      message: 'Máquina e todos os registros relacionados excluídos com sucesso',
      details: {
        machine: {
          id: machineId,
          name: machine.name,
          code: machine.code
        },
        deletedRecords: {
          productionRecords,
          oeeHistoryRecords
        }
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
    
    // Verificar se já existe um registro com o mesmo batch_number (se fornecido)
    if (batch_number) {
      const existingByBatch = await ProductionRecord.findOne({ batch_number });
      if (existingByBatch) {
        console.log('⚠️ Registro já existe com batch_number:', batch_number);
        return res.status(409).json({ 
          message: 'Já existe um registro com este número de lote',
          existing_record: existingByBatch
        });
      }
    }
    
    // Verificar se já existe um registro ativo para a mesma máquina no mesmo período
    const startDate = new Date(start_time);
    const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    const existingInPeriod = await ProductionRecord.findOne({
      machine_id,
      start_time: {
        $gte: dayStart,
        $lt: dayEnd
      },
      shift: shift || null
    });
    
    if (existingInPeriod) {
      console.log('⚠️ Já existe registro para esta máquina no período:', {
        machine_id,
        date: dayStart.toISOString().split('T')[0],
        shift: shift || 'sem turno',
        existing_id: existingInPeriod._id
      });
      return res.status(409).json({ 
        message: 'Já existe um registro para esta máquina no mesmo período e turno',
        existing_record: existingInPeriod,
        suggestion: 'Use PUT /api/production-records/' + existingInPeriod._id + ' para atualizar o registro existente'
      });
    }
    
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
      console.log(`✅ Entrada no histórico OEE criada para registro ${newRecord._id}`);
    } catch (historyError) {
      console.error('⚠️ Erro ao criar entrada no histórico OEE:', historyError);
      // Não falha a operação principal se o histórico falhar
    }
    
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

// Upsert (criar ou atualizar) registro de produção
app.post('/api/production-records/upsert', async (req, res) => {
  try {
    console.log('🔍 Dados recebidos para upsert de registro de produção:', JSON.stringify(req.body, null, 2));
    
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
    
    // Validações obrigatórias
    if (!machine_id || !start_time || good_production === undefined || 
        film_waste === undefined || organic_waste === undefined || 
        planned_time === undefined || downtime_minutes === undefined) {
      console.log('❌ Validação falhou - campos obrigatórios ausentes');
      return res.status(400).json({ 
        message: 'Campos obrigatórios: machine_id, start_time, good_production, film_waste, organic_waste, planned_time, downtime_minutes' 
      });
    }
    
    // Validar machine_id
    if (!mongoose.Types.ObjectId.isValid(machine_id)) {
      return res.status(400).json({ message: 'ID da máquina inválido' });
    }
    
    // Verificar se a máquina existe
    const machine = await Machine.findById(machine_id);
    if (!machine) {
      return res.status(404).json({ message: 'Máquina não encontrada' });
    }
    
    let existingRecord = null;
    
    // Procurar registro existente por batch_number (prioridade)
    if (batch_number) {
      existingRecord = await ProductionRecord.findOne({ batch_number });
      console.log('🔍 Busca por batch_number:', batch_number, existingRecord ? 'encontrado' : 'não encontrado');
    }
    
    // Se não encontrou por batch_number, procurar por máquina + período + turno
    if (!existingRecord) {
      const startDate = new Date(start_time);
      const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      // Buscar por máquina + data (independente do turno) para evitar múltiplos registros por dia
      const searchQuery = {
        machine_id,
        start_time: {
          $gte: dayStart,
          $lt: dayEnd
        }
        // Removido filtro por shift para permitir apenas 1 registro por máquina por dia
      };
      
      console.log('🔍 Query de busca (máquina + data):', JSON.stringify({
        machine_id,
        dayStart: dayStart.toISOString(),
        dayEnd: dayEnd.toISOString(),
        note: 'Busca independente do turno - apenas 1 registro por máquina por dia'
      }));
      
      // Primeiro, vamos ver quantos registros existem para esta máquina
      const allRecordsForMachine = await ProductionRecord.find({ machine_id });
      console.log(`🔍 Total de registros para máquina ${machine_id}:`, allRecordsForMachine.length);
      
      if (allRecordsForMachine.length > 0) {
        console.log('🔍 Registros existentes:', allRecordsForMachine.map(r => ({
          id: r._id,
          start_time: r.start_time,
          shift: r.shift,
          machine_id: r.machine_id
        })));
      }
      
      existingRecord = await ProductionRecord.findOne(searchQuery);
      console.log('🔍 Busca por máquina + data (qualquer turno):', existingRecord ? `encontrado - ID: ${existingRecord._id}` : 'não encontrado');
    }
    
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
      existingRecord.quality_check = quality_check !== undefined ? Boolean(quality_check) : existingRecord.quality_check;
      existingRecord.temperature = temperature ? Number(temperature) : existingRecord.temperature;
      existingRecord.pressure = pressure ? Number(pressure) : existingRecord.pressure;
      existingRecord.speed = speed ? Number(speed) : existingRecord.speed;
      
      await existingRecord.save();
      
      // Atualizar entrada no histórico OEE
      try {
        await OeeHistory.findOneAndUpdate(
          { production_record_id: existingRecord._id },
          {
            timestamp: existingRecord.start_time,
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
          },
          { upsert: true }
        );
        console.log('✅ Histórico OEE atualizado para registro:', existingRecord._id);
      } catch (historyError) {
        console.error('⚠️ Erro ao atualizar histórico OEE:', historyError);
      }
      
      console.log(`✅ Registro de produção atualizado para máquina ${machine.name}`);
      res.json({ ...existingRecord.toObject(), action: 'updated' });
      
    } else {
      // Criar novo registro
      console.log('➕ Criando novo registro de produção');
      
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
        console.log('✅ Entrada no histórico OEE criada para registro:', newRecord._id);
      } catch (historyError) {
        console.error('⚠️ Erro ao criar entrada no histórico OEE:', historyError);
      }
      
      console.log(`✅ Novo registro de produção criado para máquina ${machine.name}`);
      res.status(201).json({ ...newRecord.toObject(), action: 'created' });
    }
    
  } catch (error) {
    console.error('❌ Erro no upsert de registro de produção:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

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
      if (start_date) {
        query.timestamp.$gte = new Date(start_date);
      }
      if (end_date) {
        query.timestamp.$lte = new Date(end_date);
      }
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

// Buscar histórico OEE por máquina específica
app.get('/api/oee-history/:machineId', async (req, res) => {
  try {
    const { machineId } = req.params;
    const { start_date, end_date, limit = 100 } = req.query;
    
    let query = { machine_id: machineId };
    
    if (start_date || end_date) {
      query.timestamp = {};
      if (start_date) {
        query.timestamp.$gte = new Date(start_date);
      }
      if (end_date) {
        query.timestamp.$lte = new Date(end_date);
      }
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
  console.log(`   POST /api/users/:id/change-password - Alterar senha`);
  console.log(`   PUT  /api/users/:id/change-password - Alterar senha (alternativo)`);
  console.log(`   POST /api/change-password-working - Alterar senha (FUNCIONAL)`);
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
  console.log(`   POST /api/production-records/upsert - Criar ou atualizar registro (anti-duplicação)`);
  console.log(`   PUT  /api/production-records/:id - Atualizar registro`);
  console.log(`   DELETE /api/production-records/:id - Deletar registro`);
  console.log(`   GET  /api/production-statistics - Estatísticas de produção`);
  console.log(`   GET  /api/oee-history - Buscar histórico OEE`);
  console.log(`   GET  /api/oee-history/:machineId - Buscar histórico OEE por máquina`);
  console.log(`   POST /api/init/production-records - Inicializar registros padrão`);
});