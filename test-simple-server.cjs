// Servidor de Teste Simples
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check chamado');
  res.json({ status: 'OK', timestamp: new Date() });
});

// Teste de máquinas
app.get('/api/machines', (req, res) => {
  console.log('🔍 GET /api/machines chamado');
  res.json({ 
    machines: [
      { id: 1, name: 'Máquina Teste 1', code: 'TEST-001', status: 'ativa' },
      { id: 2, name: 'Máquina Teste 2', code: 'TEST-002', status: 'ativa' }
    ],
    total: 2
  });
});

// Teste de registros
app.get('/api/production-records', (req, res) => {
  console.log('🔍 GET /api/production-records chamado');
  res.json({ 
    records: [
      { id: 1, machine_id: 'TEST-001', good_production: 100, oee: 85.5 },
      { id: 2, machine_id: 'TEST-002', good_production: 150, oee: 92.3 }
    ],
    total: 2
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor de TESTE SIMPLES rodando na porta ${PORT}`);
  console.log('📋 Endpoints de teste:');
  console.log(`   GET  /api/health - Health check`);
  console.log(`   GET  /api/machines - Máquinas de teste`);
  console.log(`   GET  /api/production-records - Registros de teste`);
  console.log('');
  console.log('✨ Servidor de teste pronto!');
});

// Tratamento de erros
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});