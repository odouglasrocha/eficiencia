// Mock data para demonstração do sistema OEE

export interface Machine {
  id: string;
  name: string;
  code: string;
  status: "ativa" | "manutencao" | "parada" | "inativa";
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  currentProduction: number;
  targetProduction: number;
  capacity: number; // UND/h
}

export interface OeeHistoryPoint {
  time: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface ProductionRecord {
  id: string;
  machineId: string;
  startTime: string;
  endTime?: string;
  goodProduction: number; // UND
  filmWaste: number; // UND
  organicWaste: number; // KG
  plannedTime: number; // minutes
  downtimeMinutes: number;
  downtimeReason?: string;
}

// Máquinas mockadas
export const mockMachines: Machine[] = [
  {
    id: "M001",
    name: "Extrusora Alpha",
    code: "EXT-001",
    status: "ativa",
    oee: 78.5,
    availability: 92.3,
    performance: 85.1,
    quality: 99.8,
    currentProduction: 12500,
    targetProduction: 15000,
    capacity: 2500
  },
  {
    id: "M002", 
    name: "Impressora Beta",
    code: "IMP-002",
    status: "ativa",
    oee: 62.4,
    availability: 78.2,
    performance: 89.7,
    quality: 89.1,
    currentProduction: 8900,
    targetProduction: 12000,
    capacity: 2000
  },
  {
    id: "M003",
    name: "Soldadora Gamma",
    code: "SOL-003", 
    status: "manutencao",
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 0,
    currentProduction: 0,
    targetProduction: 8000,
    capacity: 1600
  },
  {
    id: "M004",
    name: "Cortadora Delta",
    code: "COR-004",
    status: "ativa",
    oee: 88.7,
    availability: 95.2,
    performance: 93.1,
    quality: 100,
    currentProduction: 18200,
    targetProduction: 20000,
    capacity: 4000
  },
  {
    id: "M005",
    name: "Embaladera Epsilon",
    code: "EMB-005",
    status: "parada",
    oee: 45.2,
    availability: 65.8,
    performance: 78.3,
    quality: 87.8,
    currentProduction: 3200,
    targetProduction: 10000,
    capacity: 2500
  }
];

// Histórico OEE (últimas 24 horas)
export const mockOeeHistory: OeeHistoryPoint[] = [
  { time: "00:00", oee: 82.1, availability: 95.2, performance: 88.5, quality: 97.4 },
  { time: "01:00", oee: 78.9, availability: 92.1, performance: 89.2, quality: 96.1 },
  { time: "02:00", oee: 75.4, availability: 88.7, performance: 87.8, quality: 96.8 },
  { time: "03:00", oee: 73.2, availability: 85.4, performance: 89.1, quality: 96.2 },
  { time: "04:00", oee: 71.8, availability: 82.9, performance: 90.3, quality: 95.8 },
  { time: "05:00", oee: 69.5, availability: 78.2, performance: 91.2, quality: 97.5 },
  { time: "06:00", oee: 72.1, availability: 81.5, performance: 92.4, quality: 95.8 },
  { time: "07:00", oee: 76.8, availability: 88.9, performance: 89.7, quality: 96.4 },
  { time: "08:00", oee: 81.3, availability: 94.2, performance: 87.8, quality: 98.1 },
  { time: "09:00", oee: 84.7, availability: 96.8, performance: 89.1, quality: 98.2 },
  { time: "10:00", oee: 79.2, availability: 91.4, performance: 88.5, quality: 97.9 },
  { time: "11:00", oee: 77.6, availability: 89.7, performance: 90.2, quality: 95.9 },
  { time: "12:00", oee: 74.3, availability: 85.1, performance: 91.8, quality: 95.2 },
  { time: "13:00", oee: 76.9, availability: 88.4, performance: 89.5, quality: 97.1 },
  { time: "14:00", oee: 80.1, availability: 92.7, performance: 88.9, quality: 97.2 },
  { time: "15:00", oee: 83.4, availability: 95.1, performance: 89.7, quality: 97.8 },
  { time: "16:00", oee: 81.8, availability: 93.6, performance: 90.1, quality: 97.0 },
  { time: "17:00", oee: 78.5, availability: 90.2, performance: 89.4, quality: 97.4 },
  { time: "18:00", oee: 75.9, availability: 87.1, performance: 90.8, quality: 96.0 },
  { time: "19:00", oee: 73.2, availability: 84.5, performance: 91.2, quality: 95.1 },
  { time: "20:00", oee: 70.8, availability: 81.2, performance: 90.5, quality: 96.3 },
  { time: "21:00", oee: 68.4, availability: 78.9, performance: 89.7, quality: 96.7 },
  { time: "22:00", oee: 65.1, availability: 75.4, performance: 88.2, quality: 97.9 },
  { time: "23:00", oee: 67.8, availability: 79.1, performance: 89.5, quality: 95.8 }
];

// Ranking de máquinas por OEE
export const mockMachineRanking = [
  { machine: "COR-004", oee: 88.7, availability: 95.2, performance: 93.1, quality: 100 },
  { machine: "EXT-001", oee: 78.5, availability: 92.3, performance: 85.1, quality: 99.8 },
  { machine: "IMP-002", oee: 62.4, availability: 78.2, performance: 89.7, quality: 89.1 },
  { machine: "EMB-005", oee: 45.2, availability: 65.8, performance: 78.3, quality: 87.8 },
  { machine: "SOL-003", oee: 0, availability: 0, performance: 0, quality: 0 }
];

// Dados de Pareto de paradas
export const mockDowntimePareto = [
  { name: "Setup/Troca", value: 35, minutes: 420 },
  { name: "Falta de Material", value: 25, minutes: 300 },
  { name: "Quebra Mecânica", value: 20, minutes: 240 },
  { name: "Falta Operador", value: 12, minutes: 144 },
  { name: "Limpeza", value: 8, minutes: 96 }
];

// Perdas por categoria
export const mockLosses = [
  { category: "Refugo Filme", value: 450, unit: "UND", cost: 1350 },
  { category: "Refugo Orgânico", value: 23.5, unit: "KG", cost: 2820 },
  { category: "Tempo Parado", value: 1200, unit: "MIN", cost: 4800 },
  { category: "Baixa Performance", value: 15.2, unit: "%", cost: 3040 }
];

// Métricas gerais do sistema
export interface SystemMetrics {
  totalMachines: number;
  activeMachines: number;
  averageOee: number;
  totalProduction: number;
  totalTarget: number;
  alertsCount: number;
  criticalMachines: number;
}

export const mockSystemMetrics: SystemMetrics = {
  totalMachines: mockMachines.length,
  activeMachines: mockMachines.filter(m => m.status === "ativa").length,
  averageOee: mockMachines.reduce((sum, m) => sum + m.oee, 0) / mockMachines.length,
  totalProduction: mockMachines.reduce((sum, m) => sum + m.currentProduction, 0),
  totalTarget: mockMachines.reduce((sum, m) => sum + m.targetProduction, 0),
  alertsCount: mockMachines.filter(m => m.oee < 65 && m.status === "ativa").length,
  criticalMachines: mockMachines.filter(m => m.status === "manutencao" || m.status === "parada").length
};