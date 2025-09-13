import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  bio?: string;
  language: string;
  timezone: string;
  roles: ('administrador' | 'operador' | 'supervisor')[];
  permissions: string[];
  notifications: {
    email: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    dashboard_layout: string;
    default_machine?: string;
  };
  security: {
    two_factor_enabled: boolean;
    last_login?: Date;
    login_attempts: number;
    locked_until?: Date;
    password_changed_at?: Date;
  };
  status: 'active' | 'inactive' | 'suspended';
  created_at: Date;
  updated_at: Date;
  last_seen?: Date;
}

const UserSchema = new Schema<IUserDocument>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  full_name: {
    type: String,
    trim: true
  },
  avatar_url: {
    type: String
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  language: {
    type: String,
    default: 'pt-BR',
    enum: ['pt-BR', 'en-US', 'es-ES']
  },
  timezone: {
    type: String,
    default: 'America/Sao_Paulo'
  },
  roles: {
    type: [String],
    enum: ['administrador', 'operador', 'supervisor'],
    default: ['operador'],
    index: true
  },
  permissions: {
    type: [String],
    default: []
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      type: Boolean,
      default: false
    }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    dashboard_layout: {
      type: String,
      default: 'default'
    },
    default_machine: {
      type: String
    }
  },
  security: {
    two_factor_enabled: {
      type: Boolean,
      default: false
    },
    last_login: {
      type: Date
    },
    login_attempts: {
      type: Number,
      default: 0
    },
    locked_until: {
      type: Date
    },
    password_changed_at: {
      type: Date
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_seen: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Índices compostos para otimização
UserSchema.index({ email: 1, status: 1 });
UserSchema.index({ roles: 1, status: 1 });
UserSchema.index({ department: 1, status: 1 });
UserSchema.index({ created_at: -1 });
UserSchema.index({ last_seen: -1 });

// Middleware para atualizar updated_at
UserSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Middleware para hash de senha (será implementado no service)
UserSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.security.password_changed_at = new Date();
  }
  next();
});

// Método para verificar se o usuário tem uma permissão específica
UserSchema.methods.hasPermission = function(permission: string): boolean {
  return this.permissions.includes(permission) || 
         this.roles.includes('administrador');
};

// Método para verificar se o usuário tem um papel específico
UserSchema.methods.hasRole = function(role: string): boolean {
  return this.roles.includes(role);
};

// Método para atualizar último acesso
UserSchema.methods.updateLastSeen = function() {
  this.last_seen = new Date();
  this.security.last_login = new Date();
  return this.save();
};

// Método para incrementar tentativas de login
UserSchema.methods.incrementLoginAttempts = function() {
  this.security.login_attempts += 1;
  
  // Bloquear após 5 tentativas por 15 minutos
  if (this.security.login_attempts >= 5) {
    this.security.locked_until = new Date(Date.now() + 15 * 60 * 1000);
  }
  
  return this.save();
};

// Método para resetar tentativas de login
UserSchema.methods.resetLoginAttempts = function() {
  this.security.login_attempts = 0;
  this.security.locked_until = undefined;
  return this.save();
};

// Método para verificar se a conta está bloqueada
UserSchema.methods.isLocked = function(): boolean {
  return !!(this.security.locked_until && this.security.locked_until > new Date());
};

// Método para obter perfil público (sem dados sensíveis)
UserSchema.methods.getPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.security.login_attempts;
  delete obj.security.locked_until;
  return obj;
};

// Método estático para buscar usuários ativos
UserSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

// Método estático para buscar por papel
UserSchema.statics.findByRole = function(role: string) {
  return this.find({ roles: role, status: 'active' });
};

export const User = mongoose.models.User || 
  mongoose.model<IUserDocument>('User', UserSchema);

export default User;