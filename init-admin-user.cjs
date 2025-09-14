// Script de Inicialização do Usuário Administrador
// Sistema OEE - Módulo de Gerenciamento de Usuários
// Engenheiro: Especialista em Autenticação e Bancos de Dados

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Profile, initializeDefaultProfiles } = require('./user-management-module.cjs');

// MongoDB URI
const MONGODB_URI = 'mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco';

async function initializeSystem() {
  try {
    console.log('🚀 Inicializando Sistema de Gerenciamento de Usuários...');
    
    // Conectar ao MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB Atlas');
    
    // Inicializar perfis padrão
    console.log('📋 Inicializando perfis padrão...');
    await initializeDefaultProfiles();
    
    // Buscar perfil de Administrador
    const adminProfile = await Profile.findOne({ name: 'Administrador' });
    if (!adminProfile) {
      throw new Error('Perfil de Administrador não encontrado');
    }
    
    // Verificar se já existe um usuário administrador
    const existingAdmin = await User.findOne({ 
      email: 'admin@sistema-oee.com'
    }).populate('profile_id');
    
    if (existingAdmin) {
      console.log('⚠️ Usuário administrador já existe:', existingAdmin.email);
      console.log('📊 Informações do administrador:');
      console.log(`   Nome: ${existingAdmin.full_name}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Status: ${existingAdmin.status}`);
      console.log(`   Criado em: ${existingAdmin.created_at}`);
    } else {
      // Criar usuário administrador padrão
      console.log('👤 Criando usuário administrador padrão...');
      
      const adminData = {
        email: 'admin@sistema-oee.com',
        password: 'Admin@123456', // Senha forte padrão
        full_name: 'Administrador do Sistema',
        profile_id: adminProfile._id,
        department: 'Tecnologia da Informação',
        position: 'Administrador de Sistema',
        phone: '+55 11 99999-9999',
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          push: true,
          whatsapp: false
        },
        preferences: {
          theme: 'light',
          dashboard_layout: 'detailed'
        },
        status: 'active'
      };
      
      const adminUser = new User(adminData);
      await adminUser.save();
      
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log('📊 Credenciais do administrador:');
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Senha: Admin@123456`);
      console.log(`   Nome: ${adminUser.full_name}`);
      console.log(`   Perfil: ${adminProfile.name}`);
      console.log('');
      console.log('⚠️ IMPORTANTE: Altere a senha padrão após o primeiro login!');
    }
    
    // Exibir estatísticas do sistema
    console.log('');
    console.log('📊 ESTATÍSTICAS DO SISTEMA:');
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalProfiles = await Profile.countDocuments();
    const activeProfiles = await Profile.countDocuments({ is_active: true });
    
    console.log(`   Total de usuários: ${totalUsers}`);
    console.log(`   Usuários ativos: ${activeUsers}`);
    console.log(`   Total de perfis: ${totalProfiles}`);
    console.log(`   Perfis ativos: ${activeProfiles}`);
    
    // Listar todos os perfis disponíveis
    console.log('');
    console.log('🎭 PERFIS DISPONÍVEIS:');
    const profiles = await Profile.find({ is_active: true }).sort({ hierarchy_level: 1 });
    
    for (const profile of profiles) {
      console.log(`   ${profile.name} (Nível ${profile.hierarchy_level})`);
      console.log(`     Descrição: ${profile.description}`);
      console.log(`     Permissões:`);
      
      for (const permission of profile.permissions) {
        console.log(`       ${permission.module}: ${permission.actions.join(', ')}`);
      }
      console.log('');
    }
    
    console.log('🎉 Sistema inicializado com sucesso!');
    console.log('');
    console.log('🚀 PRÓXIMOS PASSOS:');
    console.log('   1. Inicie o servidor: node server-corrigido.cjs');
    console.log('   2. Faça login com as credenciais do administrador');
    console.log('   3. Altere a senha padrão');
    console.log('   4. Crie usuários adicionais conforme necessário');
    console.log('   5. Configure permissões específicas se necessário');
    
  } catch (error) {
    console.error('❌ Erro durante a inicialização:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
    process.exit(0);
  }
}

// Executar inicialização
initializeSystem();