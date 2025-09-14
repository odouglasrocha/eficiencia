// Servidor de teste simples para verificar o problema
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

// Schema simples do usuário
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: String,
  roles: [String],
  department: String,
  position: String,
  security: {
    password_changed_at: Date
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('TestUser', userSchema);

// Conectar ao MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas (Teste)');
  })
  .catch(err => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
  });

// Endpoint de teste simples
app.get('/api/test', (req, res) => {
  console.log('🔍 GET /api/test chamado');
  res.json({ message: 'Servidor de teste funcionando!', timestamp: new Date() });
});

// Endpoint POST de teste
app.post('/api/test-post', (req, res) => {
  console.log('🔍 POST /api/test-post chamado');
  console.log('📋 Body recebido:', req.body);
  res.json({ message: 'POST funcionando!', received: req.body });
});

// Endpoint de alteração de senha FUNCIONAL
app.post('/api/change-password-test', async (req, res) => {
  try {
    console.log('🔄 TESTE: Alteração de senha iniciada');
    const { userId, currentPassword, newPassword } = req.body;
    
    console.log('📋 Dados:', { userId, currentPassword: '***', newPassword: '***' });
    
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    
    // Usar a coleção users original
    const OriginalUser = mongoose.model('User', new mongoose.Schema({
      email: String,
      password: String,
      full_name: String,
      roles: [String],
      security: {
        password_changed_at: Date
      }
    }, { collection: 'users' }));
    
    // Buscar usuário
    const user = await OriginalUser.findById(userId);
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
    
    // Atualizar no MongoDB
    const result = await OriginalUser.updateOne(
      { _id: userId },
      { 
        $set: { 
          password: hashedPassword,
          'security.password_changed_at': new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('📊 Resultado da atualização:', result);
    
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

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PRINCIPAL (Funcional) rodando na porta ${PORT}`);
  console.log('📋 Endpoints disponíveis:');
  console.log(`   GET  /api/test - Teste simples`);
  console.log(`   POST /api/test-post - Teste POST`);
  console.log(`   POST /api/change-password-test - Alteração de senha (FUNCIONAL)`);
  console.log('');
  console.log('🔧 Para alterar senha:');
  console.log('   POST http://localhost:3001/api/change-password-test');
  console.log('   Body: { "userId": "ID_DO_USUARIO", "currentPassword": "senha_atual", "newPassword": "nova_senha" }');
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});