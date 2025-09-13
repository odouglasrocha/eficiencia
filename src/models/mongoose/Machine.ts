import mongoose, { Schema, Document } from 'mongoose';

export interface IMachineDocument extends Document {
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
  access_level: 'administrador' | 'supervisor' | 'operador';
  last_production_update?: Date;
  created_at: Date;
  updated_at: Date;
}

const MachineSchema = new Schema<IMachineDocument>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['ativa', 'manutencao', 'parada', 'inativa'],
    default: 'ativa',
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
    default: 100,
    min: 0,
    max: 100
  },
  current_production: {
    type: Number,
    default: 0,
    min: 0
  },
  target_production: {
    type: Number,
    default: 1,
    min: 1
  },
  capacity: {
    type: Number,
    default: 1000,
    min: 1
  },
  permissions: {
    type: [String],
    default: []
  },
  access_level: {
    type: String,
    enum: ['administrador', 'supervisor', 'operador'],
    default: 'operador'
  },
  last_production_update: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices
MachineSchema.index({ code: 1 }, { unique: true });
MachineSchema.index({ status: 1 });
MachineSchema.index({ name: 'text', code: 'text' });

// Middleware para atualizar updated_at
MachineSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Método para atualizar métricas OEE
MachineSchema.methods.updateOEEMetrics = function(oeeData: {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_production?: number;
}) {
  this.oee = Math.max(0, Math.min(100, oeeData.oee));
  this.availability = Math.max(0, Math.min(100, oeeData.availability));
  this.performance = Math.max(0, Math.min(100, oeeData.performance));
  this.quality = Math.max(0, Math.min(100, oeeData.quality));
  
  if (oeeData.current_production !== undefined) {
    this.current_production = Math.max(0, oeeData.current_production);
  }
  
  this.last_production_update = new Date();
};

export const Machine = mongoose.models.Machine || 
  mongoose.model<IMachineDocument>('Machine', MachineSchema);

export default Machine;