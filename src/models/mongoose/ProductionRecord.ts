import mongoose, { Schema, Document } from 'mongoose';

export interface IProductionRecordDocument extends Document {
  machine_id: string;
  start_time: Date;
  end_time?: Date;
  good_production: number;
  film_waste: number;
  organic_waste: number;
  planned_time: number;
  downtime_minutes: number;
  downtime_reason?: string;
  material_code?: string;
  shift?: string;
  operator_id?: string;
  notes?: string;
  batch_number?: string;
  quality_check?: boolean;
  temperature?: number;
  pressure?: number;
  speed?: number;
  oee_calculated?: number;
  availability_calculated?: number;
  performance_calculated?: number;
  quality_calculated?: number;
  created_at: Date;
  updated_at: Date;
}

const ProductionRecordSchema = new Schema<IProductionRecordDocument>({
  machine_id: {
    type: String,
    required: true,
    index: true
  },
  start_time: {
    type: Date,
    required: true,
    index: true
  },
  end_time: {
    type: Date
  },
  good_production: {
    type: Number,
    required: true,
    min: 0
  },
  film_waste: {
    type: Number,
    required: true,
    min: 0
  },
  organic_waste: {
    type: Number,
    required: true,
    min: 0
  },
  planned_time: {
    type: Number,
    required: true,
    min: 0
  },
  downtime_minutes: {
    type: Number,
    required: true,
    min: 0
  },
  downtime_reason: {
    type: String
  },
  material_code: {
    type: String,
    index: true
  },
  shift: {
    type: String,
    enum: ['A', 'B', 'C'],
    index: true
  },
  operator_id: {
    type: String,
    index: true
  },
  notes: {
    type: String
  },
  batch_number: {
    type: String,
    index: true
  },
  quality_check: {
    type: Boolean,
    default: true
  },
  temperature: {
    type: Number
  },
  pressure: {
    type: Number
  },
  speed: {
    type: Number
  },
  oee_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  availability_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  performance_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  quality_calculated: {
    type: Number,
    min: 0,
    max: 100
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices compostos para otimização
ProductionRecordSchema.index({ machine_id: 1, start_time: -1 });
ProductionRecordSchema.index({ shift: 1, start_time: -1 });
ProductionRecordSchema.index({ operator_id: 1, start_time: -1 });
ProductionRecordSchema.index({ material_code: 1, start_time: -1 });

// Middleware para atualizar updated_at
ProductionRecordSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Método para calcular métricas OEE
ProductionRecordSchema.methods.calculateOEE = function(targetProduction: number = 1) {
  const actualRuntime = this.planned_time - this.downtime_minutes;
  const availability = this.planned_time > 0 ? (actualRuntime / this.planned_time) * 100 : 0;
  const performance = targetProduction > 0 ? (this.good_production / targetProduction) * 100 : 0;
  const quality = 100; // Assumido como 100% por padrão
  const oee = (availability * performance * quality) / 10000;
  
  this.availability_calculated = Math.max(0, Math.min(100, availability));
  this.performance_calculated = Math.max(0, Math.min(100, performance));
  this.quality_calculated = quality;
  this.oee_calculated = Math.max(0, Math.min(100, oee));
  
  return {
    oee: this.oee_calculated,
    availability: this.availability_calculated,
    performance: this.performance_calculated,
    quality: this.quality_calculated
  };
};

export const ProductionRecord = mongoose.models.ProductionRecord || 
  mongoose.model<IProductionRecordDocument>('ProductionRecord', ProductionRecordSchema);

export default ProductionRecord;