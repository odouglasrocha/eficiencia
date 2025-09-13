import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import userProfileServiceHybrid, { UserProfile, UpdateProfileData } from '@/services/userProfileServiceHybrid';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  department: string | null;
  position: string | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'administrador' | 'operador' | 'supervisor';
  created_at: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Função para converter UserProfile para Profile (compatibilidade)
  const convertUserProfileToProfile = (userProfile: UserProfile): Profile => {
    return {
      id: userProfile._id || '',
      user_id: userProfile._id || '',
      full_name: userProfile.full_name || null,
      phone: userProfile.phone || null,
      department: userProfile.department || null,
      position: userProfile.position || null,
      location: userProfile.location || null,
      bio: userProfile.bio || null,
      avatar_url: userProfile.avatar_url || null,
      language: userProfile.language || 'pt-BR',
      timezone: userProfile.timezone || 'America/Sao_Paulo',
      notifications: userProfile.notifications || {
        email: true,
        push: true,
        whatsapp: false
      },
      created_at: userProfile.created_at?.toISOString() || new Date().toISOString(),
      updated_at: userProfile.updated_at?.toISOString() || new Date().toISOString()
    };
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Tentar buscar perfil com userProfileServiceHybrid primeiro
      try {
        const userProfile = await userProfileServiceHybrid.getUserProfile(user.id);
        const profileData = convertUserProfileToProfile(userProfile);
        setProfile(profileData);
        
        // Converter roles do UserProfile para UserRole[]
        const userRoles: UserRole[] = userProfile.roles.map((role, index) => ({
          id: `role_${user.id}_${index}`,
          user_id: user.id,
          role: role as 'administrador' | 'operador' | 'supervisor',
          created_at: userProfile.created_at?.toISOString() || new Date().toISOString()
        }));
        setRoles(userRoles);
        
        console.log('✅ Perfil carregado com userProfileServiceHybrid');
        return;
      } catch (profileError) {
        console.warn('Fallback para localStorage no perfil:', profileError);
      }
      
      // Fallback: Buscar perfil do localStorage ou criar padrão
      const savedProfile = localStorage.getItem(`profile_${user.id}`);
      
      if (savedProfile) {
        const profileData = JSON.parse(savedProfile);
        setProfile(profileData);
      } else {
        // Criar perfil padrão baseado nos dados do usuário
        const defaultProfile: Profile = {
          id: `profile_${user.id}`,
          user_id: user.id,
          full_name: user.full_name || null,
          phone: user.phone || null,
          department: user.department || null,
          position: user.position || null,
          location: user.location || null,
          bio: user.bio || null,
          avatar_url: user.avatar_url || null,
          language: user.language || 'pt-BR',
          timezone: user.timezone || 'America/Sao_Paulo',
          notifications: user.notifications || {
            email: true,
            push: true,
            whatsapp: false
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setProfile(defaultProfile);
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(defaultProfile));
      }
      
      // Buscar roles do usuário
      const savedRoles = localStorage.getItem(`roles_${user.id}`);
      
      if (savedRoles) {
        setRoles(JSON.parse(savedRoles));
      } else {
        // Criar roles padrão baseado nos roles do usuário
        const userRoles: UserRole[] = (user.roles || ['operador']).map((role, index) => ({
          id: `role_${user.id}_${index}`,
          user_id: user.id,
          role: role as 'administrador' | 'operador' | 'supervisor',
          created_at: new Date().toISOString()
        }));
        
        setRoles(userRoles);
        localStorage.setItem(`roles_${user.id}`, JSON.stringify(userRoles));
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar perfil';
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      // Converter updates de Profile para UpdateProfileData
      const updateData: UpdateProfileData = {
        full_name: updates.full_name || undefined,
        avatar_url: updates.avatar_url || undefined,
        phone: updates.phone || undefined,
        department: updates.department || undefined,
        position: updates.position || undefined,
        location: updates.location || undefined,
        bio: updates.bio || undefined,
        language: updates.language || undefined,
        timezone: updates.timezone || undefined,
        notifications: updates.notifications || undefined
      };

      // Tentar atualizar com userProfileServiceHybrid primeiro
      try {
        const updatedUserProfile = await userProfileServiceHybrid.updateUserProfile(user.id, updateData);
        const updatedProfile = convertUserProfileToProfile(updatedUserProfile);
        setProfile(updatedProfile);
        
        console.log('✅ Perfil atualizado com userProfileServiceHybrid');
        
        toast({
          title: "Sucesso",
          description: "Perfil atualizado com sucesso!",
        });
        return;
      } catch (profileError) {
        console.warn('Fallback para localStorage na atualização:', profileError);
      }

      // Fallback: atualizar no localStorage
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString()
      };

      setProfile(updatedProfile);
      localStorage.setItem(`profile_${user.id}`, JSON.stringify(updatedProfile));
      
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
      
      return updatedProfile;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    if (!profile) return;
    
    return await updateProfile({ avatar_url: avatarUrl });
  };

  const updateNotificationSettings = async (notifications: Profile['notifications']) => {
    if (!profile) return;
    
    return await updateProfile({ notifications });
  };

  const hasRole = (role: 'administrador' | 'operador' | 'supervisor'): boolean => {
    return roles.some(r => r.role === role);
  };

  const isAdmin = (): boolean => {
    return hasRole('administrador');
  };

  const isSupervisor = (): boolean => {
    return hasRole('supervisor') || hasRole('administrador');
  };

  const canManageMachines = (): boolean => {
    return hasRole('administrador') || hasRole('supervisor');
  };

  const canViewReports = (): boolean => {
    return true; // Todos podem ver relatórios
  };

  const canManageUsers = (): boolean => {
    return hasRole('administrador');
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  return {
    profile,
    roles,
    loading,
    error,
    updateProfile,
    updateAvatar,
    updateNotificationSettings,
    hasRole,
    isAdmin,
    isSupervisor,
    canManageMachines,
    canViewReports,
    canManageUsers,
    refetch: fetchProfile
  };
}