import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';

/**
 * Hook de Autorização - Sistema de Segurança Restaurado
 * 
 * Este hook fornece funções de autorização baseadas em roles e permissões
 * para garantir que o sistema funcione de acordo com as regras de negócio:
 * 
 * - ADMINISTRADOR: Acesso total ao sistema
 * - OPERADOR: Inserir registros, perfil completo, configurações somente leitura
 * - SUPERVISOR: Consultas e relatórios limitados
 */
export function useAuthorization() {
  const { user } = useAuth();
  const { hasPermission, userPermissions } = usePermissions();

  // Verificar se o usuário tem um role específico
  const hasRole = (role: 'administrador' | 'operador' | 'supervisor'): boolean => {
    return user?.roles?.includes(role) || false;
  };

  // Verificações específicas por role
  const isAdmin = (): boolean => hasRole('administrador');
  const isOperator = (): boolean => hasRole('operador');
  const isSupervisor = (): boolean => hasRole('supervisor');

  // Verificações de permissões específicas
  const canViewMachines = (): boolean => hasPermission('view_machines');
  const canCreateMachines = (): boolean => hasPermission('create_machines');
  const canEditMachines = (): boolean => hasPermission('edit_machines');
  const canDeleteMachines = (): boolean => hasPermission('delete_machines');

  const canViewProduction = (): boolean => hasPermission('view_production');
  const canCreateProduction = (): boolean => hasPermission('create_production');
  const canEditProduction = (): boolean => hasPermission('edit_production');
  const canDeleteProduction = (): boolean => hasPermission('delete_production');

  const canViewReports = (): boolean => hasPermission('view_reports');
  const canExportReports = (): boolean => hasPermission('export_reports');

  const canViewProfile = (): boolean => hasPermission('view_profile');
  const canEditProfile = (): boolean => hasPermission('edit_profile');

  const canViewSystemSettings = (): boolean => hasPermission('view_system_settings');
  const canEditSystemSettings = (): boolean => hasPermission('edit_system_settings');

  const canManageUsers = (): boolean => hasPermission('manage_users');
  const canManagePermissions = (): boolean => hasPermission('manage_permissions');
  const canSystemAdmin = (): boolean => hasPermission('system_admin');

  // Verificações compostas para funcionalidades específicas
  const canAccessAdminPanel = (): boolean => {
    return isAdmin() && (canManageUsers() || canSystemAdmin());
  };

  const canInsertRecords = (): boolean => {
    return canCreateProduction();
  };

  const canAccessSystemSettingsReadOnly = (): boolean => {
    return canViewSystemSettings() && !canEditSystemSettings();
  };

  const canAccessReportsOnly = (): boolean => {
    return canViewReports() && !canCreateProduction() && !canEditMachines();
  };

  // Função para verificar múltiplas permissões
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Função para obter o nível de acesso do usuário
  const getUserAccessLevel = (): 'admin' | 'operator' | 'supervisor' | 'none' => {
    if (isAdmin()) return 'admin';
    if (isOperator()) return 'operator';
    if (isSupervisor()) return 'supervisor';
    return 'none';
  };

  // Função para verificar se o usuário pode acessar uma rota específica
  const canAccessRoute = (route: string): boolean => {
    switch (route) {
      case '/admin':
      case '/admin/*':
        return canAccessAdminPanel();
      
      case '/machines/create':
      case '/machines/edit':
        return canCreateMachines() || canEditMachines();
      
      case '/machines/delete':
        return canDeleteMachines();
      
      case '/production/create':
        return canCreateProduction();
      
      case '/production/edit':
        return canEditProduction();
      
      case '/reports':
        return canViewReports();
      
      case '/reports/export':
        return canExportReports();
      
      case '/profile':
        return canViewProfile();
      
      case '/profile/edit':
        return canEditProfile();
      
      case '/settings':
        return canViewSystemSettings();
      
      case '/settings/edit':
        return canEditSystemSettings();
      
      default:
        return true; // Rotas públicas por padrão
    }
  };

  return {
    // Verificações de role
    hasRole,
    isAdmin,
    isOperator,
    isSupervisor,
    
    // Verificações de permissões específicas
    canViewMachines,
    canCreateMachines,
    canEditMachines,
    canDeleteMachines,
    canViewProduction,
    canCreateProduction,
    canEditProduction,
    canDeleteProduction,
    canViewReports,
    canExportReports,
    canViewProfile,
    canEditProfile,
    canViewSystemSettings,
    canEditSystemSettings,
    canManageUsers,
    canManagePermissions,
    canSystemAdmin,
    
    // Verificações compostas
    canAccessAdminPanel,
    canInsertRecords,
    canAccessSystemSettingsReadOnly,
    canAccessReportsOnly,
    
    // Utilitários
    hasAnyPermission,
    hasAllPermissions,
    getUserAccessLevel,
    canAccessRoute,
    
    // Dados brutos
    userPermissions,
    user
  };
}