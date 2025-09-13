import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Permission {
  permission_name: string;
  description: string;
  category: string;
}

export interface AccessLevelPermission {
  access_level: string;
  permission_name: string;
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [accessLevelPermissions, setAccessLevelPermissions] = useState<AccessLevelPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Buscar todas as permissões do sistema (mock)
  const fetchPermissions = async () => {
    try {
      // Permissões padrão do sistema - Sistema de Segurança Restaurado
      const mockPermissions = [
        // Máquinas
        { permission_name: 'view_machines', description: 'Visualizar máquinas', category: 'machines' },
        { permission_name: 'create_machines', description: 'Criar máquinas', category: 'machines' },
        { permission_name: 'edit_machines', description: 'Editar máquinas', category: 'machines' },
        { permission_name: 'delete_machines', description: 'Excluir máquinas', category: 'machines' },
        
        // Registros de Produção
        { permission_name: 'view_production', description: 'Visualizar registros de produção', category: 'production' },
        { permission_name: 'create_production', description: 'Inserir registros de produção', category: 'production' },
        { permission_name: 'edit_production', description: 'Editar registros de produção', category: 'production' },
        { permission_name: 'delete_production', description: 'Excluir registros de produção', category: 'production' },
        
        // Relatórios
        { permission_name: 'view_reports', description: 'Visualizar relatórios', category: 'reports' },
        { permission_name: 'export_reports', description: 'Exportar relatórios', category: 'reports' },
        
        // Perfil de Usuário
        { permission_name: 'view_profile', description: 'Visualizar perfil', category: 'profile' },
        { permission_name: 'edit_profile', description: 'Editar perfil', category: 'profile' },
        
        // Configurações do Sistema
        { permission_name: 'view_system_settings', description: 'Visualizar configurações do sistema', category: 'settings' },
        { permission_name: 'edit_system_settings', description: 'Editar configurações do sistema', category: 'settings' },
        
        // Administração
        { permission_name: 'manage_users', description: 'Gerenciar usuários', category: 'admin' },
        { permission_name: 'manage_permissions', description: 'Gerenciar permissões', category: 'admin' },
        { permission_name: 'system_admin', description: 'Administração completa do sistema', category: 'admin' }
      ];
      setPermissions(mockPermissions);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar permissões';
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Buscar permissões do usuário atual (baseado no role)
  const fetchUserPermissions = async () => {
    try {
      if (!user?.roles) {
        setUserPermissions([]);
        return;
      }

      // Mapear roles para permissões - Sistema de Segurança Restaurado
      const rolePermissions: string[] = [];
      
      user.roles.forEach(role => {
        switch (role) {
          case 'administrador':
            // ADMINISTRADOR: Acesso total ao sistema
            rolePermissions.push(
              // Máquinas
              'view_machines', 'create_machines', 'edit_machines', 'delete_machines',
              // Produção
              'view_production', 'create_production', 'edit_production', 'delete_production',
              // Relatórios
              'view_reports', 'export_reports',
              // Perfil
              'view_profile', 'edit_profile',
              // Configurações
              'view_system_settings', 'edit_system_settings',
              // Administração
              'manage_users', 'manage_permissions', 'system_admin'
            );
            break;
            
          case 'operador':
            // OPERADOR: Inserir registros, visualizar perfil e configurações (somente leitura)
            rolePermissions.push(
              // Máquinas (visualização)
              'view_machines',
              // Produção (inserção e visualização)
              'view_production', 'create_production',
              // Relatórios (visualização)
              'view_reports',
              // Perfil (completo)
              'view_profile', 'edit_profile',
              // Configurações (somente visualização)
              'view_system_settings'
            );
            break;
            
          case 'supervisor':
            // SUPERVISOR: Acesso limitado a consultas e relatórios
            rolePermissions.push(
              // Máquinas (visualização)
              'view_machines',
              // Produção (visualização)
              'view_production',
              // Relatórios (visualização e exportação)
              'view_reports', 'export_reports',
              // Perfil (visualização)
              'view_profile'
            );
            break;
        }
      });

      setUserPermissions([...new Set(rolePermissions)]); // Remove duplicatas
    } catch (err) {
      console.error('Erro ao carregar permissões do usuário:', err);
    }
  };

  // Buscar mapeamento de permissões por nível de acesso - Sistema de Segurança Restaurado
  const fetchAccessLevelPermissions = async () => {
    try {
      const mockAccessLevelPermissions: AccessLevelPermission[] = [
        // ADMINISTRADOR - Acesso total
        { access_level: 'administrador', permission_name: 'view_machines' },
        { access_level: 'administrador', permission_name: 'create_machines' },
        { access_level: 'administrador', permission_name: 'edit_machines' },
        { access_level: 'administrador', permission_name: 'delete_machines' },
        { access_level: 'administrador', permission_name: 'view_production' },
        { access_level: 'administrador', permission_name: 'create_production' },
        { access_level: 'administrador', permission_name: 'edit_production' },
        { access_level: 'administrador', permission_name: 'delete_production' },
        { access_level: 'administrador', permission_name: 'view_reports' },
        { access_level: 'administrador', permission_name: 'export_reports' },
        { access_level: 'administrador', permission_name: 'view_profile' },
        { access_level: 'administrador', permission_name: 'edit_profile' },
        { access_level: 'administrador', permission_name: 'view_system_settings' },
        { access_level: 'administrador', permission_name: 'edit_system_settings' },
        { access_level: 'administrador', permission_name: 'manage_users' },
        { access_level: 'administrador', permission_name: 'manage_permissions' },
        { access_level: 'administrador', permission_name: 'system_admin' },
        
        // OPERADOR - Inserir registros, perfil completo, configurações somente leitura
        { access_level: 'operador', permission_name: 'view_machines' },
        { access_level: 'operador', permission_name: 'view_production' },
        { access_level: 'operador', permission_name: 'create_production' },
        { access_level: 'operador', permission_name: 'view_reports' },
        { access_level: 'operador', permission_name: 'view_profile' },
        { access_level: 'operador', permission_name: 'edit_profile' },
        { access_level: 'operador', permission_name: 'view_system_settings' },
        
        // SUPERVISOR - Consultas e relatórios limitados
        { access_level: 'supervisor', permission_name: 'view_machines' },
        { access_level: 'supervisor', permission_name: 'view_production' },
        { access_level: 'supervisor', permission_name: 'view_reports' },
        { access_level: 'supervisor', permission_name: 'export_reports' },
        { access_level: 'supervisor', permission_name: 'view_profile' }
      ];
      setAccessLevelPermissions(mockAccessLevelPermissions);
    } catch (err) {
      console.error('Erro ao carregar permissões por nível:', err);
    }
  };

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = (permissionName: string): boolean => {
    return userPermissions.includes(permissionName);
  };

  // Verificar se o usuário tem permissão (mock)
  const checkPermission = async (permissionName: string): Promise<boolean> => {
    try {
      return userPermissions.includes(permissionName);
    } catch (err) {
      console.error('Erro ao verificar permissão:', err);
      return false;
    }
  };

  // Obter permissões por nível de acesso
  const getPermissionsByAccessLevel = (accessLevel: string): string[] => {
    return accessLevelPermissions
      .filter(alp => alp.access_level === accessLevel)
      .map(alp => alp.permission_name);
  };

  // Obter permissões por categoria
  const getPermissionsByCategory = (category: string): Permission[] => {
    return permissions.filter(p => p.category === category);
  };

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoading(true);
        await Promise.all([
          fetchPermissions(),
          fetchUserPermissions(),
          fetchAccessLevelPermissions()
        ]);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  return {
    permissions,
    userPermissions,
    accessLevelPermissions,
    loading,
    error,
    hasPermission,
    checkPermission,
    getPermissionsByAccessLevel,
    getPermissionsByCategory,
    refetch: () => {
      fetchPermissions();
      fetchUserPermissions();
      fetchAccessLevelPermissions();
    }
  };
}