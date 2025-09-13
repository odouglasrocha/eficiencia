# Sistema de Registro de Produção - MongoDB

## 📋 Documentação Técnica Completa

Este documento descreve o **Sistema de Registro de Produção** implementado no MongoDB, focado exclusivamente na funcionalidade de registro sem sistemas de visualização.

## 🗄️ Estrutura das Coleções MongoDB

### **Coleção: `productionRecords`**

#### **Campos da Coleção**
```javascript
{
  _id: ObjectId,                    // ID único do registro
  machine_id: String,               // ID da máquina (referência)
  start_time: Date,                 // Hora de início da produção
  end_time: Date,                   // Hora de fim da produção
  good_production: Number,          // Quantidade produzida (peças boas)
  film_waste: Number,               // Desperdício de filme
  organic_waste: Number,            // Desperdício orgânico
  planned_time: Number,             // Tempo planejado (minutos)
  downtime_minutes: Number,         // Tempo de parada (minutos)
  downtime_reason: String,          // Motivo da parada
  material_code: String,            // Código do material produzido
  shift: String,                    // Turno (A, B, C)
  operator_id: String,              // ID do operador responsável
  notes: String,                    // Observações adicionais
  batch_number: String,             // Número do lote
  quality_check: Boolean,           // Passou na verificação de qualidade
  temperature: Number,              // Temperatura durante produção
  pressure: Number,                 // Pressão durante produção
  speed: Number,                    // Velocidade da máquina
  oee_calculated: Number,           // OEE calculado para este registro
  availability_calculated: Number,  // Disponibilidade calculada
  performance_calculated: Number,   // Performance calculada
  quality_calculated: Number,       // Qualidade calculada
  created_at: Date,                 // Data de criação do registro
  updated_at: Date                  // Data da última atualização
}
```

#### **Índices Recomendados**
```javascript
// Índice composto para consultas por máquina e data
db.productionRecords.createIndex({ "machine_id": 1, "start_time": -1 })

// Índice para consultas por turno
db.productionRecords.createIndex({ "shift": 1, "start_time": -1 })

// Índice para consultas por operador
db.productionRecords.createIndex({ "operator_id": 1, "start_time": -1 })

// Índice para consultas por material
db.productionRecords.createIndex({ "material_code": 1, "start_time": -1 })

// Índice para consultas por data
db.productionRecords.createIndex({ "start_time": -1 })

// Índice para consultas por lote
db.productionRecords.createIndex({ "batch_number": 1 })
```

### **Coleções Relacionadas**

#### **Coleção: `machines`**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  status: String,
  target_production: Number,
  current_production: Number,
  oee: Number,
  availability: Number,
  performance: Number,
  quality: Number,
  last_production_update: Date,
  created_at: Date,
  updated_at: Date
}
```

#### **Coleção: `downtimeEvents`**
```javascript
{
  _id: ObjectId,
  machine_id: String,
  start_time: Date,
  end_time: Date,
  reason: String,
  category: String,
  minutes: Number,
  downtime_reason_id: String,
  created_at: Date
}
```

## 🔧 Operações CRUD Implementadas

### **1. Criar Registro de Produção**
```javascript
// Função: createProductionRecord(data)
const newRecord = {
  machine_id: "machine_001",
  start_time: new Date("2025-01-15T08:00:00Z"),
  end_time: new Date("2025-01-15T16:00:00Z"),
  good_production: 1500,
  film_waste: 25,
  organic_waste: 10.5,
  planned_time: 480, // 8 horas
  downtime_minutes: 30,
  material_code: "MAT001",
  shift: "A",
  operator_id: "op_001",
  batch_number: "BATCH_20250115_001",
  quality_check: true,
  temperature: 180.5,
  pressure: 2.5,
  speed: 150
};
```

### **2. Atualizar Registro Existente**
```javascript
// Função: updateProductionRecord(recordId, updates)
const updates = {
  good_production: 1600,
  notes: "Produção ajustada após verificação",
  quality_check: true
};
```

### **3. Buscar Registros com Filtros**
```javascript
// Função: getProductionRecords(filters)
const filters = {
  machineId: "machine_001",
  startDate: "2025-01-15T00:00:00Z",
  endDate: "2025-01-15T23:59:59Z",
  shift: "A",
  operatorId: "op_001",
  limit: 50,
  offset: 0
};
```

### **4. Buscar Registro por ID**
```javascript
// Função: getProductionRecordById(recordId)
const record = await getProductionRecordById("record_123");
```

### **5. Excluir Registro**
```javascript
// Função: deleteProductionRecord(recordId)
await deleteProductionRecord("record_123");
```

### **6. Estatísticas de Produção**
```javascript
// Função: getProductionStatistics(filters)
const stats = {
  totalRecords: 150,
  totalProduction: 225000,
  totalWaste: 3750,
  totalDowntime: 450,
  totalPlannedTime: 72000,
  averageOEE: 85.5,
  averageAvailability: 92.3,
  averagePerformance: 88.7,
  averageQuality: 96.2
};
```

## 📊 Cálculos de Métricas OEE

### **Fórmulas Implementadas**
```javascript
// Disponibilidade (Availability)
availability = (actualRuntime / plannedTime) * 100
actualRuntime = plannedTime - downtimeMinutes

// Performance
performance = (goodProduction / targetProduction) * 100

// Qualidade (assumida como 100% por padrão)
quality = 100

