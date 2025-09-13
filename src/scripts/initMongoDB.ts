import mongoService from '@/services/mongoService';
import { MachineStatus, AppRole } from '@/models';

// Nota: Este script é para uso no backend com MongoDB real.
// No frontend, use mockMongoService através de initializeData.ts

/**
 * Script para inicializar o MongoDB com dados padrão
 * Execute este script após a primeira configuração
 */
async function initializeMongoDB() {
  try {
    console.log('🚀 Iniciando configuração do MongoDB...');
    
    // Conectar ao banco
    await mongoService.connect();
    console.log('✅ Conectado ao MongoDB Atlas');
    
    // Inicializar dados padrão (motivos de parada)
    await mongoService.initializeDefaultData();
    console.log('✅ Dados padrão inicializados');
    
    // TODO: Implementar criação de máquinas com Mongoose no backend
    console.log('ℹ️ Este script deve ser executado no backend com MongoDB real');
    console.log('ℹ️ No frontend, use mockMongoService através de initializeData.ts');
    
    // Criar usuário administrador padrão se não existir
    try {
      await mongoService.createUser(
        'admin@sistema-oee.com',
        'admin123',
        'Administrador do Sistema'
      );
      console.log('✅ Usuário administrador criado: admin@sistema-oee.com / admin123');
    } catch (error) {
      if (error instanceof Error && error.message.includes('já existe')) {
        console.log('ℹ️ Usuário administrador já existe');
      } else {
        console.error('❌ Erro ao criar usuário administrador:', error);
      }
    }
    
    console.log('🎉 Inicialização do MongoDB concluída com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('- Banco de dados: MongoDB Atlas');
    console.log('- Modelos: Criados e configurados');
    console.log('- Dados padrão: Inicializados');
    console.log('- Usuário admin: admin@sistema-oee.com / admin123');
    console.log('\n🚀 O sistema está pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeMongoDB()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Falha na inicialização:', error);
      process.exit(1);
    });
}

export default initializeMongoDB;