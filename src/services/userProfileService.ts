// Serviço especializado para gerenciamento de perfis de usuário
import connectDB from '@/lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

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

class UserProfileService {
  private jwtSecret = process.env.JWT_SECRET || 'sistema-oee-secret-key';
  private saltRounds = 12;

  // Conectar ao MongoDB
  private async connect() {
    await connectDB();
  }

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

  // ===== AUTENTICAÇÃO =====

  async createUser(userData: CreateUserData): Promise<UserProfile> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      // Verificar se usuário já existe
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

      // Criar usuário
      const user = new User({
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
        status: 'active'
      });

      await user.save();
      console.log('✅ Usuário criado no MongoDB:', user._id);

      return user.getPublicProfile();
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      
      // Fallback para localStorage
      return this.createUserFallback(userData);
    }
  }

  async authenticateUser(email: string, password: string): Promise<AuthResult> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      // Buscar usuário
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      // Verificar se conta está bloqueada
      if (user.isLocked()) {
        throw new Error('Conta temporariamente bloqueada. Tente novamente mais tarde.');
      }

      // Verificar se conta está ativa
      if (user.status !== 'active') {
        throw new Error('Conta inativa ou suspensa');
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await user.incrementLoginAttempts();
        throw new Error('Credenciais inválidas');
      }

      // Reset tentativas de login e atualizar último acesso
      await user.resetLoginAttempts();
      await user.updateLastSeen();

      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email,
          roles: user.roles 
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      console.log('✅ Usuário autenticado no MongoDB:', user._id);
      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      console.error('❌ Erro na autenticação MongoDB:', error);
      
      // Fallback para localStorage
      return this.authenticateUserFallback(email, password);
    }
  }

  async verifyToken(token: string): Promise<UserProfile> {
    try {
      // Verificar e decodificar token JWT
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      await this.connect();
      const User = (await import('@/models/mongoose/User')).default;

      // Buscar usuário
      const user = await User.findById(decoded.userId);
      if (!user || user.status !== 'active') {
        throw new Error('Token inválido ou usuário inativo');
      }

      // Atualizar último acesso
      await user.updateLastSeen();

      return user.getPublicProfile();
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error);
      
      // Fallback para localStorage
      return this.verifyTokenFallback(token);
    }
  }

  // ===== PERFIL DO USUÁRIO =====

  async getUserProfile(userId: string): Promise<UserProfile> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      return user.getPublicProfile();
    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      
      // Fallback para localStorage
      return this.getUserProfileFallback(userId);
    }
  }

  async updateUserProfile(userId: string, updates: UpdateProfileData): Promise<UserProfile> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Atualizar campos
      Object.assign(user, updates);
      
      // Atualizar notificações se fornecidas
      if (updates.notifications) {
        Object.assign(user.notifications, updates.notifications);
      }
      
      // Atualizar preferências se fornecidas
      if (updates.preferences) {
        Object.assign(user.preferences, updates.preferences);
      }

      await user.save();
      console.log('✅ Perfil atualizado no MongoDB:', userId);

      return user.getPublicProfile();
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      
      // Fallback para localStorage
      return this.updateUserProfileFallback(userId, updates);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);
      user.password = hashedPassword;
      user.security.password_changed_at = new Date();

      await user.save();
      console.log('✅ Senha alterada no MongoDB:', userId);

      return true;
    } catch (error) {
      console.error('❌ Erro ao alterar senha:', error);
      throw error;
    }
  }

  // ===== GESTÃO DE PAPÉIS E PERMISSÕES =====

  async updateUserRoles(userId: string, roles: ('administrador' | 'operador' | 'supervisor')[]): Promise<UserProfile> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      user.roles = roles;
      user.permissions = this.getDefaultPermissions(roles);

      await user.save();
      console.log('✅ Papéis atualizados no MongoDB:', userId);

      return user.getPublicProfile();
    } catch (error) {
      console.error('❌ Erro ao atualizar papéis:', error);
      throw error;
    }
  }

  async getUsersByRole(role: 'administrador' | 'operador' | 'supervisor'): Promise<UserProfile[]> {
    await this.connect();

    try {
      const User = (await import('@/models/mongoose/User')).default;

      const users = await User.findByRole(role).select('-password').lean();
      console.log(`✅ ${users.length} usuários encontrados com papel '${role}'`);

      return users;
    } catch (error) {
      console.error('❌ Erro ao buscar usuários por papel:', error);
      return [];
    }
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

  // ===== FALLBACK PARA LOCALSTORAGE =====

  private async createUserFallback(userData: CreateUserData): Promise<UserProfile> {
    const users = this.safeLocalStorage.getJSON('users', []);

    // Verificar se usuário já existe
    const existingUser = users.find((u: any) => u.email === userData.email);
    if (existingUser) {
      throw new Error('Usuário já existe com este email');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, this.saltRounds);

    const newUser = {
      _id: uuidv4(),
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

    console.log('✅ Usuário criado no localStorage:', newUser._id);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword as UserProfile;
  }

  private async authenticateUserFallback(email: string, password: string): Promise<AuthResult> {
    const users = this.safeLocalStorage.getJSON('users', []);
    const user = users.find((u: any) => u.email === email.toLowerCase());

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Atualizar último acesso
    user.last_seen = new Date();
    user.security.last_login = new Date();
    this.safeLocalStorage.setJSON('users', users);

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        roles: user.roles 
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );

    console.log('✅ Usuário autenticado no localStorage:', user._id);
    const { password: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as UserProfile,
      token
    };
  }

  private async verifyTokenFallback(token: string): Promise<UserProfile> {
    const decoded = jwt.verify(token, this.jwtSecret) as any;
    const users = this.safeLocalStorage.getJSON('users', []);
    const user = users.find((u: any) => u._id === decoded.userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserProfile;
  }

  private getUserProfileFallback(userId: string): UserProfile {
    const users = this.safeLocalStorage.getJSON('users', []);
    const user = users.find((u: any) => u._id === userId);

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserProfile;
  }

  private updateUserProfileFallback(userId: string, updates: UpdateProfileData): UserProfile {
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
      Object.assign(users[userIndex].notifications, updates.notifications);
    }
    
    // Atualizar preferências se fornecidas
    if (updates.preferences) {
      Object.assign(users[userIndex].preferences, updates.preferences);
    }

    this.safeLocalStorage.setJSON('users', users);

    console.log('✅ Perfil atualizado no localStorage:', userId);
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword as UserProfile;
  }
}

// Instância singleton
export const userProfileService = new UserProfileService();
export default userProfileService;