// Script para inicializar usuários no MongoDB
import connectDB from '@/lib/mongodb';
import userProfileService from '@/services/userProfileService';

// Dados de usuários de exemplo
const defaultUsers = [
  {
    email: 'admin@sistema-oee.com',
    password: 'admin123',
    full_name: 'Administrador do Sistema',
    roles: ['administrador'] as const,
    department: 'TI',
    position: 'Administrador de Sistema'
  },
  {
    email: 'supervisor@sistema-oee.com',
    password: 'supervisor123',
    full_name: 'João Silva',
    roles: ['supervisor'] as const,
    department: 'Produção',
    position: 'Supervisor de Produção'
  },
  {
    email: 'operador1@sistema-oee.com',
    password: 'operador123',
    full_name: 'Maria Santos',
    roles: ['operador'] as const,
    department: 'Produção',
    position: 'Operador de Máquina'
  },
  {
    email: 'operador2@sistema-oee.com',
    password: 'operador123',
    full_name: 'Carlos Oliveira',
    roles: ['operador'] as const,
    department: 'Produção',
    position: 'Operador de Máquina'
  },
  {
    email: 'qualidade@sistema-oee.com',
    password: 'qualidade123',
    full_name: 'Ana Costa',
    roles: ['supervisor'] as const,
    department: 'Qualidade',
    position: 'Analista de Qualidade'
  }
];

export async function initializeUsers() {
  try {
    console.log('🔄 Inicializando usuários no MongoDB...');
    await connectDB();
    
    const User = (await import('@/models/mongoose/User')).default;
    
    // Verificar se já existem usuários
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log(`ℹ️ ${existingUsers} usuários já existem no banco`);
      return {
        message: 'Usuários já inicializados',
        existing: existingUsers,
        created: 0
      };
    }
    
    let createdCount = 0;
    const results = [];
    
    for (const userData of defaultUsers) {
      try {
        console.log(`📝 Criando usuário: ${userData.email}`);
        
        const user = await userProfileService.createUser({
          email: userData.email,
          password: userData.password,
          full_name: userData.full_name,
          roles: userData.roles,
          department: userData.department,
          position: userData.position
        });
        
        results.push({
          email: userData.email,
          id: user._id,
          roles: userData.roles,
          status: 'created'
        });
        
        createdCount++;
        console.log(`✅ Usuário criado: ${userData.email} (${user._id})`);
      } catch (error) {
        console.error(`❌ Erro ao criar usuário ${userData.email}:`, error);
        results.push({
          email: userData.email,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          status: 'error'
        });
      }
    }
    
    console.log(`✅ Inicialização concluída: ${createdCount}/${defaultUsers.length} usuários criados`);
    
    return {
      message: 'Usuários inicializados com sucesso',
      created: createdCount,
      total: defaultUsers.length,
      results
    };
  } catch (error) {
    console.error('❌ Erro na inicialização de usuários:', error);
    throw error;
  }
}

// Função para criar usuário administrador específico
export async function createAdminUser(email: string, password: string, fullName?: string) {
  try {
    console.log('🔄 Criando usuário administrador...');
    
    const user = await userProfileService.createUser({
      email,
      password,
      full_name: fullName || 'Administrador',
      roles: ['administrador'] as ('administrador' | 'operador' | 'supervisor')[],
      department: 'Administração',
      position: 'Administrador do Sistema'
    });
    
    console.log('✅ Usuário administrador criado:', user._id);
    return user;
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    throw error;
  }
}

// Função para listar todos os usuários
export async function listAllUsers() {
  try {
    await connectDB();
    const User = (await import('@/models/mongoose/User')).default;
    
    const users = await User.find({}, '-password').lean();
    
    console.log(`📋 ${users.length} usuários encontrados:`);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.roles.join(', ')}) - ${user.status}`);
    });
    
    return users;
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    throw error;
  }
}

// Função para atualizar papéis de um usuário
export async function updateUserRoles(email: string, roles: ('administrador' | 'operador' | 'supervisor')[]) {
  try {
    await connectDB();
    const User = (await import('@/models/mongoose/User')).default;
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    const updatedUser = await userProfileService.updateUserRoles(user._id.toString(), roles);
    
    console.log(`✅ Papéis atualizados para ${email}:`, roles);
    return updatedUser;
  } catch (error) {
    console.error('❌ Erro ao atualizar papéis:', error);
    throw error;
  }
}

// Função para resetar senha de um usuário
export async function resetUserPassword(email: string, newPassword: string) {
  try {
    await connectDB();
    const User = (await import('@/models/mongoose/User')).default;
    const bcrypt = await import('bcryptjs');
    
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.security.password_changed_at = new Date();
    
    await user.save();
    
    console.log(`✅ Senha resetada para ${email}`);
    return { message: 'Senha resetada com sucesso' };
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'init':
      initializeUsers()
        .then((result) => {
          console.log('🎉 Inicialização completa:', result);
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha na inicialização:', error);
          process.exit(1);
        });
      break;
      
    case 'list':
      listAllUsers()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha ao listar usuários:', error);
          process.exit(1);
        });
      break;
      
    case 'create-admin':
      const email = args[1];
      const password = args[2];
      const fullName = args[3];
      
      if (!email || !password) {
        console.error('❌ Uso: npm run init-users create-admin <email> <password> [nome]');
        process.exit(1);
      }
      
      createAdminUser(email, password, fullName)
        .then((user) => {
          console.log('🎉 Administrador criado:', user.email);
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha ao criar administrador:', error);
          process.exit(1);
        });
      break;
      
    case 'update-roles':
      const userEmail = args[1];
      const newRoles = args.slice(2) as ('administrador' | 'operador' | 'supervisor')[];
      
      if (!userEmail || newRoles.length === 0) {
        console.error('❌ Uso: npm run init-users update-roles <email> <role1> [role2] ...');
        process.exit(1);
      }
      
      updateUserRoles(userEmail, newRoles)
        .then((user) => {
          console.log('🎉 Papéis atualizados para:', user.email);
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha ao atualizar papéis:', error);
          process.exit(1);
        });
      break;
      
    case 'reset-password':
      const resetEmail = args[1];
      const resetPassword = args[2];
      
      if (!resetEmail || !resetPassword) {
        console.error('❌ Uso: npm run init-users reset-password <email> <nova-senha>');
        process.exit(1);
      }
      
      resetUserPassword(resetEmail, resetPassword)
        .then((result) => {
          console.log('🎉', result.message);
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha ao resetar senha:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('📋 Comandos disponíveis:');
      console.log('  init                                    - Inicializar usuários padrão');
      console.log('  list                                    - Listar todos os usuários');
      console.log('  create-admin <email> <password> [nome]  - Criar usuário administrador');
      console.log('  update-roles <email> <role1> [role2]    - Atualizar papéis do usuário');
      console.log('  reset-password <email> <nova-senha>     - Resetar senha do usuário');
      console.log('');
      console.log('Exemplos:');
      console.log('  npm run init-users init');
      console.log('  npm run init-users create-admin admin@empresa.com senha123 "Admin Sistema"');
      console.log('  npm run init-users update-roles operador@empresa.com supervisor');
      console.log('  npm run init-users reset-password usuario@empresa.com novaSenha123');
      process.exit(0);
  }
}