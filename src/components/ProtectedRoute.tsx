import React from 'react';
import { useAuthorization } from '@/hooks/useAuthorization';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRoles?: ('administrador' | 'operador' | 'supervisor')[];
  route?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // Se true, requer TODAS as permissões. Se false, requer QUALQUER uma
}

/**
 * Componente de Proteção de Rotas - Sistema de Segurança Restaurado
 * 
 * Este componente protege rotas e componentes baseado em permissões e roles:
 * - ADMINISTRADOR: Acesso total
 * - OPERADOR: Inserir registros, perfil completo, configurações somente leitura
 * - SUPERVISOR: Consultas e relatórios limitados
 */
export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  route,
  fallback,
  requireAll = false
}: ProtectedRouteProps) {
  const {
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    canAccessRoute,
    getUserAccessLevel,
    user
  } = useAuthorization();
  const navigate = useNavigate();

  // Verificar se o usuário está autenticado
  if (!user) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você precisa estar logado para acessar esta funcionalidade.
        </AlertDescription>
        <Button 
          onClick={() => navigate('/auth')} 
          className="mt-2"
          variant="outline"
        >
          Fazer Login
        </Button>
      </Alert>
    );
  }

  // Verificar permissões específicas da rota
  if (route && !canAccessRoute(route)) {
    return fallback || (
      <Alert className="m-4" variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Acesso Restrito</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade.
          <br />
          <strong>Seu nível de acesso:</strong> {getUserAccessLevel().toUpperCase()}
        </AlertDescription>
        <Button 
          onClick={() => navigate('/')} 
          className="mt-2"
          variant="outline"
        >
          Voltar ao Dashboard
        </Button>
      </Alert>
    );
  }

  // Verificar roles específicos
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return fallback || (
        <Alert className="m-4" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Acesso Restrito por Perfil</AlertTitle>
          <AlertDescription>
            Esta funcionalidade requer um dos seguintes perfis: {requiredRoles.join(', ')}.
            <br />
            <strong>Seu perfil atual:</strong> {user.roles?.join(', ') || 'Não definido'}
          </AlertDescription>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-2"
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
        </Alert>
      );
    }
  }

  // Verificar permissões específicas
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions);
    
    if (!hasRequiredPermissions) {
      return fallback || (
        <Alert className="m-4" variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Permissões Insuficientes</AlertTitle>
          <AlertDescription>
            Esta funcionalidade requer {requireAll ? 'todas' : 'uma'} das seguintes permissões:
            <ul className="list-disc list-inside mt-2">
              {requiredPermissions.map(permission => (
                <li key={permission} className="text-sm">{permission}</li>
              ))}
            </ul>
            <strong>Seu nível de acesso:</strong> {getUserAccessLevel().toUpperCase()}
          </AlertDescription>
          <Button 
            onClick={() => navigate('/')} 
            className="mt-2"
            variant="outline"
          >
            Voltar ao Dashboard
          </Button>
        </Alert>
      );
    }
  }

  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>;
}

// Componentes de conveniência para casos específicos
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['administrador']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function OperatorOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['administrador', 'operador']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function SupervisorOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRoles={['administrador', 'supervisor']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function ReadOnlyForOperator({ children, readOnlyContent }: { children: React.ReactNode; readOnlyContent?: React.ReactNode }) {
  const { isOperator, canEditSystemSettings } = useAuthorization();
  
  // Se é operador e não pode editar configurações, mostrar versão somente leitura
  if (isOperator() && !canEditSystemSettings()) {
    return readOnlyContent ? <>{readOnlyContent}</> : (
      <div className="opacity-60 pointer-events-none">
        {children}
        <div className="absolute inset-0 bg-gray-100/50 flex items-center justify-center">
          <Alert className="w-auto">
            <Shield className="h-4 w-4" />
            <AlertTitle>Modo Somente Leitura</AlertTitle>
            <AlertDescription>Operadores podem visualizar mas não editar estas configurações.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}