// OEE Global
oee = (availability * performance * quality) / 10000
```

## 🔄 Integração com Sistema Existente

### **Hook: `useProductionRecords`**
```javascript
const {
  // Dados
  records,
  statistics,
  loading,
  
  // Operações CRUD
  createProductionRecord,
  updateProductionRecord,
  loadProductionRecords,
  getProductionRecordById,
  deleteProductionRecord,
  loadProductionStatistics,
  
  // Compatibilidade
  createOrUpdateProductionRecord
} = useProductionRecords();
```

### **Serviço: `mockMongoService`**
```javascript
// Todas as operações implementadas no mockMongoService
- createProductionRecord(data)
- updateProductionRecord(recordId, updates)
- getProductionRecords(filters)
- getProductionRecordById(recordId)
- deleteProductionRecord(recordId)
- getProductionStatistics(filters)
- updateMachineMetrics(machineId) // Privada
```

## 🛡️ Validações e Integridade

### **Validações Implementadas**
1. **Campo Obrigatório**: `machine_id` deve estar presente
2. **Validação de Material**: Verifica se o código do material existe
3. **Validação de Datas**: `end_time` deve ser posterior a `start_time`
4. **Validação Numérica**: Campos numéricos devem ser >= 0
5. **Validação de Turno**: Deve ser A, B ou C

### **Integridade Referencial**
- `machine_id` deve referenciar uma máquina existente
- `operator_id` deve referenciar um operador válido
- `material_code` deve existir na tabela de materiais

## ⚡ Otimizações de Performance

### **Estratégias Implementadas**
1. **Índices Compostos**: Para consultas frequentes por máquina + data
2. **Paginação**: Limite de 50 registros por consulta por padrão
3. **Filtros Eficientes**: Uso de índices para todas as consultas
4. **Cálculo Assíncrono**: Métricas OEE calculadas em background
5. **Cache Local**: Dados armazenados no localStorage para desenvolvimento

### **Consultas Otimizadas**
```javascript
// Consulta otimizada por máquina e período
db.productionRecords.find({
  machine_id: "machine_001",
  start_time: {
    $gte: ISODate("2025-01-15T00:00:00Z"),
    $lte: ISODate("2025-01-15T23:59:59Z")
  }
}).sort({ start_time: -1 }).limit(50)

// Consulta agregada para estatísticas
db.productionRecords.aggregate([
  { $match: { machine_id: "machine_001" } },
  { $group: {
    _id: null,
    totalProduction: { $sum: "$good_production" },
    totalWaste: { $sum: { $add: ["$film_waste", "$organic_waste"] } },
    totalDowntime: { $sum: "$downtime_minutes" },
    avgOEE: { $avg: "$oee_calculated" }
  }}
])
```

## 🔧 Configuração e Deployment

### **Variáveis de Ambiente**
```env
MONGODB_URI=mongodb://localhost:27017/sistema-oee
MONGODB_DB_NAME=sistema-oee
PRODUCTION_COLLECTION=productionRecords
MACHINES_COLLECTION=machines
DOWNTIME_COLLECTION=downtimeEvents
```

### **Inicialização do Banco**
```javascript
// Script: initMongoDB.ts
- Criar coleções necessárias
- Aplicar índices otimizados
- Inserir dados iniciais de teste
- Configurar validações de schema
```

## 📈 Monitoramento e Logs

### **Logs Implementados**
```javascript
// Logs de operações
console.log('🔍 Criando registro de produção:', data);
console.log('✅ Registro inserido com sucesso:', result);
console.error('❌ Erro ao criar registro:', error);

// Logs de performance
console.time('ProductionRecord-Create');
// ... operação
console.timeEnd('ProductionRecord-Create');
```

### **Métricas de Sistema**
- Tempo de resposta das operações CRUD
- Número de registros processados por minuto
- Taxa de erro nas operações
- Uso de memória e CPU

## 🚀 Próximos Passos

### **Melhorias Futuras**
1. **Validação de Schema**: Implementar validação MongoDB nativa
2. **Backup Automático**: Rotina de backup dos registros de produção
3. **Arquivamento**: Mover registros antigos para coleção de arquivo
4. **Auditoria**: Log de todas as alterações nos registros
5. **API REST**: Endpoints para integração com sistemas externos

### **Escalabilidade**
1. **Sharding**: Distribuir dados por múltiplos servidores
2. **Replica Set**: Configurar replicação para alta disponibilidade
3. **Índices Parciais**: Para consultas específicas
4. **Agregação Pipeline**: Para relatórios complexos

## 📋 Resumo da Implementação

### ✅ **Funcionalidades Implementadas**
- ✅ Criar registros de produção
- ✅ Atualizar registros existentes
- ✅ Consultar dados históricos com filtros
- ✅ Excluir registros quando necessário
- ✅ Calcular métricas OEE automaticamente
- ✅ Validação de integridade de dados
- ✅ Otimização para alta frequência
- ✅ Compatibilidade com sistema existente

### 🗄️ **Coleções Utilizadas**
- ✅ `productionRecords` - Registros principais
- ✅ `machines` - Dados das máquinas
- ✅ `downtimeEvents` - Eventos de parada
- ✅ `downtimeReasons` - Motivos de parada

### 📊 **Campos e Índices**
- ✅ 24 campos implementados na coleção principal
- ✅ 6 índices otimizados para performance
- ✅ Relacionamentos com outras coleções
- ✅ Validações de integridade

### 🔧 **Operações CRUD**
- ✅ Create: `createProductionRecord()`
- ✅ Read: `getProductionRecords()` com filtros
- ✅ Update: `updateProductionRecord()`
- ✅ Delete: `deleteProductionRecord()`
- ✅ Statistics: `getProductionStatistics()`

---

**Sistema de Registro de Produção MongoDB - Implementação Completa** ✅

*Documentação técnica - Janeiro 2025*