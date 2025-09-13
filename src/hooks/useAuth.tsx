import React, { useState, useEffect, createContext, useContext } from 'react';
import userProfileServiceHybrid, { UserProfile } from '@/services/userProfileServiceHybrid';

// Interface compatível com o sistema existente
interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  roles: string[];
  // Campos adicionais do perfil completo
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  permissions?: string[];
  notifications?: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    dashboard_layout: string;
    default_machine?: string;
  };
  status?: 'active' | 'inactive' | 'suspended';
  last_seen?: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  // Função para converter UserProfile para User (compatibilidade)
  const convertProfileToUser = (profile: UserProfile): User => {
    return {
      id: profile._id || '',
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      roles: profile.roles,
      phone: profile.phone,
      department: profile.department,
      position: profile.position,
      location: profile.location,
      bio: profile.bio,
      language: profile.language,
      timezone: profile.timezone,
      permissions: profile.permissions,
      notifications: profile.notifications,
      preferences: profile.preferences,
      status: profile.status,
      last_seen: profile.last_seen
    };
  };

  // Verificar token armazenado no localStorage
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (isChecking || !isMounted) return;
      
      console.log('🔍 useAuth: Verificação simplificada iniciada');
      setIsChecking(true);
      
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('user_data');
        
        console.log('🎫 useAuth: Token:', !!token, 'UserData:', !!userData);
        
        if (token && userData && isMounted) {
          // Usar dados salvos diretamente, sem verificação complexa
          const savedUser = JSON.parse(userData);
          const user = convertProfileToUser(savedUser);
          
          console.log('✅ useAuth: Usuário carregado do localStorage:', user?.email);
          setUser(user);
        } else {
          console.log('❌ useAuth: Sem dados de autenticação');
          if (isMounted) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
          }
        }
      } catch (error) {
        console.error('❌ useAuth: Erro:', error);
        if (isMounted) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      } finally {
        if (isMounted) {
          console.log('🏁 useAuth: Verificação concluída');
          setLoading(false);
          setIsChecking(false);
        }
      }
    };

    checkAuth();
    
    return () => {
      isMounted = false;
    };
  }, []); // Remover dependência de isChecking

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Usar userProfileServiceHybrid (já tem fallbacks internos)
      const result = await userProfileServiceHybrid.authenticateUser(email, password);
      setUser(convertProfileToUser(result.user));
      localStorage.setItem('auth_token', result.token);
      console.log('✅ Login realizado com userProfileServiceHybrid');
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      
      // Usar userProfileServiceHybrid (já tem fallbacks internos)
      await userProfileServiceHybrid.createUser({
        email,
        password,
        full_name: fullName,
        roles: ['operador'] as ('administrador' | 'operador' | 'supervisor')[]
      });
      
      // Após criar usuário, fazer login automaticamente
      const result = await userProfileServiceHybrid.authenticateUser(email, password);
      setUser(convertProfileToUser(result.user));
      localStorage.setItem('auth_token', result.token);
      console.log('✅ Cadastro realizado com userProfileServiceHybrid');
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      return { error: message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('auth_token');
      return {};
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
      return { error: message };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook simplificado para compatibilidade com código existente
export const useAuthSimple = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
         if (token) {
           const profile = await userProfileServiceHybrid.verifyToken(token);
           setUser({
             id: profile._id || '',
             email: profile.email,
             full_name: profile.full_name,
             avatar_url: profile.avatar_url,
             roles: profile.roles || []
           });
         }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signOut = async () => {
    try {
      setUser(null);
      localStorage.removeItem('auth_token');
      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer logout';
      return { error: message };
    }
  };

  return {
    user,
    session: user ? { user } : null,
    loading,
    signOut,
    isAuthenticated: !!user
  };
};

// Exportar o hook simples como padrão para compatibilidade
export default useAuthSimple;