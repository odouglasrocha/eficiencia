// Serviço de API para conectar ao MongoDB via HTTP
// Este serviço funciona no frontend fazendo chamadas para uma API backend

interface CreateUserData {
  email: string;
  password: string;
  full_name?: string;
  roles?: string[];
  department?: string;
  position?: string;
}

interface AuthResult {
  user: any;
  token: string;
}

class MongoAPI {
  private baseURL = 'http://localhost:3001/api'; // URL base para a API
  private tokenCache = new Map<string, { user: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private verificationInProgress = new Set<string>();

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Erro na requisição ${endpoint}:`, error);
      throw error;
    }
  }

  async createUser(userData: CreateUserData) {
    console.log('🔄 Criando usuário via API MongoDB...');
    
    try {
      const result = await this.makeRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      console.log('✅ Usuário criado via API MongoDB:', userData.email);
      return result;
    } catch (error) {
      console.error('❌ Erro ao criar usuário via API:', error);
      throw error;
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    console.log('🔄 Autenticando via API MongoDB...');
    
    try {
      const result = await this.makeRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      console.log('✅ Autenticação via API MongoDB realizada');
      return result;
    } catch (error) {
      console.error('❌ Erro na autenticação via API:', error);
      throw error;
    }
  }

  async verifyToken(token: string) {
    // Verificar cache primeiro
    const cached = this.tokenCache.get(token);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      console.log('✅ Token verificado via cache');
      return cached.user;
    }
    
    // Evitar verificações simultâneas do mesmo token
    if (this.verificationInProgress.has(token)) {
      console.log('⏳ Verificação de token já em andamento, aguardando...');
      // Aguardar um pouco e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.verifyToken(token);
    }
    
    console.log('🔄 Verificando token via API MongoDB...');
    this.verificationInProgress.add(token);
    
    try {
      const result = await this.makeRequest('/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Armazenar no cache
      this.tokenCache.set(token, {
        user: result,
        timestamp: Date.now()
      });
      
      console.log('✅ Token verificado via API MongoDB');
      return result;
    } catch (error) {
      console.error('❌ Erro na verificação do token via API:', error);
      throw error;
    } finally {
      this.verificationInProgress.delete(token);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testando conexão com API MongoDB...');
      
      const result = await this.makeRequest('/health', {
        method: 'GET'
      });
      
      console.log('✅ Conexão com API MongoDB funcionando');
      return true;
    } catch (error) {
      console.warn('⚠️ API MongoDB não disponível:', error.message);
      return false;
    }
  }

  async initializeUsers(): Promise<void> {
    console.log('🔄 Inicializando usuários via API MongoDB...');
    
    try {
      await this.makeRequest('/init/users', {
        method: 'POST'
      });
      
      console.log('✅ Usuários inicializados via API MongoDB');
    } catch (error) {
      console.error('❌ Erro ao inicializar usuários via API:', error);
      throw error;
    }
  }

  // Método para limpar cache de tokens
  clearTokenCache(): void {
    this.tokenCache.clear();
    console.log('🧹 Cache de tokens limpo');
  }

  // Método para limpar cache de um token específico
  clearTokenFromCache(token: string): void {
    this.tokenCache.delete(token);
    console.log('🧹 Token removido do cache');
  }
}

export const mongoAPI = new MongoAPI();
export default mongoAPI;