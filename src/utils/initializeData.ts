import mockMongoService from '@/services/mockMongoService';

/**
 * Função para inicializar dados padrão no sistema
 * Deve ser chamada na primeira execução
 */
export async function initializeDefaultData() {
  try {
    console.log('🚀 Inicializando dados padrão...');
    
    // Inicializar dados padrão
    await mockMongoService.initializeDefaultData();
    
    console.log('✅ Dados padrão inicializados com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log('- Email: admin@sistema-oee.com');
    console.log('- Senha: admin123');
    console.log('\n🎉 Sistema pronto para uso!');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar dados:', error);
    return false;
  }
}

// Auto-executar se não há dados
export async function autoInitialize() {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const machines = JSON.parse(localStorage.getItem('machines') || '[]');
  
  if (users.length === 0 || machines.length === 0) {
    console.log('🔍 Dados não encontrados, inicializando...');
    await initializeDefaultData();
  }
}