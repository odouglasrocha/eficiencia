# 📚 Documentação do Módulo de Gerenciamento de Usuários
## Sistema OEE - Controle de Acesso Avançado

**Engenheiro:** Especialista em Autenticação e Bancos de Dados  
**Data:** Janeiro 2025  
**Versão:** 1.0.0

---

## 🎯 Visão Geral

O Módulo de Gerenciamento de Usuários é um sistema completo de autenticação, autorização e auditoria integrado ao Sistema OEE. Fornece controle granular de acesso, gestão de perfis e permissões, além de auditoria completa de todas as ações do sistema.

### ✨ Funcionalidades Principais

- ✅ **Autenticação JWT** com tokens seguros
- ✅ **Gestão completa de usuários** (CRUD)
- ✅ **Sistema de perfis e permissões** granular
- ✅ **Auditoria completa** de ações
- ✅ **Segurança avançada** (bcrypt, bloqueio de conta)
- ✅ **Integração com MongoDB Atlas**
- ✅ **Índices otimizados** para performance
- ✅ **Soft delete** para preservar relacionamentos

---

## 🗄️ Estrutura do Banco de Dados

### Coleção: `users`

```javascript
{
  _id: ObjectId,
  email: String (único, obrigatório, lowercase),
  password: String (hash bcrypt, obrigatório),
  full_name: String (obrigatório, max 100 chars),
  profile_id: ObjectId (ref: Profile, obrigatório, indexado),
  department: String (max 50 chars),
  position: String (max 50 chars),
  phone: String (validação regex),
  language: String (enum: ['pt-BR', 'en-US', 'es-ES']),
  timezone: String (default: 'America/Sao_Paulo'),
  notifications: {
    email: Boolean (default: true),
    push: Boolean (default: true),
    whatsapp: Boolean (default: false)
  },
  preferences: {
    theme: String (enum: ['light', 'dark', 'auto']),
    dashboard_layout: String (enum: ['default', 'compact', 'detailed'])
  },
  security: {
    two_factor_enabled: Boolean (default: false),
    login_attempts: Number (max: 5),
    locked_until: Date,
    password_changed_at: Date,
    last_login: Date,
    password_reset_token: String,
    password_reset_expires: Date
  },
  status: String (enum: ['active', 'inactive', 'suspended', 'pending']),
  created_by: ObjectId (ref: User),
  updated_by: ObjectId (ref: User),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Índices Otimizados:**
- `{ email: 1 }` (único)
- `{ profile_id: 1 }`
- `{ status: 1 }`
- `{ department: 1 }`
- `{ created_at: -1 }`
- `{ full_name: 'text', email: 'text' }` (busca textual)

### Coleção: `profiles`

```javascript
{
  _id: ObjectId,
  name: String (único, obrigatório, enum: ['Administrador', 'Supervisor', 'Operador']),
  description: String (obrigatório),
  permissions: [{
    module: String (enum: ['users', 'machines', 'production', 'reports', 'settings', 'oee']),
    actions: [String] (enum: ['create', 'read', 'update', 'delete', 'export', 'import'])
  }],
  hierarchy_level: Number (1-10, obrigatório),
  is_active: Boolean (default: true),
  created_at: Date (default: now),
  updated_at: Date (default: now)
}
```

**Índices Otimizados:**
- `{ name: 1 }` (único)
- `{ hierarchy_level: 1 }`
- `{ is_active: 1 }`

### Coleção: `audit_logs`

```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User, obrigatório, indexado),
  action: String (enum: ['create', 'update', 'delete', 'login', 'logout', 'password_change', 'profile_change']),
  target_user_id: ObjectId (ref: User),
  details: Mixed (dados específicos da ação),
  ip_address: String,
  user_agent: String,
  timestamp: Date (default: now, indexado)
}
```

**Configuração Capped Collection:**
- Tamanho: 100MB
- Máximo: 1.000.000 documentos

**Índices Otimizados:**
- `{ user_id: 1, timestamp: -1 }`
- `{ action: 1, timestamp: -1 }`
- `{ timestamp: -1 }`

---

## 🔐 Sistema de Autenticação

### JWT Token Structure

```javascript
{
  userId: ObjectId,
  email: String,
  profileId: ObjectId,
  profileName: String,
  iat: Number,
  exp: Number (8 horas)
}
```

### Middleware de Autenticação

```javascript
const authenticateToken = async (req, res, next) => {
  // Verifica token JWT no header Authorization
  // Valida usuário ativo no banco
  // Adiciona req.user com dados completos
}
```

### Middleware de Autorização

```javascript
const authorize = (requiredModule, requiredAction) => {
  // Verifica permissões do perfil do usuário
  // Permite/nega acesso baseado em módulo e ação
}
```

---

## 🎭 Sistema de Perfis e Permissões

### Perfis Padrão

#### 1. Administrador (Nível 1)
- **Descrição:** Acesso completo ao sistema
- **Permissões:**
  - `users`: create, read, update, delete
  - `machines`: create, read, update, delete
  - `production`: create, read, update, delete
  - `reports`: create, read, export
  - `settings`: read, update
  - `oee`: read, update

#### 2. Supervisor (Nível 2)
- **Descrição:** Supervisão de produção e relatórios
- **Permissões:**
  - `users`: read
  - `machines`: read, update
  - `production`: create, read, update
  - `reports`: read, export
  - `oee`: read

#### 3. Operador (Nível 3)
- **Descrição:** Operação básica de máquinas
- **Permissões:**
  - `machines`: read
  - `production`: create, read
  - `oee`: read

### Matriz de Permissões

| Módulo | Administrador | Supervisor | Operador |
|--------|---------------|------------|----------|
| **users** | CRUD | R | - |
| **machines** | CRUD | RU | R |
| **production** | CRUD | CRU | CR |
| **reports** | CRE | RE | - |
| **settings** | RU | - | - |
| **oee** | RU | R | R |

*Legenda: C=Create, R=Read, U=Update, D=Delete, E=Export*

---

## 🌐 API Endpoints

### 🔐 Autenticação

#### `POST /api/auth/login`
**Descrição:** Autenticar usuário no sistema

**Request Body:**
```javascript
{
  "email": "admin@sistema-oee.com",
  "password": "Admin@123456"
}
```

**Response (200):**
```javascript
{
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "...",
    "email": "admin@sistema-oee.com",
    "full_name": "Administrador do Sistema",
    "profile": {
      "_id": "...",
      "name": "Administrador",
      "permissions": [...]
    },
    "preferences": {...},
    "last_login": "2025-01-15T10:30:00.000Z"
  }
}
```

#### `POST /api/auth/logout`
**Descrição:** Fazer logout do usuário  
**Autenticação:** Requerida  
**Autorização:** Nenhuma

#### `GET /api/auth/verify`
**Descrição:** Verificar validade do token  
**Autenticação:** Requerida  
**Autorização:** Nenhuma

### 👥 Gerenciamento de Usuários

#### `GET /api/users`
**Descrição:** Listar usuários com paginação e filtros  
**Autenticação:** Requerida  
**Autorização:** users:read

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` (busca em nome, email, departamento)
- `status` (active, inactive, suspended, pending)
- `profile` (nome do perfil)
- `department`
- `sort` (default: -created_at)

