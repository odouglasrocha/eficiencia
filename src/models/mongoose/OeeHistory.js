const mongoose = require('mongoose');

const oeeHistorySchema = new mongoose.Schema({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  oee: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  availability: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  performance: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  quality: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices compostos para consultas otimizadas
oeeHistorySchema.index({ machine_id: 1, timestamp: -1 });
oeeHistorySchema.index({ timestamp: -1 });

// Método estático para criar entrada no histórico
oeeHistorySchema.statics.createHistoryEntry = async function(machineId, oeeMetrics) {
  try {
    const historyEntry = new this({
      machine_id: machineId,
      timestamp: new Date(),
      oee: oeeMetrics.oee || 0,
      availability: oeeMetrics.availability || 0,
      performance: oeeMetrics.performance || 0,
      quality: oeeMetrics.quality || 0
    });
    
    await historyEntry.save();
    console.log(`✅ Entrada no histórico OEE criada para máquina ${machineId}`);
    return historyEntry;
  } catch (error) {
    console.error('❌ Erro ao criar entrada no histórico OEE:', error);
    throw error;
  }
};

// Método estático para buscar histórico por período
oeeHistorySchema.statics.getHistoryByPeriod = async function(machineId, startDate, endDate) {
  try {
    const query = { machine_id: machineId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const history = await this.find(query)
      .sort({ timestamp: -1 })
      .lean();
    
    console.log(`✅ ${history.length} entradas de histórico encontradas para máquina ${machineId}`);
    return history;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico OEE:', error);
    throw error;
  }
};

// Método estático para limpar histórico antigo
oeeHistorySchema.statics.cleanOldHistory = async function(daysToKeep = 90) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`✅ ${result.deletedCount} entradas antigas do histórico OEE removidas`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao limpar histórico OEE antigo:', error);
    throw error;
  }
};

const OeeHistory = mongoose.model('OeeHistory', oeeHistorySchema);

module.exports = OeeHistory;