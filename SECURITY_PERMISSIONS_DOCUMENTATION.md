# Sistema de Segurança e Permissões - Documentação Técnica

## 🔒 Sistema de Segurança Restaurado

Este documento descreve o sistema de permissões implementado para garantir que o acesso às funcionalidades do sistema OEE seja controlado de acordo com os perfis de usuário.

## 📋 Perfis de Usuário e Permissões

### 🔴 ADMINISTRADOR
**Acesso:** Total ao sistema

**Permissões:**
- ✅ Visualizar, criar, editar e excluir máquinas
- ✅ Visualizar, criar, editar e excluir registros de produção
- ✅ Visualizar e exportar relatórios
- ✅ Visualizar e editar perfil completo
- ✅ Visualizar e editar configurações do sistema
- ✅ Gerenciar usuários e permissões
- ✅ Administração completa do sistema

### 🟡 OPERADOR
**Acesso:** Inserir registros, perfil completo, configurações somente leitura

**Permissões:**
- ✅ Visualizar máquinas (somente leitura)
- ✅ Visualizar e inserir registros de produção
- ✅ Visualizar relatórios (somente leitura)
- ✅ Visualizar e editar perfil completo
- ✅ Visualizar configurações do sistema (somente leitura)
- ❌ Não pode editar máquinas
- ❌ Não pode editar configurações do sistema
- ❌ Não pode gerenciar usuários

### 🟢 SUPERVISOR
**Acesso:** Consultas e relatórios limitados

**Permissões:**
- ✅ Visualizar máquinas (somente leitura)
- ✅ Visualizar registros de produção (somente leitura)
- ✅ Visualizar e exportar relatórios
- ✅ Visualizar perfil (somente leitura)
- ❌ Não pode inserir ou editar registros
- ❌ Não pode editar máquinas
- ❌ Não pode acessar configurações do sistema
- ❌ Não pode gerenciar usuários

## 🛠️ Implementação Técnica

### Arquivos Principais

#### 1. `src/hooks/usePermissions.ts`
- Define todas as permissões do sistema
- Mapeia roles para permissões específicas
- Fornece funções de verificação de permissões

#### 2. `src/hooks/useAuthorization.ts`
- Hook principal para controle de acesso
- Funções de conveniência para verificações comuns
- Verificação de acesso a rotas específicas

#### 3. `src/components/ProtectedRoute.tsx`
- Componente para proteção de rotas e componentes
- Componentes de conveniência (AdminOnly, OperatorOrAdmin, etc.)
- Mensagens de erro personalizadas por tipo de acesso

### Permissões Implementadas

```typescript
// Máquinas
'view_machines'     // Visualizar máquinas
'create_machines'   // Criar máquinas
'edit_machines'     // Editar máquinas
'delete_machines'   // Excluir máquinas

// Registros de Produção
'view_production'   // Visualizar registros
'create_production' // Inserir registros
'edit_production'   // Editar registros
'delete_production' // Excluir registros

// Relatórios
'view_reports'      // Visualizar relatórios
'export_reports'    // Exportar relatórios

// Perfil de Usuário
'view_profile'      // Visualizar perfil
'edit_profile'      // Editar perfil

// Configurações do Sistema
'view_system_settings' // Visualizar configurações
'edit_system_settings' // Editar configurações

// Administração
'manage_users'         // Gerenciar usuários
'manage_permissions'   // Gerenciar permissões
'system_admin'         // Administração completa
```

## 🔧 Como Usar

### 1. Verificação de Permissões em Componentes

```typescript
import { useAuthorization } from '@/hooks/useAuthorization';

function MeuComponente() {
  const { canCreateProduction, isOperator } = useAuthorization();
  
  return (
    <div>
      {canCreateProduction() && (
        <Button>Inserir Registro</Button>
      )}
      {isOperator() && (
        <span>Modo Operador</span>
      )}
    </div>
  );
}
```

### 2. Proteção de Rotas

