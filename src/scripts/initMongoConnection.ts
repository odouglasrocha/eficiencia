// Script para inicializar conexão MongoDB e popular dados
import connectDB from '../lib/mongodb';
import { mongoService } from '../services/mongoService';

async function initMongoConnection() {
  try {
    console.log('🔄 Iniciando conexão com MongoDB...');
    
    // Conectar ao MongoDB
    await connectDB();
    console.log('✅ Conectado ao MongoDB Atlas');
    
    // Inicializar dados padrão
    console.log('🔄 Inicializando dados padrão...');
    await mongoService.initializeDefaultData();
    
    // Criar usuários padrão se não existirem
    console.log('🔄 Criando usuários padrão...');
    
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
    
    for (const userData of defaultUsers) {
      try {
        await mongoService.createUser(userData);
        console.log(`✅ Usuário criado: ${userData.email}`);
      } catch (error) {
        if (error.message.includes('já existe')) {
          console.log(`ℹ️ Usuário já existe: ${userData.email}`);
        } else {
          console.error(`❌ Erro ao criar usuário ${userData.email}:`, error);
        }
      }
    }
    
    console.log('✅ Inicialização do MongoDB concluída!');
    console.log('\n📋 Credenciais de teste:');
    console.log('👤 admin@sistema-oee.com / admin123');
    console.log('👤 supervisor@sistema-oee.com / supervisor123');
    console.log('👤 operador1@sistema-oee.com / operador123');
    
  } catch (error) {
    console.error('❌ Erro na inicialização do MongoDB:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initMongoConnection()
    .then(() => {
      console.log('🎉 Inicialização concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na inicialização:', error);
      process.exit(1);
    });
}

export default initMongoConnection;