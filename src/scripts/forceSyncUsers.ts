// Script para forçar sincronização de usuários
import userProfileServiceHybrid from '../services/userProfileServiceHybrid';

async function forceSyncUsers() {
  try {
    console.log('🔄 Iniciando sincronização forçada de usuários...');
    
    // Limpar localStorage
    localStorage.clear();
    console.log('🧹 localStorage limpo');
    
    // Forçar inicialização
    await userProfileServiceHybrid.initializeDefaultUsers();
    console.log('✅ Usuários inicializados');
    
    // Verificar dados no localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('👥 Usuários no localStorage:', users.length);
    
    users.forEach((user: any) => {
      console.log(`📧 ${user.email} - MongoDB: ${user._mongoSynced ? 'Sim' : 'Não'}`);
    });
    
    console.log('✅ Sincronização concluída!');
    
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  forceSyncUsers();
}

export default forceSyncUsers;