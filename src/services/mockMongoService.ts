// Serviço mock para desenvolvimento - simula MongoDB no frontend
// Em produção, isso seria substituído por chamadas para uma API backend

import { v4 as uuidv4 } from 'uuid';
import { MachineStatus, AppRole } from '@/models';

// Tipos de interface
export interface OeeMetrics {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export interface ProductionRecordData {
  machineId: string;
  startTime: string;
  endTime: string;
  goodProduction: number;
  filmWaste: number;
  organicWaste: number;
  plannedTime: number;
  downtimeMinutes: number;
  downtimeReason?: string;
}

// Simulação de dados em localStorage
class MockMongoService {
  private jwtSecret = 'sistema-oee-secret-key';

  // Conectar ao banco (mock)
  async connect() {
    // Simular delay de conexão
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // ===== FUNÇÕES DE MÁQUINAS =====
  async getMachines() {
    const machines = JSON.parse(localStorage.getItem('machines') || '[]');
    return machines;
  }

  async getMachineById(id: string) {
    const machines = await this.getMachines();
    return machines.find((m: any) => m._id === id);
  }

  async createMachine(machineData: any) {
    const machines = await this.getMachines();
    const newMachine = {
      ...machineData,
      _id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    machines.push(newMachine);
    localStorage.setItem('machines', JSON.stringify(machines));
    return newMachine;
  }

  async updateMachine(id: string, updates: any) {
    const machines = await this.getMachines();
    const index = machines.findIndex((m: any) => m._id === id);
    if (index !== -1) {
      machines[index] = {
        ...machines[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('machines', JSON.stringify(machines));
      return machines[index];
    }
    throw new Error('Máquina não encontrada');
  }

  async deleteMachine(id: string) {
    const machines = await this.getMachines();
    const filteredMachines = machines.filter((m: any) => m._id !== id);
    localStorage.setItem('machines', JSON.stringify(filteredMachines));
    
    // Deletar registros relacionados
    const productionRecords = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    const filteredRecords = productionRecords.filter((r: any) => r.machine_id !== id);
    localStorage.setItem('productionRecords', JSON.stringify(filteredRecords));
    
    return true;
  }

  // ===== FUNÇÕES DE CÁLCULO OEE =====
  calculateOeeMetrics(
    goodProduction: number,
    plannedTime: number,
    downtimeMinutes: number,
    targetProduction: number
  ): OeeMetrics {
    // Calcular disponibilidade (Availability)
    const actualRuntime = plannedTime - downtimeMinutes;
    const availability = plannedTime > 0 ? (actualRuntime / plannedTime) * 100 : 0;
    
    // Assumir qualidade de 100% por padrão
    const quality = 100.0;
    
    // Calcular desempenho (Performance) baseado na produção boa vs target
    let performance = 0;
    if (targetProduction > 0 && actualRuntime > 0) {
      const expectedProduction = (targetProduction * actualRuntime) / plannedTime;
      performance = Math.min((goodProduction / expectedProduction) * 100, 100);
    }
    
    // Calcular OEE (Overall Equipment Effectiveness)
    const oee = (availability * performance * quality) / 10000;
    
    return {
      oee: Math.max(0, Math.min(100, oee)),
      availability: Math.max(0, Math.min(100, availability)),
      performance: Math.max(0, Math.min(100, performance)),
      quality
    };
  }

  // ===== FUNÇÕES DE REGISTROS DE PRODUÇÃO =====
  async upsertProductionRecord(data: ProductionRecordData) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    
    // Buscar registro existente
    const existingIndex = records.findIndex((r: any) => r.machine_id === data.machineId);
    
    const record = {
      _id: existingIndex >= 0 ? records[existingIndex]._id : uuidv4(),
      machine_id: data.machineId,
      start_time: data.startTime,
      end_time: data.endTime,
      good_production: data.goodProduction,
      film_waste: data.filmWaste,
      organic_waste: data.organicWaste,
      planned_time: data.plannedTime,
      downtime_minutes: data.downtimeMinutes,
      downtime_reason: data.downtimeReason,
      created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    localStorage.setItem('productionRecords', JSON.stringify(records));
    
    // Atualizar máquina com métricas OEE
    const machine = await this.getMachineById(data.machineId);
    if (machine) {
      const oeeMetrics = this.calculateOeeMetrics(
        data.goodProduction,
        data.plannedTime,
        data.downtimeMinutes,
        machine.target_production || 1
      );
      
      await this.updateMachine(data.machineId, {
        ...oeeMetrics,
        current_production: data.goodProduction
      });
    }

    return record;
  }

  async getProductionRecords(machineId?: string) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    if (machineId) {
      return records.filter((r: any) => r.machine_id === machineId);
    }
    return records;
  }

  // ===== FUNÇÕES DE HISTÓRICO OEE =====
  async getOeeHistory(machineId: string, startDate?: Date, endDate?: Date) {
    // Simular dados de histórico
    const history = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      history.push({
        _id: uuidv4(),
        machine_id: machineId,
        timestamp: date.toISOString(),
        oee: Math.random() * 40 + 60, // 60-100%
        availability: Math.random() * 20 + 80, // 80-100%
        performance: Math.random() * 30 + 70, // 70-100%
        quality: Math.random() * 10 + 90, // 90-100%
        created_at: date.toISOString()
      });
    }
    
    return history;
  }

  // ===== FUNÇÕES DE EVENTOS DE PARADA =====
  async createDowntimeEvent(eventData: any) {
    const events = JSON.parse(localStorage.getItem('downtimeEvents') || '[]');
    const newEvent = {
      ...eventData,
      _id: uuidv4(),
      created_at: new Date().toISOString()
    };
    events.push(newEvent);
    localStorage.setItem('downtimeEvents', JSON.stringify(events));
    return newEvent;
  }

  async getDowntimeEvents(machineId?: string) {
    const events = JSON.parse(localStorage.getItem('downtimeEvents') || '[]');
    if (machineId) {
      return events.filter((e: any) => e.machine_id === machineId);
    }
    return events;
  }

  // ===== FUNÇÕES DE MOTIVOS DE PARADA =====
  async getDowntimeReasons() {
    const reasons = JSON.parse(localStorage.getItem('downtimeReasons') || JSON.stringify([
      { _id: '1', name: 'Troca de Material', category: 'setup', description: 'Tempo para troca de material de produção', active: true },
      { _id: '2', name: 'Limpeza de Máquina', category: 'maintenance', description: 'Limpeza programada da máquina', active: true },
      { _id: '3', name: 'Manutenção Preventiva', category: 'maintenance', description: 'Manutenção preventiva programada', active: true },
      { _id: '4', name: 'Manutenção Corretiva', category: 'maintenance', description: 'Reparo de equipamento quebrado', active: true },
      { _id: '5', name: 'Falta de Material', category: 'material', description: 'Ausência de matéria-prima', active: true },
      { _id: '6', name: 'Falta de Energia', category: 'utilities', description: 'Interrupção no fornecimento de energia', active: true },
      { _id: '7', name: 'Problema de Qualidade', category: 'quality', description: 'Parada por problema de qualidade do produto', active: true },
      { _id: '8', name: 'Ajuste de Processo', category: 'process', description: 'Ajustes no processo de produção', active: true },
      { _id: '9', name: 'Treinamento', category: 'human', description: 'Treinamento de operadores', active: true },
      { _id: '10', name: 'Intervalo/Refeição', category: 'break', description: 'Parada para intervalo ou refeição', active: true },
      { _id: '11', name: 'Reunião', category: 'administrative', description: 'Parada para reunião', active: true },
      { _id: '12', name: 'Outros', category: 'general', description: 'Outros motivos não especificados', active: true }
    ]));
    return reasons.filter((r: any) => r.active);
  }

  async createDowntimeReason(reasonData: any) {
    const reasons = JSON.parse(localStorage.getItem('downtimeReasons') || '[]');
    const newReason = {
      ...reasonData,
      _id: uuidv4(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    reasons.push(newReason);
    localStorage.setItem('downtimeReasons', JSON.stringify(reasons));
    return newReason;
  }

  // ===== FUNÇÕES DE ALERTAS =====
  async createAlert(alertData: any) {
    const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
    const newAlert = {
      ...alertData,
      _id: uuidv4(),
      created_at: new Date().toISOString()
    };
    alerts.push(newAlert);
    localStorage.setItem('alerts', JSON.stringify(alerts));
    return newAlert;
  }

  async getAlerts(machineId?: string) {
    const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
    if (machineId) {
      return alerts.filter((a: any) => a.machine_id === machineId);
    }
    return alerts;
  }

  async acknowledgeAlert(alertId: string) {
    const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
    const index = alerts.findIndex((a: any) => a._id === alertId);
    if (index !== -1) {
      alerts[index].acknowledged = true;
      alerts[index].acknowledged_at = new Date().toISOString();
      localStorage.setItem('alerts', JSON.stringify(alerts));
      return alerts[index];
    }
    throw new Error('Alerta não encontrado');
  }

  // ===== FUNÇÕES DE AUTENTICAÇÃO =====
  async createUser(email: string, password: string, fullName?: string) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Verificar se usuário já existe
    const existingUser = users.find((u: any) => u.email === email);
    if (existingUser) {
      throw new Error('Usuário já existe');
    }

    // Criar usuário (sem hash real da senha para simplificar)
    const user = {
      _id: uuidv4(),
      email,
      password, // Em produção, seria hasheada
      full_name: fullName || email,
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));

    // Criar role padrão de operador
    const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    roles.push({
      _id: uuidv4(),
      user_id: user._id,
      role: AppRole.OPERADOR,
      created_at: new Date().toISOString()
    });
    localStorage.setItem('userRoles', JSON.stringify(roles));

    return user;
  }

  async authenticateUser(email: string, password: string) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Buscar usuário
    const user = users.find((u: any) => u.email === email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha (simplificado)
    if (user.password !== password) {
      throw new Error('Credenciais inválidas');
    }

    // Buscar roles do usuário
    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const roles = userRoles
      .filter((ur: any) => ur.user_id === user._id)
      .map((ur: any) => ur.role);

    // Gerar token simples (em produção seria JWT)
    const token = btoa(JSON.stringify({ userId: user._id, email: user.email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }));

    // Atualizar último login
    user.last_sign_in = new Date().toISOString();
    const userIndex = users.findIndex((u: any) => u._id === user._id);
    users[userIndex] = user;
    localStorage.setItem('users', JSON.stringify(users));

    return {
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        roles
      },
      token
    };
  }

  async verifyToken(token: string) {
    try {
      const decoded = JSON.parse(atob(token));
      
      // Verificar expiração
      if (Date.now() > decoded.exp) {
        throw new Error('Token expirado');
      }
      
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u._id === decoded.userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      const roles = userRoles
        .filter((ur: any) => ur.user_id === user._id)
        .map((ur: any) => ur.role);

      return {
        user: {
          id: user._id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          roles
        }
      };
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // ===== FUNÇÕES DE USUÁRIO =====
  async getUserProfile(userId: string) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u._id === userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const userRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
    const roles = userRoles
      .filter((ur: any) => ur.user_id === userId)
      .map((ur: any) => ur.role);

    return {
      ...user,
      roles
    };
  }

  async updateUserProfile(userId: string, updates: any) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: any) => u._id === userId);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem('users', JSON.stringify(users));
      return users[index];
    }
    throw new Error('Usuário não encontrado');
  }

  // ===== FUNÇÕES DE INICIALIZAÇÃO =====
  async initializeDefaultData() {
    // Criar usuário administrador padrão se não existir
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.some((u: any) => u.email === 'admin@sistema-oee.com');
    
    if (!adminExists) {
      const adminUser = {
        _id: 'admin-user-id',
        email: 'admin@sistema-oee.com',
        password: 'admin123',
        full_name: 'Administrador do Sistema',
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Criar role de administrador
      const roles = JSON.parse(localStorage.getItem('userRoles') || '[]');
      roles.push({
        _id: uuidv4(),
        user_id: 'admin-user-id',
        role: AppRole.ADMINISTRADOR,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('userRoles', JSON.stringify(roles));
    }
    
    // Criar máquinas de exemplo se não existirem
    const machines = JSON.parse(localStorage.getItem('machines') || '[]');
    if (machines.length === 0) {
      const sampleMachines = [
        {
          _id: 'machine-1',
          name: 'Extrusora Alpha',
          code: 'EXT-001',
          status: MachineStatus.ATIVA,
          oee: 78.5,
          availability: 92.3,
          performance: 85.1,
          quality: 99.8,
          current_production: 12500,
          target_production: 15000,
          capacity: 2500,
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'machine-2',
          name: 'Impressora Beta',
          code: 'IMP-002',
          status: MachineStatus.ATIVA,
          oee: 62.4,
          availability: 78.2,
          performance: 89.7,
          quality: 89.1,
          current_production: 8900,
          target_production: 12000,
          capacity: 2000,
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'machine-3',
          name: 'Soldadora Gamma',
          code: 'SOL-003',
          status: MachineStatus.MANUTENCAO,
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 0,
          current_production: 0,
          target_production: 8000,
          capacity: 1600,
          permissions: ['view', 'operate', 'maintain'],
          access_level: AppRole.SUPERVISOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'machine-4',
          name: 'Cortadora Delta',
          code: 'COR-004',
          status: MachineStatus.ATIVA,
          oee: 88.7,
          availability: 95.2,
          performance: 93.1,
          quality: 100,
          current_production: 18200,
          target_production: 20000,
          capacity: 4000,
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'machine-5',
          name: 'Embaladera Epsilon',
          code: 'EMB-005',
          status: MachineStatus.PARADA,
          oee: 45.2,
          availability: 65.8,
          performance: 78.3,
          quality: 87.8,
          current_production: 3200,
          target_production: 10000,
          capacity: 2500,
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('machines', JSON.stringify(sampleMachines));
    }
    
    console.log('✅ Dados padrão inicializados no localStorage');
  }
}

export const mockMongoService = new MockMongoService();
export default mockMongoService;