```typescript
import { ProtectedRoute, AdminOnly } from '@/components/ProtectedRoute';

// Proteção por permissão específica
<ProtectedRoute requiredPermissions={['manage_users']}>
  <AdminPanel />
</ProtectedRoute>

// Proteção por role
<AdminOnly>
  <UserManagement />
</AdminOnly>

// Proteção por múltiplas permissões
<ProtectedRoute 
  requiredPermissions={['view_reports', 'export_reports']} 
  requireAll={false} // Requer QUALQUER uma das permissões
>
  <ReportsPage />
</ProtectedRoute>
```

### 3. Modo Somente Leitura para Operadores

```typescript
import { ReadOnlyForOperator } from '@/components/ProtectedRoute';

<ReadOnlyForOperator>
  <SystemSettings />
</ReadOnlyForOperator>
```

## 🚨 Componentes Atualizados

### DashboardHeader
- ✅ Controle de acesso aos botões de configurações
- ✅ Indicador visual do nível de acesso do usuário
- ✅ Botão de perfil disponível apenas para usuários autorizados

### SystemSettings
- ✅ Proteção por ProtectedRoute
- ✅ Modo somente leitura para operadores
- ✅ Botões de ação disponíveis apenas para administradores
- ✅ Alertas informativos sobre restrições de acesso

### AdminUserManagement
- ✅ Disponível apenas para administradores
- ✅ Proteção com AdminOnly component
- ✅ Verificação de permissões antes de operações CRUD

## 🔍 Verificações de Segurança

### Autenticação
- ✅ Usuário deve estar logado para acessar funcionalidades protegidas
- ✅ Redirecionamento automático para login se não autenticado

### Autorização
- ✅ Verificação de roles em tempo real
- ✅ Verificação de permissões específicas
- ✅ Mensagens de erro informativas para acesso negado

### Interface de Usuário
- ✅ Elementos da UI são ocultados/desabilitados baseado em permissões
- ✅ Indicadores visuais de modo de acesso (somente leitura, etc.)
- ✅ Alertas informativos sobre restrições

## 📊 Matriz de Permissões

| Funcionalidade | Administrador | Operador | Supervisor |
|----------------|---------------|----------|------------|
| Visualizar Máquinas | ✅ | ✅ | ✅ |
| Criar/Editar Máquinas | ✅ | ❌ | ❌ |
| Excluir Máquinas | ✅ | ❌ | ❌ |
| Visualizar Produção | ✅ | ✅ | ✅ |
| Inserir Produção | ✅ | ✅ | ❌ |
| Editar Produção | ✅ | ❌ | ❌ |
| Visualizar Relatórios | ✅ | ✅ | ✅ |
| Exportar Relatórios | ✅ | ❌ | ✅ |
| Editar Perfil | ✅ | ✅ | ❌ |
| Ver Configurações | ✅ | ✅ | ❌ |
| Editar Configurações | ✅ | ❌ | ❌ |
| Gerenciar Usuários | ✅ | ❌ | ❌ |

## 🔄 Compatibilidade

### Base de Dados
- ✅ Sistema compatível com estrutura existente
- ✅ Roles armazenados no contexto de autenticação
- ✅ Permissões calculadas dinamicamente

### Sessões de Usuário
- ✅ Sessões ativas são mantidas
- ✅ Permissões atualizadas em tempo real
- ✅ Logout/login preserva funcionalidade

## 🚀 Próximos Passos

1. **Testes de Segurança**: Implementar testes automatizados para verificar permissões
2. **Auditoria**: Adicionar logs de acesso e tentativas de acesso negado
3. **Roles Dinâmicos**: Permitir criação de roles customizados
4. **Permissões Granulares**: Adicionar permissões mais específicas por funcionalidade

## 📞 Suporte

Para dúvidas sobre o sistema de permissões:
1. Consulte esta documentação
2. Verifique os comentários no código dos hooks de autorização
3. Teste as funcionalidades com diferentes perfis de usuário

---

**Sistema de Segurança Restaurado e Funcional** ✅

*Última atualização: Janeiro 2025*