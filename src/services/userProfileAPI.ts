// API service para comunicação com MongoDB via endpoints
// Este serviço faz chamadas HTTP para endpoints que usam o MongoDB real

export interface UserProfile {
  _id?: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  language: string;
  timezone: string;
  roles: ('administrador' | 'operador' | 'supervisor')[];
  permissions: string[];
  notifications: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    dashboard_layout: string;
    default_machine?: string;
  };
  security: {
    two_factor_enabled: boolean;
    last_login?: Date;
    login_attempts: number;
    locked_until?: Date;
    password_changed_at?: Date;
  };
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
  last_seen?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  roles?: ('administrador' | 'operador' | 'supervisor')[];
  department?: string;
  position?: string;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    whatsapp?: boolean;
  };
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    dashboard_layout?: string;
    default_machine?: string;
  };
}

export interface AuthResult {
  user: UserProfile;
  token: string;
}

class UserProfileAPI {
  private baseURL = '/api/users'; // Endpoints da API

  // Função auxiliar para fazer requisições HTTP
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro na requisição' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ===== MÉTODOS DE AUTENTICAÇÃO =====

  async createUser(userData: CreateUserData): Promise<UserProfile> {
    try {
      console.log('🔄 Criando usuário via API...');
      const result = await this.makeRequest('/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      console.log('✅ Usuário criado via API');
      return result.user;
    } catch (error) {
      console.error('❌ Erro ao criar usuário via API:', error);
      throw error;
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    try {
      console.log('🔄 Autenticando via API...');
      const result = await this.makeRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      console.log('✅ Autenticação via API realizada');
      return result;
    } catch (error) {
      console.error('❌ Erro na autenticação via API:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<UserProfile> {
    try {
      const result = await this.makeRequest('/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return result.user;
    } catch (error) {
      console.error('❌ Erro na verificação do token via API:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE PERFIL =====

  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'GET'
      });
      return result.user;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil via API:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    try {
      console.log('🔄 Atualizando perfil via API...');
      const result = await this.makeRequest(`/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      console.log('✅ Perfil atualizado via API');
      return result.user;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil via API:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      console.log('🔄 Alterando senha via API...');
      await this.makeRequest(`/users/${userId}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      console.log('✅ Senha alterada via API');
      return true;
    } catch (error) {
      console.error('❌ Erro ao alterar senha via API:', error);
      throw error;
    }
  }

  // ===== MÉTODOS DE PAPÉIS =====

  async updateUserRoles(userId: string, roles: ('administrador' | 'operador' | 'supervisor')[]): Promise<UserProfile> {
    try {
      console.log('🔄 Atualizando papéis via API...');
      const result = await this.makeRequest(`/profile/${userId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roles })
      });
      console.log('✅ Papéis atualizados via API');
      return result.user;
    } catch (error) {
      console.error('❌ Erro ao atualizar papéis via API:', error);
      throw error;
    }
  }

  async getUsersByRole(role: 'administrador' | 'operador' | 'supervisor'): Promise<UserProfile[]> {
    try {
      const result = await this.makeRequest(`/role/${role}`, {
        method: 'GET'
      });
      return result.users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários por papel via API:', error);
      throw error;
    }
  }

  // ===== MÉTODOS UTILITÁRIOS =====

  getCurrentService(): string {
    return 'API (MongoDB via HTTP)';
  }

  async initializeDefaultUsers(): Promise<void> {
    try {
      console.log('🔄 Inicializando usuários via API...');
      await this.makeRequest('/initialize', {
        method: 'POST'
      });
      console.log('✅ Usuários inicializados via API');
    } catch (error) {
      console.error('❌ Erro ao inicializar usuários via API:', error);
      throw error;
    }
  }

  // Método para testar conectividade
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/health', { method: 'GET' });
      return true;
    } catch (error) {
      console.warn('⚠️ API não disponível:', error.message);
      return false;
    }
  }
}

// Instância singleton
export const userProfileAPI = new UserProfileAPI();
export default userProfileAPI;