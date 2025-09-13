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
  res.json({ status: 'ok', message: 'API MongoDB funcionando' });
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
});