# 📋 Documentação - Funcionalidade Adicionar Nova Máquina

## 🎯 Visão Geral

Este documento detalha a implementação completa da funcionalidade **Adicionar Nova Máquina** no sistema OEE, incluindo persistência no MongoDB, validações, integração frontend/backend e estruturas de dados otimizadas.

## 🗄️ Estrutura do Banco de Dados

### Coleção: `machines`

**Schema MongoDB:**
```javascript
{
  name: String,              // Nome da máquina (obrigatório)
  code: String,              // Código único da máquina (obrigatório, único, maiúsculo)
  status: String,            // Status: 'ativa', 'manutencao', 'parada', 'inativa'
  oee: Number,               // Overall Equipment Effectiveness (0-100)
  availability: Number,      // Disponibilidade (0-100)
  performance: Number,       // Performance (0-100)
  quality: Number,           // Qualidade (0-100)
  current_production: Number, // Produção atual
  target_production: Number, // Meta de produção
  capacity: Number,          // Capacidade máxima
  permissions: [String],     // Permissões de acesso
  access_level: String,      // Nível de acesso: 'operador', 'supervisor', 'administrador'
  last_production_update: Date, // Última atualização de produção
  created_at: Date,          // Data de criação
  updated_at: Date           // Data de atualização
}
```

**Índices Otimizados:**
```javascript
// Índice único para código
{ code: 1 } - unique: true

// Índice para status (consultas frequentes)
{ status: 1 }

// Índice de texto para busca
{ name: 'text', code: 'text' }
```

## 🔌 API Endpoints

### Base URL: `http://localhost:3001/api`

#### 1. **GET /machines**
Lista todas as máquinas com filtros opcionais.

**Query Parameters:**
- `status` (opcional): Filtrar por status
- `search` (opcional): Busca por texto (nome ou código)
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta:**
```json
{
  "machines": [
    {
      "_id": "ObjectId",
      "name": "Extrusora Principal",
      "code": "EXT-001",
      "status": "ativa",
      "oee": 85.5,
      "availability": 90.0,
      "performance": 95.0,
      "quality": 100.0,
      "current_production": 1150,
      "target_production": 1200,
      "capacity": 1500,
      "permissions": ["visualizar_oee", "editar_producao"],
      "access_level": "operador",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### 2. **GET /machines/:id**
Busca uma máquina específica por ID.

**Resposta:**
```json
{
  "_id": "ObjectId",
  "name": "Extrusora Principal",
  "code": "EXT-001",
  // ... outros campos
}
```

#### 3. **POST /machines**
Cria uma nova máquina.

**Body:**
```json
{
  "name": "Nova Máquina",
  "code": "NM-001",
  "status": "inativa",
  "permissions": ["visualizar_oee"],
  "access_level": "operador",
  "capacity": 1000,
  "target_production": 800
}
```

**Validações:**
- Nome e código são obrigatórios
- Código deve ser único (case-insensitive)
- Nome deve ser único (case-insensitive)
- Status deve ser um dos valores válidos
- Capacidade e produção alvo devem ser números positivos

**Resposta de Sucesso (201):**
```json
{
  "_id": "ObjectId",
  "name": "Nova Máquina",
  "code": "NM-001",
  "status": "inativa",
  "oee": 0,
  "availability": 0,
  "performance": 0,
  "quality": 100,
  "current_production": 0,
  "target_production": 800,
  "capacity": 1000,
  "permissions": ["visualizar_oee"],
  "access_level": "operador",
  "created_at": "2025-01-15T10:00:00.000Z",
  "updated_at": "2025-01-15T10:00:00.000Z"
}
```

**Resposta de Erro (409 - Conflito):**
```json
{
  "message": "Já existe uma máquina com o código 'NM-001'"
}
```

#### 4. **PUT /machines/:id**
Atualiza uma máquina existente.

**Body:** (campos opcionais)
```json
{
  "name": "Nome Atualizado",
  "status": "ativa",
  "capacity": 1200
}
```

#### 5. **DELETE /machines/:id**
Deleta uma máquina.

**Resposta:**
```json
{
  "message": "Máquina deletada com sucesso"
}
```

#### 6. **POST /init/machines**
Inicializa máquinas padrão no sistema.

**Resposta:**
```json
{
  "message": "Inicialização de máquinas concluída",
  "results": [
    {
      "code": "EXT-001",
      "name": "Extrusora Principal",
      "status": "criada",
      "id": "ObjectId"
    }
  ],
  "summary": {
    "total": 5,
    "created": 5,
    "existing": 0,
    "errors": 0
  }
}
```

## 🎨 Frontend - Componentes

### 1. **AddMachineDialog.tsx**
Componente de diálogo para adicionar nova máquina.

**Props:**
```typescript
interface AddMachineDialogProps {
  onAdd: (data: CreateMachineData) => Promise<any>;
}
```

**Campos do Formulário:**
- Nome da máquina (obrigatório)
- Código da máquina (obrigatório, convertido para maiúsculo)
- Status inicial (seleção)
- Nível de acesso (seleção)
- Capacidade (número, unidades/hora)
- Produção alvo (número, unidades/hora)
- Permissões (checkboxes múltiplas)

**Validações Frontend:**
- Campos obrigatórios
- Formato de números
- Valores mínimos

### 2. **useMachines Hook**
Hook personalizado para gerenciamento de máquinas.

**Funcionalidades:**
- Buscar máquinas
- Criar nova máquina
- Atualizar máquina
- Deletar máquina
- Integração automática com API real ou mock

**Interface:**
```typescript
export interface Machine {
  id: string;
  name: string;
  code: string;
  status: 'ativa' | 'manutencao' | 'parada' | 'inativa';
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_production: number;
  target_production: number;
  capacity: number;
  permissions: string[];
  access_level: 'operador' | 'supervisor' | 'administrador';
  created_at?: string;
  updated_at?: string;
}

