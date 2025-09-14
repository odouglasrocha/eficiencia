# 📋 Documentação - Funcionalidade Registro de Produção

## 🎯 Visão Geral

Este documento detalha a implementação completa da funcionalidade **Registro de Produção** no sistema OEE, incluindo persistência no MongoDB, cálculos automáticos de métricas OEE, integração frontend/backend e relacionamentos com outras coleções.

## 🗄️ Estrutura do Banco de Dados

### Coleção: `productionrecords`

**Schema MongoDB:**
```javascript
{
  machine_id: String,           // ID da máquina (obrigatório, relacionamento)
  start_time: Date,             // Início da produção (obrigatório)
  end_time: Date,               // Fim da produção
  good_production: Number,      // Produção boa (obrigatório, min: 0)
  film_waste: Number,           // Refugo de filme (obrigatório, min: 0)
  organic_waste: Number,        // Refugo orgânico (obrigatório, min: 0)
  planned_time: Number,         // Tempo planejado em minutos (obrigatório, min: 0)
  downtime_minutes: Number,     // Tempo de parada em minutos (obrigatório, min: 0)
  downtime_reason: String,      // Motivo da parada
  material_code: String,        // Código do material
  shift: String,                // Turno: 'A', 'B', 'C'
  operator_id: String,          // ID do operador
  notes: String,                // Observações
  batch_number: String,         // Número do lote
  quality_check: Boolean,       // Passou na verificação de qualidade (padrão: true)
  temperature: Number,          // Temperatura durante produção
  pressure: Number,             // Pressão durante produção
  speed: Number,                // Velocidade da máquina
  oee_calculated: Number,       // OEE calculado automaticamente (0-100)
  availability_calculated: Number, // Disponibilidade calculada (0-100)
  performance_calculated: Number,  // Performance calculada (0-100)
  quality_calculated: Number,   // Qualidade calculada (0-100)
  created_at: Date,             // Data de criação
  updated_at: Date              // Data de atualização
}
```

### Índices Otimizados

**Índices Simples:**
```javascript
{ machine_id: 1 }        // Consultas por máquina
{ start_time: 1 }        // Consultas por data
{ material_code: 1 }     // Consultas por material
{ shift: 1 }             // Consultas por turno
{ operator_id: 1 }       // Consultas por operador
{ batch_number: 1 }      // Consultas por lote
{ created_at: 1 }        // Ordenação por criação
```

**Índices Compostos:**
```javascript
{ machine_id: 1, start_time: -1 }  // Histórico por máquina
{ shift: 1, start_time: -1 }       // Histórico por turno
{ operator_id: 1, start_time: -1 } // Histórico por operador
{ material_code: 1, start_time: -1 } // Histórico por material
```

### Cálculos Automáticos de OEE

**Middleware de Pré-Salvamento:**
```javascript
// Disponibilidade = (Tempo Planejado - Tempo de Parada) / Tempo Planejado * 100
availability = ((planned_time - downtime_minutes) / planned_time) * 100

// Performance = Produção Real / Produção Planejada * 100
performance = (good_production / planned_production) * 100

// Qualidade = Produção Boa / (Produção Boa + Refugo) * 100
quality = (good_production / (good_production + film_waste + organic_waste)) * 100

// OEE = Disponibilidade * Performance * Qualidade / 10000
oee = (availability * performance * quality) / 10000
```

## 🔌 API Endpoints

### Base URL: `http://localhost:3001/api`

#### 1. **GET /production-records**
Lista registros de produção com filtros avançados.

**Query Parameters:**
- `machine_id` (opcional): Filtrar por máquina
- `start_date` (opcional): Data inicial (ISO string)
- `end_date` (opcional): Data final (ISO string)
- `shift` (opcional): Filtrar por turno (A, B, C)
- `operator_id` (opcional): Filtrar por operador
- `material_code` (opcional): Filtrar por material
- `batch_number` (opcional): Filtrar por lote
- `limit` (opcional): Limite de resultados (padrão: 50)
- `offset` (opcional): Offset para paginação (padrão: 0)

