// Script para limpar localStorage e forçar sincronização
import userProfileServiceHybrid from '../services/userProfileServiceHybrid';

async function clearAndSync() {
  try {
    console.log('🧹 Limpando localStorage...');
    
    // Limpar todos os dados de autenticação
    localStorage.removeItem('auth_token');
    localStorage.removeItem('users');
    localStorage.removeItem('mongoSynced');
    localStorage.removeItem('userRoles');
    
    console.log('✅ localStorage limpo');
    
    // Forçar nova sincronização
    console.log('🔄 Forçando nova sincronização...');
    await userProfileServiceHybrid.initializeDefaultUsers();
    
    console.log('✅ Sincronização completa!');
    console.log('📋 Usuários disponíveis:');
    
    // Verificar usuários sincronizados
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    users.forEach((user: any) => {
      console.log(`👤 ${user.email} (${user._id}) - Status: ${user.status}`);
    });
    
    console.log('\n🎯 Teste de login:');
    console.log('Email: admin@sistema-oee.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  clearAndSync();
}

export default clearAndSync;