export interface CreateMachineData {
  name: string;
  code: string;
  status: 'ativa' | 'manutencao' | 'parada' | 'inativa';
  permissions: string[];
  access_level: 'operador' | 'supervisor' | 'administrador';
}
```

## 🔧 Serviços

### 1. **machineService.ts**
Serviço para integração com API MongoDB real.

**Funcionalidades:**
- Verificação de disponibilidade da API
- CRUD completo de máquinas
- Tratamento de erros
- Conversão de formatos (MongoDB ↔ Frontend)
- Autenticação automática via token

**Métodos:**
```typescript
class MachineService {
  async isApiAvailable(): Promise<boolean>
  async getMachines(filters?): Promise<{ machines: Machine[]; total: number }>
  async getMachineById(id: string): Promise<Machine>
  async createMachine(machineData): Promise<Machine>
  async updateMachine(id: string, updates): Promise<Machine>
  async deleteMachine(id: string): Promise<void>
}
```

### 2. **Fallback para mockMongoService**
Quando a API real não está disponível, o sistema automaticamente usa o serviço mock para desenvolvimento.

## 🔒 Validações e Segurança

### Validações de Duplicata
1. **Código único**: Verificação case-insensitive
2. **Nome único**: Verificação case-insensitive
3. **Validação dupla**: Frontend + Backend

### Validações de Dados
1. **Campos obrigatórios**: Nome e código
2. **Formato de código**: Convertido para maiúsculo
3. **Valores numéricos**: Capacidade e produção > 0
4. **Status válido**: Enum restrito
5. **Nível de acesso**: Enum restrito

### Tratamento de Erros
1. **Erros de duplicata**: Mensagens específicas
2. **Erros de validação**: Feedback detalhado
3. **Erros de conexão**: Fallback automático
4. **Erros de servidor**: Logs detalhados

## 📊 Fluxo de Dados

### Criação de Nova Máquina
```
1. 👤 Usuário preenche formulário
2. 🔍 Validação frontend
3. 📡 Envio para API
4. 🔒 Validação backend
5. 🔍 Verificação de duplicatas
6. 💾 Persistência no MongoDB
7. 📊 Atualização do estado frontend
8. ✅ Feedback para usuário
```

### Integração Híbrida (API Real + Mock)
```
1. 🔍 Verificar disponibilidade da API
2. ✅ Se disponível: Usar API MongoDB real
3. ❌ Se indisponível: Usar mockMongoService
4. 📊 Conversão de formatos quando necessário
5. 🔄 Sincronização automática
```

## 🚀 Máquinas Padrão Inicializadas

| Código | Nome | Status | Capacidade | Produção Alvo | Nível |
|--------|------|--------|------------|---------------|-------|
| EXT-001 | Extrusora Principal | Ativa | 1500 | 1200 | Operador |
| INJ-002 | Injetora Automática | Ativa | 800 | 600 | Operador |
| LMA-003 | Linha de Montagem A | Manutenção | 2000 | 1800 | Supervisor |
| PRH-004 | Prensa Hidráulica | Ativa | 500 | 400 | Operador |
| CNC-005 | Centro de Usinagem CNC | Parada | 300 | 250 | Supervisor |

## 🧪 Como Testar

### 1. **Inicializar Máquinas Padrão**
```bash
# Via API
POST http://localhost:3001/api/init/machines