**Resposta:**
```json
{
  "records": [
    {
      "_id": "ObjectId",
      "machine_id": "machine_id_here",
      "start_time": "2025-01-15T08:00:00.000Z",
      "end_time": "2025-01-15T10:00:00.000Z",
      "good_production": 950,
      "film_waste": 30,
      "organic_waste": 20,
      "planned_time": 120,
      "downtime_minutes": 25,
      "downtime_reason": "Manutenção preventiva",
      "material_code": "MAT001",
      "shift": "A",
      "operator_id": "OP001",
      "notes": "Produção normal",
      "batch_number": "LOTE2025001",
      "quality_check": true,
      "temperature": 185.5,
      "pressure": 12.3,
      "speed": 85.2,
      "oee_calculated": 78.5,
      "availability_calculated": 79.2,
      "performance_calculated": 95.0,
      "quality_calculated": 95.0,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

#### 2. **GET /production-records/:id**
Busca um registro específico por ID.

**Resposta:**
```json
{
  "_id": "ObjectId",
  "machine_id": "machine_id_here",
  // ... todos os campos do registro
}
```

#### 3. **POST /production-records**
Cria um novo registro de produção.

**Body:**
```json
{
  "machine_id": "machine_id_here",
  "start_time": "2025-01-15T08:00:00.000Z",
  "end_time": "2025-01-15T10:00:00.000Z",
  "good_production": 950,
  "film_waste": 30,
  "organic_waste": 20,
  "planned_time": 120,
  "downtime_minutes": 25,
  "downtime_reason": "Manutenção preventiva",
  "material_code": "MAT001",
  "shift": "A",
  "operator_id": "OP001",
  "notes": "Produção normal",
  "batch_number": "LOTE2025001",
  "quality_check": true,
  "temperature": 185.5,
  "pressure": 12.3,
  "speed": 85.2
}
```

**Validações:**
- `machine_id`, `start_time`, `good_production`, `film_waste`, `organic_waste`, `planned_time`, `downtime_minutes` são obrigatórios
- Máquina deve existir na coleção `machines`
- Valores numéricos devem ser >= 0
- `shift` deve ser 'A', 'B' ou 'C'

**Resposta de Sucesso (201):**
```json
{
  "_id": "ObjectId",
  "machine_id": "machine_id_here",
  // ... todos os campos incluindo métricas calculadas
  "oee_calculated": 78.5,
  "availability_calculated": 79.2,
  "performance_calculated": 95.0,
  "quality_calculated": 95.0
}
```

#### 4. **PUT /production-records/:id**
Atualiza um registro existente.

**Body:** (campos opcionais)
```json
{
  "end_time": "2025-01-15T10:30:00.000Z",
  "good_production": 980,
  "notes": "Produção finalizada com sucesso"
}
```

#### 5. **DELETE /production-records/:id**
Deleta um registro de produção.

**Resposta:**
```json
{
  "message": "Registro de produção deletado com sucesso"
}
```

#### 6. **GET /production-statistics**
Retorna estatísticas agregadas de produção.

**Query Parameters:**
- `machine_id` (opcional): Filtrar por máquina
- `start_date` (opcional): Data inicial
- `end_date` (opcional): Data final
- `shift` (opcional): Filtrar por turno

**Resposta:**
```json
{
  "totalRecords": 25,
  "totalProduction": 23750,
  "totalWaste": 1250,
  "totalDowntime": 450,
  "totalPlannedTime": 3000,
  "averageOEE": 82.3,
  "averageAvailability": 85.0,
  "averagePerformance": 94.5,
  "averageQuality": 95.0
}
```

#### 7. **POST /init/production-records**
Inicializa registros de produção padrão para demonstração.

**Resposta:**
```json
{
  "message": "Inicialização de registros de produção concluída",
  "results": [
    {
      "batch_number": "LOTE2025001",
      "machine": "Extrusora Principal",
      "status": "criado",
      "id": "ObjectId",
      "oee": "78.5%"
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

### 1. **ProductionDialog.tsx**
Componente principal para registro de produção.

**Funcionalidades:**
- Formulário completo com todos os campos
- Validações em tempo real
- Cálculo automático de turnos
- Gestão de eventos de parada
- Integração com materiais e máquinas

**Campos do Formulário:**
- **Máquina**: Seleção da máquina (obrigatório)
- **Material**: Código do material
- **Período**: Data/hora início e fim
- **Produção**: Produção boa, refugo filme, refugo orgânico
- **Eventos de Parada**: Lista de paradas com motivo e duração
- **Parâmetros**: Temperatura, pressão, velocidade
- **Observações**: Notas adicionais
- **Lote**: Número do lote
- **Qualidade**: Aprovação de qualidade

### 2. **useProductionRecords Hook**
Hook personalizado para gerenciamento de registros.

**Funcionalidades:**
- CRUD completo de registros
- Integração híbrida (API real + mock)
- Conversão de formatos de dados
- Tratamento de erros
- Loading states

**Interface:**
```typescript
export interface ProductionRecordData {
  recordId?: string;
  machineId: string;
  materialCode: string;
  startTime: string;
  endTime: string;
  plannedTime: number;
  goodProduction: number;
  filmWaste: number;
  organicWaste: string;
  downtimeEvents: DowntimeEventData[];
  shift?: string;
  operatorId?: string;
  notes?: string;
  batchNumber?: string;
  qualityCheck?: boolean;
  temperature?: number;
  pressure?: number;
  speed?: number;
}

export interface DowntimeEventData {
  id: string;
  reason: string;
  duration: number;
  description: string;
}
```

## 🔧 Serviços

### 1. **productionRecordService.ts**
Serviço para integração com API MongoDB real.

**Funcionalidades:**
- Verificação de disponibilidade da API
- CRUD completo de registros
- Conversão de eventos de parada
- Tratamento de erros específicos
- Autenticação automática via token

**Métodos:**
```typescript
class ProductionRecordService {
  async isApiAvailable(): Promise<boolean>
  async getProductionRecords(filters?): Promise<{ records: ProductionRecord[]; total: number }>
  async getProductionRecordById(id: string): Promise<ProductionRecord>
  async createProductionRecord(data): Promise<ProductionRecord>
  async updateProductionRecord(id: string, updates): Promise<ProductionRecord>
  async deleteProductionRecord(id: string): Promise<void>
  async getProductionStatistics(filters?): Promise<ProductionStatistics>
}
```

### 2. **Integração Híbrida**
Sistema que detecta disponibilidade da API e usa fallback automático.

**Fluxo:**
```
1. 🔍 Verificar disponibilidade da API MongoDB
2. ✅ Se disponível: Usar productionRecordService
3. ❌ Se indisponível: Usar productionService (mock)
4. 🔄 Conversão automática de formatos
5. 📊 Sincronização de dados
```

## 🔗 Relacionamentos

### 1. **Máquinas (machines)**
- **Relacionamento**: `machine_id` → `machines._id`
- **Validação**: Máquina deve existir antes de criar registro
- **Cascata**: Registros mantidos mesmo se máquina for deletada

### 2. **Materiais (materialsData)**
- **Relacionamento**: `material_code` → `materialsData.Codigo`
- **Validação**: Material deve existir na base de dados
- **Uso**: Rastreabilidade de produção por material

### 3. **Operadores (users)**
- **Relacionamento**: `operator_id` → `users._id`
- **Uso**: Rastreabilidade por operador
- **Relatórios**: Performance por operador

### 4. **Turnos (shifts)**
- **Cálculo automático**: Baseado em `start_time`
- **Valores**: 'A' (06:00-14:00), 'B' (14:00-22:00), 'C' (22:00-06:00)
- **Relatórios**: Análise por turno

## 📊 Métricas e Cálculos

### 1. **OEE (Overall Equipment Effectiveness)**
```
OEE = Disponibilidade × Performance × Qualidade
```

### 2. **Disponibilidade (Availability)**
```
Disponibilidade = (Tempo Planejado - Tempo de Parada) / Tempo Planejado × 100
```

### 3. **Performance**
```
Performance = Produção Real / Produção Planejada × 100
```

### 4. **Qualidade (Quality)**
```
Qualidade = Produção Boa / (Produção Boa + Total de Refugo) × 100
```

### 5. **Cálculos Automáticos**
- Executados no middleware `pre('save')`
- Atualizados a cada modificação
- Armazenados nos campos `*_calculated`
- Disponíveis imediatamente após salvamento

## 🛡️ Validações e Segurança

### Validações Backend
1. **Campos obrigatórios**: machine_id, start_time, good_production, film_waste, organic_waste, planned_time, downtime_minutes
2. **Existência de máquina**: Verificação na coleção machines
3. **Valores numéricos**: Todos >= 0
4. **Enum validation**: shift deve ser 'A', 'B' ou 'C'
5. **Datas válidas**: start_time e end_time em formato ISO

### Validações Frontend
1. **Campos obrigatórios**: Feedback visual
2. **Formato de dados**: Validação de tipos
3. **Lógica de negócio**: end_time > start_time
4. **Materiais válidos**: Verificação na base materialsData

### Tratamento de Erros
1. **Erros de validação**: Mensagens específicas
2. **Erros de conexão**: Fallback automático
3. **Erros de servidor**: Logs detalhados
4. **Feedback do usuário**: Toast notifications

## 🚀 Registros Padrão Inicializados

| Lote | Máquina | Turno | Produção | OEE | Status |
|------|---------|-------|----------|-----|--------|
| LOTE2025001 | Extrusora Principal | A | 950 | 78.5% | ✅ |
| LOTE2025002 | Injetora Automática | B | 1150 | 85.2% | ✅ |
| LOTE2025003 | Linha de Montagem A | C | 800 | 65.8% | ⚠️ |
| LOTE2025004 | Extrusora Principal | A | 1050 | 92.1% | ✅ |
| LOTE2025005 | Injetora Automática | B | 920 | 81.3% | ✅ |

## 🧪 Como Testar

### 1. **Inicializar Dados**
```bash
# Inicializar máquinas (pré-requisito)
POST http://localhost:3001/api/init/machines

# Inicializar registros de produção
POST http://localhost:3001/api/init/production-records
```

### 2. **Testar Criação de Registro**
1. Acesse: http://localhost:8081/
2. Faça login com credenciais válidas
3. Clique em "Adicionar Registro de Produção"
4. Preencha o formulário:
   - Máquina: Selecione uma máquina
   - Material: "MAT001"
   - Período: Defina início e fim
   - Produção: 1000 (boa), 50 (filme), 30 (orgânico)
   - Eventos de parada: Adicione se necessário
5. Clique em "Salvar Registro"
6. Verifique se aparece na lista com métricas calculadas

### 3. **Testar API Diretamente**
```bash
# Listar registros
GET http://localhost:3001/api/production-records

# Buscar por máquina
GET http://localhost:3001/api/production-records?machine_id=MACHINE_ID

# Estatísticas
GET http://localhost:3001/api/production-statistics

# Criar registro
POST http://localhost:3001/api/production-records
Content-Type: application/json
{
  "machine_id": "MACHINE_ID",
  "start_time": "2025-01-15T08:00:00.000Z",
  "good_production": 1000,
  "film_waste": 50,
  "organic_waste": 30,
  "planned_time": 120,
  "downtime_minutes": 15
}
```

### 4. **Testar Fallback**
1. Pare o servidor MongoDB (Ctrl+C no terminal)
2. Tente criar um registro
3. Verifique se usa mockMongoService
4. Reinicie o servidor
5. Verifique se volta a usar API real

## 📈 Métricas e Monitoramento

### Logs do Servidor
```
✅ Novo registro de produção criado para máquina Extrusora Principal
✅ Registro de produção atualizado: ObjectId
✅ Registro de produção deletado: ObjectId
❌ Erro ao criar registro de produção: Máquina não encontrada
```

### Logs do Frontend
```
✅ Usando API MongoDB real para criar registro de produção
ℹ️ Usando productionService para criar registro de produção
🔄 Criando novo registro de produção: { machineId: "...", ... }
✅ Registro de produção criado com sucesso
```

### Estatísticas Disponíveis
- Total de registros por período
- Produção total e média
- Refugo total e percentual
- Tempo de parada total
- OEE médio por máquina/turno/operador
- Tendências de performance

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

1. **Implementar relatórios avançados** com gráficos de tendência
2. **Adicionar alertas automáticos** para baixo OEE
3. **Implementar análise preditiva** de paradas
4. **Adicionar integração com sensores** IoT
5. **Implementar dashboard em tempo real**
6. **Adicionar exportação de dados** (Excel, PDF)
7. **Implementar comparação de períodos**
8. **Adicionar metas de produção** dinâmicas

---

**Funcionalidade Registro de Produção - Completamente Implementada** ✅

*Sistema completo com persistência MongoDB, cálculos automáticos de OEE, integração híbrida e relacionamentos otimizados - Janeiro 2025*