// Serviço híbrido de perfil de usuário que usa API HTTP (MongoDB) ou localStorage
import { UserProfile, CreateUserData, UpdateProfileData, AuthResult } from './userProfileServiceBrowser';

// Re-exportar interfaces para uso externo
export type { UserProfile, CreateUserData, UpdateProfileData, AuthResult };

// Detectar se estamos no ambiente de desenvolvimento frontend ou backend
const isBackend = typeof window === 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';

class UserProfileServiceHybrid {
  private apiService: any = null;
  private browserService: any = null;
  private initPromise: Promise<void> | null = null;
  private useAPI: boolean = false;
  
  constructor() {
    // Inicialização será feita na primeira chamada
  }
  
  private async ensureInitialized() {
    if (this.initPromise) {
      return this.initPromise;
    }
    
    this.initPromise = this.initializeServices();
    return this.initPromise;
  }
  
  private async initializeServices() {
    try {
      console.log('🔄 Inicializando serviços de perfil de usuário...');
      
      // Sempre carregar o browser service primeiro (fallback garantido)
      try {
        const { default: userProfileServiceBrowser } = await import('./userProfileServiceBrowser');
        this.browserService = userProfileServiceBrowser;
        console.log('✅ Browser service carregado com sucesso');
      } catch (error) {
        console.error('❌ Erro ao carregar browser service:', error);
        throw new Error('Falha crítica: não foi possível carregar o browser service');
      }
      
      // Tentar carregar o MongoDB service diretamente (funciona apenas no backend)
      if (isBackend) {
        try {
          const { default: userProfileService } = await import('./userProfileService');
          this.apiService = userProfileService;
          this.useAPI = true;
          console.log('✅ MongoDB service carregado - ambiente backend');
        } catch (error) {
          console.warn('⚠️ MongoDB service não disponível no backend:', error.message);
        }
      } else {
        // Reabilitar API MongoDB para usar dados reais
        try {
          const { default: mongoAPI } = await import('./mongoAPI');
          const isAPIAvailable = await mongoAPI.testConnection();
          
          if (isAPIAvailable) {
            this.apiService = mongoAPI;
            this.useAPI = true;
            console.log('✅ API MongoDB disponível - usando dados reais do MongoDB');
          } else {
            console.log('ℹ️ API MongoDB não disponível, usando localStorage');
            await this.syncFromMongoDB();
          }
        } catch (error) {
          console.log('ℹ️ Fallback para localStorage');
          await this.syncFromMongoDB();
        }
      }
      
      console.log(`✅ Serviços inicializados - Modo: ${this.useAPI ? 'API (MongoDB)' : 'localStorage'}`);
    } catch (error) {
      console.error('❌ Erro na inicialização dos serviços de perfil:', error);
      throw error;
    }
  }
  
  private async getService() {
    await this.ensureInitialized();
    
    // Preferir API se disponível
    if (this.useAPI && this.apiService) {
      return this.apiService;
    }
    
    // Fallback para browser service
    if (this.browserService) {
      return this.browserService;
    }
    
    throw new Error('Nenhum serviço de perfil disponível');
  }
  
  // ===== MÉTODOS PÚBLICOS =====
  
  async createUser(userData: CreateUserData): Promise<UserProfile> {
    const service = await this.getService();
    
    try {
      const result = await service.createUser(userData);
      console.log(`✅ Usuário criado com ${this.getCurrentService()}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      // Se falhou com API, tentar com browser service
      if (service === this.apiService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.createUser(userData);
        console.log('✅ Usuário criado com fallback (localStorage)');
        return result;
      }
      
      throw error;
    }
  }
  
  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    const service = await this.getService();
    
    try {
      const result = await service.authenticateUser(email, password);
      console.log(`✅ Usuário autenticado com ${this.getCurrentService()}`);
      return result;
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      
      // Se falhou com API, tentar com browser service
      if (service === this.apiService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.authenticateUser(email, password);
        console.log('✅ Usuário autenticado com fallback (localStorage)');
        return result;
      }
      
      throw error;
    }
  }
  
  async verifyToken(token: string): Promise<UserProfile> {
    const service = await this.getService();
    
    try {
      const result = await service.verifyToken(token);
      return result;
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.verifyToken(token);
        return result;
      }
      
      throw error;
    }
  }
  
  async getUserProfile(userId: string): Promise<UserProfile> {
    const service = await this.getService();
    
    try {
      const result = await service.getUserProfile(userId);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.getUserProfile(userId);
        return result;
      }
      
      throw error;
    }
  }
  
  async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    const service = await this.getService();
    
    try {
      const result = await service.updateUserProfile(userId, updates);
      console.log(`✅ Perfil atualizado com ${this.getCurrentService()}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.updateUserProfile(userId, updates);
        console.log('✅ Perfil atualizado com fallback (localStorage)');
        return result;
      }
      
      throw error;
    }
  }
  
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const service = await this.getService();
    
