// Script simples para testar conexão MongoDB e criar usuário
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env') });

async function testUserCreation() {
  try {
    console.log('🔄 Testando criação de usuário no MongoDB...');
    console.log('URI configurada:', process.env.MONGODB_URI ? 'SIM' : 'NÃO');
    
    // Importar o serviço de usuário
    const { default: userProfileService } = await import('../services/userProfileService');
    
    // Tentar criar um usuário de teste
    const testUser = {
      email: 'teste@mongodb.com',
      password: 'teste123',
      full_name: 'Usuário de Teste MongoDB',
      roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[],
      department: 'Teste',
      position: 'Testador'
    };
    
    console.log('📝 Tentando criar usuário de teste...');
    const user = await userProfileService.createUser(testUser);
    console.log('✅ Usuário criado com sucesso no MongoDB!');
    console.log('👤 ID do usuário:', user._id);
    console.log('📧 Email:', user.email);
    
    // Tentar fazer login
    console.log('🔐 Testando autenticação...');
    const authResult = await userProfileService.authenticateUser(testUser.email, testUser.password);
    console.log('✅ Autenticação realizada com sucesso!');
    console.log('🎫 Token gerado:', authResult.token.substring(0, 50) + '...');
    
    console.log('🎉 Teste completo! MongoDB está funcionando corretamente.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Detalhes:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3)
    });
    
    console.log('\n🔄 Tentando fallback para localStorage...');
    try {
      const { default: userProfileServiceBrowser } = await import('../services/userProfileServiceBrowser');
      
      const testUser = {
        email: 'teste@localStorage.com',
        password: 'teste123',
        full_name: 'Usuário de Teste localStorage',
        roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Teste',
        position: 'Testador'
      };
      
      const user = await userProfileServiceBrowser.createUser(testUser);
      console.log('✅ Fallback funcionando - usuário criado no localStorage');
      console.log('👤 ID do usuário:', user._id);
      
    } catch (fallbackError) {
      console.error('❌ Erro no fallback também:', fallbackError);
    }
    
    process.exit(1);
  }
}

testUserCreation();