**Response (200):**
```javascript
{
  "users": [...],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_users": 100,
    "per_page": 20
  }
}
```

#### `GET /api/users/:id`
**Descrição:** Buscar usuário por ID  
**Autenticação:** Requerida  
**Autorização:** users:read

#### `POST /api/users`
**Descrição:** Criar novo usuário  
**Autenticação:** Requerida  
**Autorização:** users:create

**Request Body:**
```javascript
{
  "email": "usuario@empresa.com",
  "password": "senha123",
  "full_name": "Nome Completo",
  "profile_name": "Operador",
  "department": "Produção",
  "position": "Operador de Máquina",
  "phone": "+55 11 99999-9999",
  "language": "pt-BR",
  "timezone": "America/Sao_Paulo"
}
```

#### `PUT /api/users/:id`
**Descrição:** Atualizar dados do usuário  
**Autenticação:** Requerida  
**Autorização:** users:update

#### `PUT /api/users/:id/password`
**Descrição:** Alterar senha do usuário  
**Autenticação:** Requerida  
**Autorização:** users:update

**Request Body:**
```javascript
{
  "current_password": "senhaAtual", // Obrigatório se for própria senha
  "new_password": "novaSenha123"
}
```

#### `DELETE /api/users/:id`
**Descrição:** Excluir usuário (soft delete)  
**Autenticação:** Requerida  
**Autorização:** users:delete

#### `GET /api/users/stats/overview`
**Descrição:** Estatísticas de usuários  
**Autenticação:** Requerida  
**Autorização:** users:read

### 🎭 Perfis e Permissões

#### `GET /api/profiles`
**Descrição:** Listar perfis disponíveis  
**Autenticação:** Requerida  
**Autorização:** users:read

#### `GET /api/profiles/:id`
**Descrição:** Buscar perfil por ID  
**Autenticação:** Requerida  
**Autorização:** users:read

#### `PUT /api/profiles/:id/permissions`
**Descrição:** Atualizar permissões do perfil  
**Autenticação:** Requerida  
**Autorização:** users:update

### 📋 Auditoria

#### `GET /api/audit-logs`
**Descrição:** Listar logs de auditoria  
**Autenticação:** Requerida  
**Autorização:** users:read

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50)
- `user_id`
- `action`
- `start_date`
- `end_date`

---

## 🔒 Recursos de Segurança

### Hash de Senhas
- **Algoritmo:** bcrypt
- **Salt Rounds:** 12
- **Middleware:** Automático no save do usuário

### Bloqueio de Conta
- **Tentativas máximas:** 5
- **Tempo de bloqueio:** 2 horas
- **Reset automático:** Após login bem-sucedido