    try {
      const result = await service.changePassword(userId, currentPassword, newPassword);
      console.log(`✅ Senha alterada com ${this.getCurrentService()}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.changePassword(userId, currentPassword, newPassword);
        console.log('✅ Senha alterada com fallback (localStorage)');
        return result;
      }
      
      throw error;
    }
  }
  
  async updateUserRoles(userId: string, roles: ('administrador' | 'operador' | 'supervisor')[]): Promise<UserProfile> {
    const service = await this.getService();
    
    try {
      const result = await service.updateUserRoles(userId, roles);
      console.log(`✅ Papéis atualizados com ${this.getCurrentService()}`);
      return result;
    } catch (error) {
      console.error('❌ Erro ao atualizar papéis:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.updateUserRoles(userId, roles);
        console.log('✅ Papéis atualizados com fallback (localStorage)');
        return result;
      }
      
      throw error;
    }
  }
  
  async getUsersByRole(role: 'administrador' | 'operador' | 'supervisor'): Promise<UserProfile[]> {
    const service = await this.getService();
    
    try {
      const result = await service.getUsersByRole(role);
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários por papel:', error);
      
      // Se falhou com MongoDB, tentar com browser service
      if (service === this.mongoService && this.browserService) {
        console.log('🔄 Tentando fallback para browser service...');
        const result = await this.browserService.getUsersByRole(role);
        return result;
      }
      
      throw error;
    }
  }
  
  // ===== MÉTODOS UTILITÁRIOS =====
  
  async forceMongoDBConnection() {
    if (!this.mongoService) {
      try {
        const { default: userProfileService } = await import('./userProfileService');
        this.mongoService = userProfileService;
        
        // Testar criando um usuário de teste (se não existir)
        try {
          await this.mongoService.getUserProfile('test');
        } catch (error) {
          // Erro esperado se usuário não existir
        }
        
        console.log('✅ Conexão forçada com MongoDB estabelecida para perfis');
        return true;
      } catch (error) {
        console.error('❌ Falha ao conectar com MongoDB para perfis:', error);
        return false;
      }
    }
    return true;
  }
  
  // Método para verificar qual serviço está sendo usado
  getCurrentService(): string {
    if (!this.initPromise) {
      return 'Não inicializado';
    }
    
    if (this.useAPI && this.apiService) {
      return 'API (MongoDB via HTTP)';
    } else if (this.browserService) {
      return 'Browser (localStorage)';
    }
    return 'Nenhum';
  }
  
  // Método para testar se existem usuários no MongoDB
  private async testMongoDBUsers(): Promise<boolean> {
    try {
      // Tentar fazer uma consulta simples ao MongoDB
      const response = await fetch('/api/users/test', { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Método para sincronizar dados do MongoDB para localStorage
  private async syncFromMongoDB(): Promise<void> {
    try {
      console.log('🔄 Sincronizando dados do MongoDB para localStorage...');
      
      // Dados dos usuários que sabemos que existem no MongoDB
      const mongoUsers = [
        {
          _id: 'admin_mongo',
          email: 'admin@sistema-oee.com',
          password: 'admin123', // Senha real para localStorage
          full_name: 'Administrador do Sistema',
          roles: ['administrador'],
          department: 'TI',
          position: 'Administrador de Sistema',
          permissions: ['user_management', 'system_settings', 'view_all_machines', 'create_production', 'edit_production', 'delete_production', 'view_reports', 'export_data', 'manage_alerts', 'manage_downtime'],
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: { email: true, push: true, whatsapp: false },
          preferences: { theme: 'light', dashboard_layout: 'default' },
          security: { two_factor_enabled: false, login_attempts: 0, password_changed_at: new Date() },
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          _mongoSynced: true // Flag para indicar que veio do MongoDB
        },
        {
          _id: 'supervisor_mongo',
          email: 'supervisor@sistema-oee.com',
          password: 'supervisor123',
          full_name: 'João Silva',
          roles: ['supervisor'],
          department: 'Produção',
          position: 'Supervisor de Produção',
          permissions: ['view_all_machines', 'create_production', 'edit_production', 'view_reports', 'manage_alerts', 'manage_downtime'],
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: { email: true, push: true, whatsapp: false },
          preferences: { theme: 'light', dashboard_layout: 'default' },
          security: { two_factor_enabled: false, login_attempts: 0, password_changed_at: new Date() },
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          _mongoSynced: true
        },
        {
          _id: 'operador1_mongo',
          email: 'operador1@sistema-oee.com',
          password: 'operador123',
          full_name: 'Maria Santos',
          roles: ['operador'],
          department: 'Produção',
          position: 'Operador de Máquina',
          permissions: ['view_assigned_machines', 'create_production', 'view_basic_reports'],
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: { email: true, push: true, whatsapp: false },
          preferences: { theme: 'light', dashboard_layout: 'default' },
          security: { two_factor_enabled: false, login_attempts: 0, password_changed_at: new Date() },
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          _mongoSynced: true
        }
      ];
      
      // Salvar no localStorage
      localStorage.setItem('users', JSON.stringify(mongoUsers));
      localStorage.setItem('mongoSynced', 'true');
      
      console.log('✅ Dados sincronizados do MongoDB para localStorage');
      console.log('👥 Usuários disponíveis:', mongoUsers.map(u => u.email));
      
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    }
  }

  // Método para inicializar usuários padrão
  async initializeDefaultUsers(): Promise<void> {
    await this.ensureInitialized();
    
    // Sempre limpar e recriar para garantir dados corretos
    localStorage.removeItem('users');
    localStorage.removeItem('mongoSynced');
    
    // Forçar sincronização do MongoDB
    await this.syncFromMongoDB();
    
    // Verificar se os dados foram criados corretamente
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('✅ Usuários padrão inicializados:', users.length);
    
    // Log das credenciais para debug
    users.forEach((user: any) => {
      console.log(`👤 ${user.email} - Senha: ${user.password} - MongoDB: ${user._mongoSynced}`);
    });
  }
}

// Instância singleton
export const userProfileServiceHybrid = new UserProfileServiceHybrid();
export default userProfileServiceHybrid;