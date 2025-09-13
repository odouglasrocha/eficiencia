// Script para inicializar usuários padrão diretamente no MongoDB
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env') });

async function initializeUsersInMongoDB() {
  try {
    console.log('🔄 Inicializando usuários padrão no MongoDB Atlas...');
    
    // Importar o serviço de usuário real (MongoDB)
    const { default: userProfileService } = await import('../services/userProfileService');
    
    // Usuários padrão para criar
    const defaultUsers = [
      {
        email: 'admin@sistema-oee.com',
        password: 'admin123',
        full_name: 'Administrador do Sistema',
        roles: ['administrador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'TI',
        position: 'Administrador de Sistema'
      },
      {
        email: 'supervisor@sistema-oee.com',
        password: 'supervisor123',
        full_name: 'João Silva',
        roles: ['supervisor'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Produção',
        position: 'Supervisor de Produção'
      },
      {
        email: 'operador1@sistema-oee.com',
        password: 'operador123',
        full_name: 'Maria Santos',
        roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Produção',
        position: 'Operador de Máquina'
      },
      {
        email: 'operador2@sistema-oee.com',
        password: 'operador123',
        full_name: 'Carlos Oliveira',
        roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Produção',
        position: 'Operador de Máquina'
      },
      {
        email: 'qualidade@sistema-oee.com',
        password: 'qualidade123',
        full_name: 'Ana Costa',
        roles: ['supervisor'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Qualidade',
        position: 'Analista de Qualidade'
      }
    ];
    
    let createdCount = 0;
    let existingCount = 0;
    
    for (const userData of defaultUsers) {
      try {
        console.log(`📝 Criando usuário: ${userData.email}`);
        
        const user = await userProfileService.createUser(userData);
        console.log(`✅ Usuário criado: ${userData.email} (${user._id})`);
        createdCount++;
        
      } catch (error) {
        if (error.message.includes('já existe')) {
          console.log(`ℹ️ Usuário já existe: ${userData.email}`);
          existingCount++;
        } else {
          console.error(`❌ Erro ao criar usuário ${userData.email}:`, error.message);
        }
      }
    }
    
    console.log('\n📊 Resumo da inicialização:');
    console.log(`✅ Usuários criados: ${createdCount}`);
    console.log(`ℹ️ Usuários já existentes: ${existingCount}`);
    console.log(`📋 Total processado: ${defaultUsers.length}`);
    
    if (createdCount > 0 || existingCount > 0) {
      console.log('\n🎉 Inicialização concluída com sucesso!');
      console.log('\n🔐 Credenciais de acesso:');
      console.log('👤 Administrador: admin@sistema-oee.com / admin123');
      console.log('👤 Supervisor: supervisor@sistema-oee.com / supervisor123');
      console.log('👤 Operador: operador1@sistema-oee.com / operador123');
      console.log('\n💾 Todos os dados foram salvos no MongoDB Atlas!');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    console.error('Detalhes:', {
      name: error.name,
      message: error.message
    });
    process.exit(1);
  }
}

initializeUsersInMongoDB();