### Validações
- **Email:** Regex de validação + lowercase
- **Senha:** Mínimo 6 caracteres
- **Telefone:** Formato internacional
- **Campos obrigatórios:** Validação no schema

### Auditoria Completa
- **Ações registradas:** create, update, delete, login, logout, password_change, profile_change
- **Dados capturados:** IP, User-Agent, detalhes da ação
- **Retenção:** Capped collection (100MB/1M docs)

---

## 🚀 Instalação e Configuração

### 1. Arquivos do Módulo
- `user-management-module.cjs` - Schemas e utilitários
- `user-management-routes.cjs` - Endpoints da API
- `init-admin-user.cjs` - Script de inicialização

### 2. Dependências
```bash
npm install express mongoose bcryptjs jsonwebtoken
```

### 3. Variáveis de Ambiente
```bash
JWT_SECRET=sua_chave_secreta_jwt_muito_forte
MONGODB_URI=mongodb+srv://...
```

### 4. Inicialização
```bash
# Inicializar perfis e usuário admin
node init-admin-user.cjs

# Iniciar servidor
node server-corrigido.cjs
```

### 5. Credenciais Padrão
- **Email:** admin@sistema-oee.com
- **Senha:** Admin@123456
- **Perfil:** Administrador

⚠️ **IMPORTANTE:** Altere a senha padrão após o primeiro login!

---

## 📊 Performance e Otimizações

### Índices MongoDB
- **Consultas de usuários:** Otimizadas com índices compostos
- **Busca textual:** Índice de texto em nome e email
- **Auditoria:** Índices por usuário e timestamp
- **Perfis:** Índices por hierarquia e status

### Paginação
- **Padrão:** 20 usuários por página
- **Máximo:** 100 usuários por página
- **Otimização:** Skip/limit com contagem eficiente

### Caching
- **Perfis:** Cache em memória (raramente mudam)
- **Tokens JWT:** Stateless (sem cache necessário)
- **Auditoria:** Write-heavy, otimizada para inserção

---

## 🧪 Testes e Validação

### Cenários de Teste

#### Autenticação
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas
- ✅ Bloqueio após 5 tentativas
- ✅ Desbloqueio automático após 2 horas
- ✅ Verificação de token válido/inválido

#### Autorização
- ✅ Acesso permitido com permissão adequada
- ✅ Acesso negado sem permissão
- ✅ Hierarquia de perfis respeitada

#### CRUD de Usuários
- ✅ Criação com dados válidos
- ✅ Validação de email único
- ✅ Atualização de dados
- ✅ Soft delete preservando relacionamentos

#### Auditoria
- ✅ Registro de todas as ações
- ✅ Captura de metadados (IP, User-Agent)
- ✅ Consulta de logs por filtros

---

## 🔧 Manutenção e Monitoramento

### Logs de Sistema
- **Autenticação:** Sucessos e falhas
- **Autorização:** Acessos negados
- **Erros:** Stack traces completos
- **Performance:** Consultas lentas

### Métricas Importantes
- **Usuários ativos:** Monitorar crescimento
- **Tentativas de login:** Detectar ataques
- **Permissões negadas:** Identificar problemas
- **Performance de consultas:** Otimizar índices

### Backup e Recuperação
- **Coleções críticas:** users, profiles
- **Auditoria:** Backup periódico (capped collection)
- **Índices:** Documentar para recriação

---

## 📈 Roadmap e Melhorias Futuras

### Versão 1.1
- [ ] Autenticação de dois fatores (2FA)
- [ ] Reset de senha por email
- [ ] Integração com Active Directory
- [ ] API de importação em lote

### Versão 1.2
- [ ] Perfis personalizados
- [ ] Permissões por recurso específico
- [ ] Dashboard de auditoria
- [ ] Alertas de segurança

### Versão 2.0
- [ ] Single Sign-On (SSO)
- [ ] Integração com OAuth2
- [ ] API GraphQL
- [ ] Microserviços de autenticação

---

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

#### "Token inválido"
- Verificar JWT_SECRET
- Verificar expiração do token
- Verificar status do usuário

#### "Acesso negado"
- Verificar permissões do perfil
- Verificar módulo e ação requeridos
- Verificar status do perfil

#### "Usuário bloqueado"
- Aguardar 2 horas ou resetar manualmente
- Verificar tentativas de login no banco

#### Performance lenta
- Verificar índices MongoDB
- Analisar queries com explain()
- Otimizar filtros de consulta

### Contato
- **Engenheiro:** Especialista em Autenticação
- **Email:** suporte@sistema-oee.com
- **Documentação:** Este arquivo

---

## 📄 Licença e Direitos

**Sistema OEE - Módulo de Gerenciamento de Usuários**  
**Copyright © 2025 - Todos os direitos reservados**

Este módulo foi desenvolvido especificamente para o Sistema OEE com foco em segurança, performance e escalabilidade. Implementa as melhores práticas de autenticação e autorização para ambientes industriais.

---

*Documentação gerada automaticamente em Janeiro de 2025*  
*Versão do Sistema: 1.0.0*  
*Última atualização: 15/01/2025*