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
  recordId?: string; // Para operações de update
  machineId: string;
  startTime: string;
  endTime: string;
  goodProduction: number;
  filmWaste: number;
  organicWaste: number;
  plannedTime: number;
  downtimeMinutes: number;
  downtimeReason?: string;
  materialCode?: string; // Código do material produzido
  shift?: string; // Turno de produção
  operatorId?: string; // ID do operador responsável
  notes?: string; // Observações adicionais
  batchNumber?: string; // Número do lote
  qualityCheck?: boolean; // Se passou na verificação de qualidade
  temperature?: number; // Temperatura durante produção
  pressure?: number; // Pressão durante produção
  speed?: number; // Velocidade da máquina
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

  // ===== FUNÇÕES DE REGISTROS DE PRODUÇÃO - SISTEMA COMPLETO =====
  
  // Criar novo registro de produção
  async createProductionRecord(data: ProductionRecordData) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    
    const record = {
      _id: uuidv4(),
      machine_id: data.machineId,
      start_time: data.startTime,
      end_time: data.endTime,
      good_production: data.goodProduction,
      film_waste: data.filmWaste,
      organic_waste: data.organicWaste,
      planned_time: data.plannedTime,
      downtime_minutes: data.downtimeMinutes,
      downtime_reason: data.downtimeReason,
      material_code: data.materialCode || null,
      shift: data.shift || null,
      operator_id: data.operatorId || null,
      notes: data.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    records.push(record);
    localStorage.setItem('productionRecords', JSON.stringify(records));
    
    // Calcular métricas OEE para este registro
    const oeeMetrics = this.calculateOeeMetrics(
      data.goodProduction,
      data.plannedTime,
      data.downtimeMinutes,
      1000 // target padrão, será recalculado na updateMachineMetrics
    );
    
    // Criar entrada no histórico OEE
    await this.createOeeHistoryEntry(data.machineId, data, oeeMetrics);
    
    // Atualizar métricas da máquina
    await this.updateMachineMetrics(data.machineId);
    
    // Disparar evento para atualização automática da interface
    this.triggerMachineDataUpdate(data.machineId);
    
    return record;
  }

  // Método para disparar atualização automática da interface
  private triggerMachineDataUpdate(machineId: string) {
    // Disparar evento customizado para atualizar a interface imediatamente
    const event = new CustomEvent('machineDataUpdated', {
      detail: { machineId }
    });
    window.dispatchEvent(event);
  }

  // Atualizar registro de produção existente
  async updateProductionRecord(recordId: string, updates: Partial<ProductionRecordData>) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    const index = records.findIndex((r: any) => r._id === recordId);
    
    if (index === -1) {
      throw new Error('Registro de produção não encontrado');
    }
    
    const updatedRecord = {
      ...records[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    records[index] = updatedRecord;
    localStorage.setItem('productionRecords', JSON.stringify(records));
    
    // Atualizar métricas da máquina
    await this.updateMachineMetrics(updatedRecord.machine_id);
    
    return updatedRecord;
  }

  // Buscar registros de produção com filtros avançados
  async getProductionRecords(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
    shift?: string;
    operatorId?: string;
    limit?: number;
    offset?: number;
  }) {
    let records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    
    // Aplicar filtros
    if (filters) {
      if (filters.machineId) {
        records = records.filter((r: any) => r.machine_id === filters.machineId);
      }
      
      if (filters.startDate) {
        records = records.filter((r: any) => 
          new Date(r.start_time) >= new Date(filters.startDate!)
        );
      }
      
      if (filters.endDate) {
        records = records.filter((r: any) => 
          new Date(r.start_time) <= new Date(filters.endDate!)
        );
      }
      
      if (filters.shift) {
        records = records.filter((r: any) => r.shift === filters.shift);
      }
      
      if (filters.operatorId) {
        records = records.filter((r: any) => r.operator_id === filters.operatorId);
      }
    }
    
    // Ordenar por data de criação (mais recente primeiro)
    records.sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    // Aplicar paginação
    if (filters?.limit || filters?.offset) {
      const offset = filters.offset || 0;
      const limit = filters.limit || 50;
      records = records.slice(offset, offset + limit);
    }
    
    return records;
  }

  // Buscar registro específico por ID
  async getProductionRecordById(recordId: string) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    return records.find((r: any) => r._id === recordId);
  }

  // Excluir registro de produção
  async deleteProductionRecord(recordId: string) {
    const records = JSON.parse(localStorage.getItem('productionRecords') || '[]');
    const record = records.find((r: any) => r._id === recordId);
    
    if (!record) {
      throw new Error('Registro de produção não encontrado');
    }
    
    const filteredRecords = records.filter((r: any) => r._id !== recordId);
    localStorage.setItem('productionRecords', JSON.stringify(filteredRecords));
    
    // Atualizar métricas da máquina
    await this.updateMachineMetrics(record.machine_id);
    
    return true;
  }

  // Função para manter compatibilidade (upsert)
  async upsertProductionRecord(data: ProductionRecordData) {
    // Se tem ID, atualiza; senão, cria novo
    if (data.recordId) {
      return await this.updateProductionRecord(data.recordId, data);
    } else {
      return await this.createProductionRecord(data);
    }
  }

  // Atualizar métricas da máquina baseado nos registros de produção
  private async updateMachineMetrics(machineId: string) {
    const machine = await this.getMachineById(machineId);
    if (!machine) return;
    
    // Buscar registros recentes da máquina (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentRecords = await this.getProductionRecords({
      machineId,
      startDate: yesterday.toISOString()
    });
    
    let totalGoodProduction = 0;
    let totalPlannedTime = 0;
    let totalDowntime = 0;
    
    if (recentRecords.length > 0) {
      // Calcular métricas agregadas dos registros
      totalGoodProduction = recentRecords.reduce((sum: number, r: any) => sum + r.good_production, 0);
      totalPlannedTime = recentRecords.reduce((sum: number, r: any) => sum + r.planned_time, 0);
      totalDowntime = recentRecords.reduce((sum: number, r: any) => sum + r.downtime_minutes, 0);
    } else {
      // Se não há registros, usar valores padrão baseados na capacidade da máquina
      totalGoodProduction = machine.current_production || Math.floor((machine.target_production || 1000) * 0.85);
      totalPlannedTime = 480; // 8 horas padrão
      totalDowntime = 30; // 30 minutos padrão
    }
    
    const oeeMetrics = this.calculateOeeMetrics(
      totalGoodProduction,
      totalPlannedTime,
      totalDowntime,
      machine.target_production || 1000
    );
    
    await this.updateMachine(machineId, {
      ...oeeMetrics,
      current_production: totalGoodProduction,
      last_production_update: new Date().toISOString()
    });
  }

  // Buscar estatísticas de produção
  async getProductionStatistics(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const records = await this.getProductionRecords(filters);
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalProduction: 0,
        totalWaste: 0,
        totalDowntime: 0,
        averageOEE: 0,
        averageAvailability: 0,
        averagePerformance: 0,
        averageQuality: 0
      };
    }
    
    const totalProduction = records.reduce((sum: number, r: any) => sum + r.good_production, 0);
    const totalFilmWaste = records.reduce((sum: number, r: any) => sum + r.film_waste, 0);
    const totalOrganicWaste = records.reduce((sum: number, r: any) => sum + r.organic_waste, 0);
    const totalDowntime = records.reduce((sum: number, r: any) => sum + r.downtime_minutes, 0);
    const totalPlannedTime = records.reduce((sum: number, r: any) => sum + r.planned_time, 0);
    
    // Calcular métricas médias
    const metrics = records.map((r: any) => {
      const machine = JSON.parse(localStorage.getItem('machines') || '[]')
        .find((m: any) => m._id === r.machine_id);
      const targetProduction = machine?.target_production || 1;
      
      return this.calculateOeeMetrics(
        r.good_production,
        r.planned_time,
        r.downtime_minutes,
        targetProduction
      );
    });
    
    const averageOEE = metrics.reduce((sum, m) => sum + m.oee, 0) / metrics.length;
    const averageAvailability = metrics.reduce((sum, m) => sum + m.availability, 0) / metrics.length;
    const averagePerformance = metrics.reduce((sum, m) => sum + m.performance, 0) / metrics.length;
    const averageQuality = metrics.reduce((sum, m) => sum + m.quality, 0) / metrics.length;
    
    return {
      totalRecords: records.length,
      totalProduction,
      totalWaste: totalFilmWaste + totalOrganicWaste,
      totalDowntime,
      totalPlannedTime,
      averageOEE: Math.round(averageOEE * 100) / 100,
      averageAvailability: Math.round(averageAvailability * 100) / 100,
      averagePerformance: Math.round(averagePerformance * 100) / 100,
      averageQuality: Math.round(averageQuality * 100) / 100
    };
  }

  // ===== FUNÇÕES DE HISTÓRICO OEE =====
  async getOeeHistory(machineId: string, startDate?: Date, endDate?: Date) {
    const oeeHistory = JSON.parse(localStorage.getItem('oeeHistory') || '[]');
    
    let filteredHistory = oeeHistory.filter((entry: any) => entry.machine_id === machineId);
    
    // Filtrar por data se fornecida
    if (startDate || endDate) {
      filteredHistory = filteredHistory.filter((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        if (startDate && entryDate < startDate) return false;
        if (endDate && entryDate > endDate) return false;
        return true;
      });
    }
    
    // Se não há dados, criar entrada para hoje com dados da máquina
    if (filteredHistory.length === 0) {
      const machine = await this.getMachineById(machineId);
      if (machine) {
        const todayEntry = {
          _id: uuidv4(),
          machine_id: machineId,
          timestamp: new Date().toISOString(),
          oee: machine.oee || 0,
          availability: machine.availability || 0,
          performance: machine.performance || 0,
          quality: machine.quality || 100,
          good_production: machine.current_production || 0,
          total_waste: 0,
          downtime_minutes: 0,
          planned_time: 480, // 8 horas padrão
          created_at: new Date().toISOString()
        };
        
        // Salvar no localStorage
        oeeHistory.push(todayEntry);
        localStorage.setItem('oeeHistory', JSON.stringify(oeeHistory));
        
        return [todayEntry];
      }
    }
    
    return filteredHistory.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
  
  // Criar entrada no histórico OEE
  async createOeeHistoryEntry(machineId: string, productionData: any, oeeMetrics: OeeMetrics) {
    const oeeHistory = JSON.parse(localStorage.getItem('oeeHistory') || '[]');
    
    const historyEntry = {
      _id: uuidv4(),
      machine_id: machineId,
      production_record_id: productionData.recordId || uuidv4(),
      timestamp: new Date().toISOString(),
      oee: oeeMetrics.oee,
      availability: oeeMetrics.availability,
      performance: oeeMetrics.performance,
      quality: oeeMetrics.quality,
      good_production: productionData.goodProduction || 0,
      total_waste: (productionData.filmWaste || 0) + (productionData.organicWaste || 0),
      downtime_minutes: productionData.downtimeMinutes || 0,
      planned_time: productionData.plannedTime || 0,
      shift: productionData.shift,
      operator_id: productionData.operatorId,
      created_at: new Date().toISOString()
    };
    
    oeeHistory.push(historyEntry);
    localStorage.setItem('oeeHistory', JSON.stringify(oeeHistory));
    
    console.log(`✅ Entrada no histórico OEE criada para máquina ${machineId}`);
    return historyEntry;
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
    console.log('🔄 Inicializando dados padrão...');
    
    // Limpar dados antigos para garantir turnos corretos
    localStorage.removeItem('machines');
    localStorage.removeItem('productionRecords');
    console.log('🧹 Dados antigos limpos para reinicialização');
    
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
        },
        {
          _id: 'EA01',
          name: 'Extrusora EA01',
          code: 'EA01',
          status: MachineStatus.ATIVA,
          oee: 79.1,
          availability: 86.0,
          performance: 92.0,
          quality: 100.0,
          current_production: 27000,
          target_production: 31238,
          capacity: 5000,
          shift: 'Manhã', // Propriedade específica da máquina
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          _id: 'EA02',
          name: 'Extrusora EA02',
          code: 'EA02',
          status: MachineStatus.ATIVA,
          oee: 81.0,
          availability: 88.0,
          performance: 92.0,
          quality: 100.0,
          current_production: 10500,
          target_production: 27459,
          capacity: 4500,
          shift: 'Tarde', // Propriedade específica da máquina
          permissions: ['view', 'operate'],
          access_level: AppRole.OPERADOR,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      localStorage.setItem('machines', JSON.stringify(sampleMachines));
      
      // Criar registros de produção para EA01 e EA02
      const productionRecords = JSON.parse(localStorage.getItem('productionRecords') || '[]');
      if (productionRecords.length === 0) {
        const sampleRecords = [
          {
            _id: uuidv4(),
            machine_id: 'EA01', // Relacionamento: test.machines.code = test.productionrecords.machine_id
            start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            good_production: 1200,
            film_waste: 25,
            organic_waste: 15.5,
            planned_time: 120,
            downtime_minutes: 10,
            downtime_reason: 'Troca de material',
            material_code: 'MAT001',
            shift: 'Manhã', // Campo shift que deve ser exibido no Turno
            operator_id: 'op_001',
            batch_number: 'BATCH_EA01_001',
            quality_check: true,
            temperature: 185.2,
            pressure: 12.5,
            speed: 95.8,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            _id: uuidv4(),
            machine_id: 'EA02', // Relacionamento: test.machines.code = test.productionrecords.machine_id
            start_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            good_production: 800,
            film_waste: 20,
            organic_waste: 12.3,
            planned_time: 120,
            downtime_minutes: 15,
            downtime_reason: 'Manutenção preventiva',
            material_code: 'MAT002',
            shift: 'Tarde', // Campo shift que deve ser exibido no Turno
            operator_id: 'op_002',
            batch_number: 'BATCH_EA02_001',
            quality_check: true,
            temperature: 190.1,
            pressure: 11.8,
            speed: 88.5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        localStorage.setItem('productionRecords', JSON.stringify(sampleRecords));
      }
    }
    
    console.log('✅ Dados padrão inicializados no localStorage');
  }
}

export const mockMongoService = new MockMongoService();
export default mockMongoService;