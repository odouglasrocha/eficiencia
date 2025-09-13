// Serviço de perfil de usuário otimizado para navegador
// Versão sem dependências Node.js (jsonwebtoken, bcryptjs)

// Interfaces para tipagem
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

class UserProfileServiceBrowser {
  private jwtSecret = 'sistema-oee-browser-secret-key';

  // Função auxiliar para gerenciar localStorage de forma segura
  private safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } catch (e) {
        console.warn(`Erro ao ler localStorage para chave '${key}':`, e);
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn(`Erro ao salvar no localStorage para chave '${key}':`, e);
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn(`Erro ao remover do localStorage para chave '${key}':`, e);
      }
    },
    getJSON: (key: string, defaultValue: any = null): any => {
      try {
        const item = this.safeLocalStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn(`Erro ao parsear JSON do localStorage para chave '${key}':`, e);
        return defaultValue;
      }
    },
    setJSON: (key: string, value: any): void => {
      try {
        this.safeLocalStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Erro ao salvar JSON no localStorage para chave '${key}':`, e);
      }
    }
  };

  // Hash simples para senhas (apenas para desenvolvimento)
  private simpleHash(password: string): string {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  // Verificar hash simples
  private verifySimpleHash(password: string, hash: string): boolean {
    return this.simpleHash(password) === hash;
  }

  // Gerar token simples (apenas para desenvolvimento)
  private generateSimpleToken(payload: any): string {
    const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
    const payloadStr = btoa(JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    }));
    return `${header}.${payloadStr}.browser-token`;
  }

  // Verificar token simples (suporta formato JWT e formato mockMongoService)
  private verifySimpleToken(token: string): any {
    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Token inválido');
      }
      
      // Tentar formato JWT primeiro (header.payload.browser-token)
      const parts = token.split('.');
      
      if (parts.length === 3 && parts[2] === 'browser-token') {
        const payload = JSON.parse(atob(parts[1]));
        
        // Verificar expiração (formato Unix timestamp)
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          throw new Error('Token expirado');
        }
        
        return payload;
      }
      
      // Tentar formato mockMongoService (base64 direto)
      try {
        const payload = JSON.parse(atob(token));
        
        // Verificar expiração (formato timestamp em ms)
        if (payload.exp && Date.now() > payload.exp) {
          throw new Error('Token expirado');
        }
        
        return payload;
      } catch (mockError) {
        // Se falhar no formato mockMongoService, tentar limpar localStorage corrompido
        console.warn('Token corrompido detectado, limpando localStorage');
        localStorage.removeItem('auth_token');
        throw new Error('Token inválido');
      }
      
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Gerar ID único
  private generateId(): string {
    return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ===== AUTENTICAÇÃO =====

  async createUser(userData: CreateUserData): Promise<UserProfile> {
    const users = this.safeLocalStorage.getJSON('users', []);

    // Verificar se usuário já existe
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = this.simpleHash(userData.password);

    const newUser = {
      _id: this.generateId(),
      email: userData.email,
      password: hashedPassword,
      full_name: userData.full_name,
      roles: userData.roles || ['operador'],
      department: userData.department,
      position: userData.position,
      permissions: this.getDefaultPermissions(userData.roles || ['operador']),
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: true,
        push: true,
        whatsapp: false
      },
      preferences: {
        theme: 'light',
        dashboard_layout: 'default'
      },
      security: {
        two_factor_enabled: false,
        login_attempts: 0,
        password_changed_at: new Date()
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    users.push(newUser);
    this.safeLocalStorage.setJSON('users', users);

    // Tentar sincronizar com MongoDB se disponível
    try {
      // Importar dinamicamente para evitar dependência circular
      const { mongoService } = await import('./mongoService');
      await mongoService.createUser({
        email: newUser.email,
        password: userData.password, // Usar senha original, não hasheada
        full_name: newUser.full_name,
        roles: newUser.roles,
        department: newUser.department,
        position: newUser.position
      });
      console.log('✅ Usuário sincronizado com MongoDB:', newUser.email);
    } catch (mongoError) {
      console.warn('⚠️ Falha na sincronização com MongoDB (usuário salvo localmente):', mongoError);
    }

    console.log('✅ Usuário criado:', newUser.email);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as UserProfile;
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    const users = this.safeLocalStorage.getJSON('users', []);
    
    // Debug: Log dos dados para identificar o problema
    console.log('🔍 Debug - Tentativa de login:');
    console.log('📧 Email:', email.toLowerCase());
    console.log('👥 Usuários no localStorage:', users.length);
    console.log('📋 Emails disponíveis:', users.map((u: any) => u.email));
    
    let user = users.find((u: any) => u.email === email.toLowerCase());

    if (!user) {
      console.log('❌ Usuário não encontrado no localStorage');
      throw new Error('Credenciais inválidas');
    }

    // Verificar se conta está bloqueada
    if (user.security?.locked_until && new Date(user.security.locked_until) > new Date()) {
      throw new Error('Conta temporariamente bloqueada. Tente novamente mais tarde.');
    }

    // Verificar se conta está ativa
    if (user.status !== 'active') {
      throw new Error('Conta inativa ou suspensa');
    }

    // Verificar senha - tratamento especial para usuários sincronizados do MongoDB
    let isValidPassword = false;
    
    if (user._mongoSynced) {
      // Para usuários do MongoDB, usar senhas conhecidas
      const mongoPasswords = {
        'admin@sistema-oee.com': 'admin123',
        'supervisor@sistema-oee.com': 'supervisor123',
        'operador1@sistema-oee.com': 'operador123',
        'operador2@sistema-oee.com': 'operador123',
        'qualidade@sistema-oee.com': 'qualidade123'
      };
      
      isValidPassword = mongoPasswords[user.email] === password;
      
      if (isValidPassword) {
        console.log('✅ Autenticação com credenciais MongoDB');
      }
    } else {
      // Para usuários locais, usar hash simples
      isValidPassword = this.verifySimpleHash(password, user.password);
    }
    
    if (!isValidPassword) {
      // Incrementar tentativas de login
      user.security = user.security || {};
      user.security.login_attempts = (user.security.login_attempts || 0) + 1;
      
      // Bloquear após 5 tentativas por 15 minutos
      if (user.security.login_attempts >= 5) {
        user.security.locked_until = new Date(Date.now() + 15 * 60 * 1000);
      }
      
      this.safeLocalStorage.setJSON('users', users);
      throw new Error('Credenciais inválidas');
    }

    // Reset tentativas de login e atualizar último acesso
    user.security.login_attempts = 0;
    user.security.locked_until = null;
    user.security.last_login = new Date();
    user.last_seen = new Date();

    this.safeLocalStorage.setJSON('users', users);

    // Gerar token
    const token = this.generateSimpleToken({
      userId: user._id,
      email: user.email,
      roles: user.roles
    });

    console.log('✅ Usuário autenticado no localStorage:', user._id);
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as UserProfile,
      token
    };
  }

  async verifyToken(token: string): Promise<UserProfile> {
    const decoded = this.verifySimpleToken(token);
    const users = this.safeLocalStorage.getJSON('users', []);
    
    // Procurar usuário por ID primeiro, depois por email (para compatibilidade)
    let user = users.find((u: any) => u._id === decoded.userId);
    if (!user && decoded.email) {
      user = users.find((u: any) => u.email === decoded.email);
    }

    if (!user || user.status !== 'active') {
      throw new Error('Token inválido ou usuário inativo');
    }

    // Atualizar último acesso
    user.last_seen = new Date();
    this.safeLocalStorage.setJSON('users', users);

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserProfile;
  }

  // ===== PERFIL DO USUÁRIO =====

  async getUserProfile(userId: string): Promise<UserProfile> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const user = users.find((u: any) => u._id === userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserProfile;
  }

  async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const userIndex = users.findIndex((u: any) => u._id === userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    // Atualizar campos
    Object.assign(users[userIndex], updates);
    users[userIndex].updated_at = new Date();
    
    // Atualizar notificações se fornecidas
    if (updates.notifications) {
      users[userIndex].notifications = {
        ...users[userIndex].notifications,
        ...updates.notifications
      };
    }
    
    // Atualizar preferências se fornecidas
    if (updates.preferences) {
      users[userIndex].preferences = {
        ...users[userIndex].preferences,
        ...updates.preferences
      };
    }

    this.safeLocalStorage.setJSON('users', users);

    console.log('✅ Perfil atualizado no localStorage:', userId);
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as UserProfile;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const userIndex = users.findIndex((u: any) => u._id === userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    const user = users[userIndex];

    // Verificar senha atual
    const isValidPassword = this.verifySimpleHash(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    // Hash da nova senha
    const hashedPassword = this.simpleHash(newPassword);
    user.password = hashedPassword;
    user.security = user.security || {};
    user.security.password_changed_at = new Date();
    user.updated_at = new Date();

    this.safeLocalStorage.setJSON('users', users);

    console.log('✅ Senha alterada no localStorage:', userId);
    return true;
  }

  // ===== GESTÃO DE PAPÉIS E PERMISSÕES =====

  async updateUserRoles(userId: string, roles: ('administrador' | 'operador' | 'supervisor')[]): Promise<UserProfile> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const userIndex = users.findIndex((u: any) => u._id === userId);

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado');
    }

    users[userIndex].roles = roles;
    users[userIndex].permissions = this.getDefaultPermissions(roles);
    users[userIndex].updated_at = new Date();

    this.safeLocalStorage.setJSON('users', users);

    console.log('✅ Papéis atualizados no localStorage:', userId);
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as UserProfile;
  }

  async getUsersByRole(role: 'administrador' | 'operador' | 'supervisor'): Promise<UserProfile[]> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const filteredUsers = users
      .filter((u: any) => u.roles && u.roles.includes(role) && u.status === 'active')
      .map((u: any) => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

    console.log(`✅ ${filteredUsers.length} usuários encontrados com papel '${role}'`);
    return filteredUsers;
  }

  // ===== FUNÇÕES AUXILIARES =====

  private getDefaultPermissions(roles: string[]): string[] {
    const permissions: string[] = [];

    if (roles.includes('administrador')) {
      return [
        'user_management',
        'system_settings',
        'view_all_machines',
        'create_production',
        'edit_production',
        'delete_production',
        'view_reports',
        'export_data',
        'manage_alerts',
        'manage_downtime'
      ];
    }

    if (roles.includes('supervisor')) {
      permissions.push(
        'view_all_machines',
        'create_production',
        'edit_production',
        'view_reports',
        'manage_alerts',
        'manage_downtime'
      );
    }

    if (roles.includes('operador')) {
      permissions.push(
        'view_assigned_machines',
        'create_production',
        'view_basic_reports'
      );
    }

    return [...new Set(permissions)];
  }

  // Método para verificar qual serviço está sendo usado
  getCurrentService(): string {
    return 'Browser (localStorage)';
  }

  // Método para inicializar dados de exemplo
  async initializeDefaultUsers(): Promise<void> {
    const users = this.safeLocalStorage.getJSON('users', []);
    
    if (users.length > 0) {
      console.log('ℹ️ Usuários já existem no localStorage');
      return;
    }

    const defaultUsers = [
      {
        email: 'admin@sistema-oee.com',
        password: 'admin123',
        full_name: 'Administrador do Sistema',
        roles: ['administrador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'TI',
        position: 'Administrador de Sistema'
      },
      {
        email: 'supervisor@sistema-oee.com',
        password: 'supervisor123',
        full_name: 'João Silva',
        roles: ['supervisor'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Produção',
        position: 'Supervisor de Produção'
      },
      {
        email: 'operador@sistema-oee.com',
        password: 'operador123',
        full_name: 'Maria Santos',
        roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[],
        department: 'Produção',
        position: 'Operador de Máquina'
      }
    ];

    for (const userData of defaultUsers) {
      try {
        await this.createUser(userData);
        console.log(`✅ Usuário criado: ${userData.email}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao criar usuário ${userData.email}:`, error);
      }
    }

    console.log('✅ Usuários padrão inicializados no localStorage');
  }
}

// Instância singleton
export const userProfileServiceBrowser = new UserProfileServiceBrowser();
export default userProfileServiceBrowser;