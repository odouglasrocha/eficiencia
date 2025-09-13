import React, { useState, useEffect, createContext, useContext } from 'react';
import mockMongoService from '@/services/mockMongoService';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  roles: string[];
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

  // Verificar token armazenado no localStorage
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const result = await mockMongoService.verifyToken(token);
          setUser(result.user);
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

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await mockMongoService.authenticateUser(email, password);
      
      setUser(result.user);
      localStorage.setItem('auth_token', result.token);
      
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
      await mockMongoService.createUser(email, password, fullName);
      
      // Após criar usuário, fazer login automaticamente
      const result = await mockMongoService.authenticateUser(email, password);
      setUser(result.user);
      localStorage.setItem('auth_token', result.token);
      
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
           const result = await mockMongoService.verifyToken(token);
           setUser(result.user);
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