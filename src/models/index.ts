// Enums equivalentes aos do Supabase (para uso no frontend)
export enum MachineStatus {
  ATIVA = 'ativa',
  MANUTENCAO = 'manutencao',
  PARADA = 'parada',
  INATIVA = 'inativa'
}

export enum AppRole {
  ADMINISTRADOR = 'administrador',
  SUPERVISOR = 'supervisor',
  OPERADOR = 'operador'
}

// Interfaces TypeScript para tipagem (substituindo os modelos Mongoose no frontend)
export interface IMachine {
  _id: string;
  name: string;
  code: string;
  status: MachineStatus;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_production: number;
  target_production: number;
  capacity: number;
  permissions: string[];
  access_level: AppRole;
  created_at: string;
  updated_at: string;
}

export interface IProductionRecord {
  _id: string;
  machine_id: string;
  start_time: string;
  end_time?: string;
  good_production: number;
  film_waste: number;
  organic_waste: number;
  planned_time: number;
  downtime_minutes: number;
  downtime_reason?: string;
  created_at: string;
}

export interface IUser {
  _id: string;
  email: string;
  password: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  position?: string;
  location?: string;
  timezone?: string;
  language?: string;
  bio?: string;
  notifications?: any;
  email_verified: boolean;
  last_sign_in?: string;
  created_at: string;
  updated_at: string;
}

export interface IUserRole {
  _id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface IDowntimeReason {
  _id: string;
  name: string;
  category: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IDowntimeEvent {
  _id: string;
  machine_id: string;
  start_time: string;
  end_time?: string;
  reason: string;
  category?: string;
  minutes: number;
  downtime_reason_id?: string;
  created_at: string;
}

export interface IAlert {
  _id: string;
  machine_id?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
  acknowledged_at?: string;
  created_at: string;
}

export interface IOeeHistory {
  _id: string;
  machine_id: string;
  timestamp: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  created_at: string;
}

// Nota: Os schemas Mongoose reais estarão no backend.
// Este arquivo contém apenas os enums e interfaces para o frontend.