# Via Console do Browser
initializeMachines()
```

### 2. **Testar Criação de Máquina**
1. Acesse o sistema: http://localhost:8081/
2. Faça login com credenciais válidas
3. Clique em "Adicionar Nova Máquina"
4. Preencha o formulário:
   - Nome: "Máquina de Teste"
   - Código: "TST-001"
   - Status: "Inativa"
   - Capacidade: 500
   - Produção Alvo: 400
5. Selecione permissões
6. Clique em "Criar Máquina"
7. Verifique se aparece na lista

### 3. **Testar Validações**
1. Tente criar máquina com código duplicado
2. Tente criar máquina com nome duplicado
3. Tente criar máquina sem nome ou código
4. Verifique mensagens de erro específicas

### 4. **Testar Fallback**
1. Pare o servidor MongoDB (Ctrl+C no terminal)
2. Tente criar uma máquina
3. Verifique se usa mockMongoService
4. Reinicie o servidor
5. Verifique se volta a usar API real

## 📈 Métricas e Monitoramento

### Logs do Servidor
```
✅ Nova máquina criada: Extrusora Principal (EXT-001)
✅ Máquina atualizada: Extrusora Principal (EXT-001)
✅ Máquina deletada: Extrusora Principal (EXT-001)
❌ Erro ao criar máquina: Já existe uma máquina com o código 'EXT-001'
```

### Logs do Frontend
```
✅ Usando API MongoDB real para criar máquina
ℹ️ Usando mockMongoService para criar máquina
🔄 Criando nova máquina: { name: "...", code: "..." }
✅ Máquina criada com sucesso
```

## 🔧 Configuração

### String de Conexão MongoDB
```
mongodb+srv://orlanddouglas_db_user:TqtwMu2HTPBszmv7@banco.asm5oa1.mongodb.net/?retryWrites=true&w=majority&appName=Banco
```

### Variáveis de Ambiente
```bash
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=cec877368c531f476fda198b8af39f88...
```

## 🎯 Próximos Passos

1. **Implementar filtros avançados** na listagem
2. **Adicionar paginação** na interface
3. **Implementar busca em tempo real**
4. **Adicionar validação de imagem** para máquinas
5. **Implementar histórico de alterações**
6. **Adicionar exportação de dados**
7. **Implementar notificações** para mudanças de status
8. **Adicionar dashboard** de métricas por máquina

---

**Funcionalidade Adicionar Nova Máquina - Completamente Implementada** ✅

*Documentação técnica completa - Janeiro 2025*