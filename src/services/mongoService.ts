import connectDB from '@/lib/mongodb';
import {
  MachineStatus,
  AppRole
} from '@/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

// Nota: Este arquivo contém a implementação real do MongoDB para uso no backend.
// No frontend, estamos usando mockMongoService.ts para desenvolvimento.

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

class MongoService {
  private jwtSecret = process.env.JWT_SECRET || 'sistema-oee-secret-key';

  // Conectar ao banco
  async connect() {
    await connectDB();
  }

  // Função auxiliar para gerenciar localStorage de forma segura
  private safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } catch (e) {
        console.warn(`Erro ao ler localStorage para chave '${key}':`, e);
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (e) {
        console.warn(`Erro ao salvar no localStorage para chave '${key}':`, e);
      }
    },
    getJSON: (key: string, defaultValue: any = []): any => {
      try {
        const item = this.safeLocalStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.warn(`Erro ao parsear JSON do localStorage para chave '${key}':`, e);
        return defaultValue;
      }
    },
    setJSON: (key: string, value: any): void => {
      try {
        this.safeLocalStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.warn(`Erro ao salvar JSON no localStorage para chave '${key}':`, e);
      }
    }
  };

  // ===== FUNÇÕES DE MÁQUINAS =====
  // NOTA: Estas funções serão implementadas no backend com Mongoose real
  // No frontend, use mockMongoService.ts
  
  async getMachines() {
    await this.connect();
    
    try {
      const Machine = (await import('@/models/mongoose/Machine')).default;
      const machines = await Machine.find({}).lean();
      console.log(`✅ ${machines.length} máquinas encontradas no MongoDB`);
      return machines;
    } catch (error) {
      console.error('❌ Erro ao buscar máquinas:', error);
      throw error;
    }
  }

  async getMachineById(id: string) {
    await this.connect();
    
    try {
      const Machine = (await import('@/models/mongoose/Machine')).default;
      const machine = await Machine.findById(id).lean();
      if (!machine) {
        throw new Error('Máquina não encontrada');
      }
      return machine;
    } catch (error) {
      console.error('❌ Erro ao buscar máquina por ID:', error);
      throw error;
    }
  }

  async createMachine(machineData: any) {
    await this.connect();
    
    try {
      const Machine = (await import('@/models/mongoose/Machine')).default;
      const machine = new Machine(machineData);
      await machine.save();
      console.log('✅ Máquina criada no MongoDB:', machine._id);
      return machine.toObject();
    } catch (error) {
      console.error('❌ Erro ao criar máquina:', error);
      throw error;
    }
  }

  async updateMachine(id: string, updates: any) {
    await this.connect();
    
    try {
      const Machine = (await import('@/models/mongoose/Machine')).default;
      const machine = await Machine.findByIdAndUpdate(id, updates, { new: true });
      if (!machine) {
        throw new Error('Máquina não encontrada');
      }
      console.log('✅ Máquina atualizada no MongoDB:', id);
      return machine.toObject();
    } catch (error) {
      console.error('❌ Erro ao atualizar máquina:', error);
      throw error;
    }
  }

  async deleteMachine(id: string) {
    await this.connect();
    
    try {
      const Machine = (await import('@/models/mongoose/Machine')).default;
      const result = await Machine.findByIdAndDelete(id);
      if (!result) {
        throw new Error('Máquina não encontrada');
      }
      console.log('✅ Máquina excluída do MongoDB:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir máquina:', error);
      throw error;
    }
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

  // ===== FUNÇÕES DE REGISTROS DE PRODUÇÃO - IMPLEMENTAÇÃO MONGODB =====
  
  // Criar novo registro de produção
  async createProductionRecord(data: ProductionRecordData) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      const Machine = (await import('@/models/mongoose/Machine')).default;
      
      // Criar o registro
      const record = new ProductionRecord({
        machine_id: data.machineId,
        start_time: new Date(data.startTime),
        end_time: new Date(data.endTime),
        good_production: data.goodProduction,
        film_waste: data.filmWaste,
        organic_waste: data.organicWaste,
        planned_time: data.plannedTime,
        downtime_minutes: data.downtimeMinutes,
        downtime_reason: data.downtimeReason,
        material_code: data.materialCode,
        shift: data.shift,
        operator_id: data.operatorId,
        notes: data.notes,
        batch_number: data.batchNumber,
        quality_check: data.qualityCheck,
        temperature: data.temperature,
        pressure: data.pressure,
        speed: data.speed
      });
      
      // Calcular métricas OEE
      const machine = await Machine.findById(data.machineId);
      const targetProduction = machine?.target_production || 1;
      record.calculateOEE(targetProduction);
      
      // Salvar o registro
      await record.save();
      
      // Atualizar métricas da máquina
      if (machine) {
        machine.updateOEEMetrics({
          oee: record.oee_calculated || 0,
          availability: record.availability_calculated || 0,
          performance: record.performance_calculated || 0,
          quality: record.quality_calculated || 100,
          current_production: data.goodProduction
        });
        await machine.save();
      }
      
      console.log('✅ Registro de produção salvo no MongoDB:', record._id);
      return record.toObject();
      
    } catch (error) {
      console.error('❌ Erro ao criar registro de produção:', error);
      throw error;
    }
  }
  
  // Atualizar registro existente
  async updateProductionRecord(recordId: string, updates: Partial<ProductionRecordData>) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      const Machine = (await import('@/models/mongoose/Machine')).default;
      
      const record = await ProductionRecord.findById(recordId);
      if (!record) {
        throw new Error('Registro de produção não encontrado');
      }
      
      // Atualizar campos
      Object.assign(record, updates);
      
      // Recalcular métricas OEE se necessário
      if (updates.goodProduction || updates.plannedTime || updates.downtimeMinutes) {
        const machine = await Machine.findById(record.machine_id);
        const targetProduction = machine?.target_production || 1;
        record.calculateOEE(targetProduction);
      }
      
      await record.save();
      
      console.log('✅ Registro de produção atualizado no MongoDB:', recordId);
      return record.toObject();
      
    } catch (error) {
      console.error('❌ Erro ao atualizar registro de produção:', error);
      throw error;
    }
  }
  
  // Buscar registros com filtros
  async getProductionRecords(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
    shift?: string;
    operatorId?: string;
    limit?: number;
    offset?: number;
  }) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      
      let query: any = {};
      
      // Aplicar filtros
      if (filters?.machineId) {
        query.machine_id = filters.machineId;
      }
      
      if (filters?.startDate || filters?.endDate) {
        query.start_time = {};
        if (filters.startDate) {
          query.start_time.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.start_time.$lte = new Date(filters.endDate);
        }
      }
      
      if (filters?.shift) {
        query.shift = filters.shift;
      }
      
      if (filters?.operatorId) {
        query.operator_id = filters.operatorId;
      }
      
      // Executar consulta com paginação
      const records = await ProductionRecord
        .find(query)
        .sort({ start_time: -1 })
        .limit(filters?.limit || 50)
        .skip(filters?.offset || 0)
        .lean();
      
      console.log(`✅ ${records.length} registros encontrados no MongoDB`);
      return records;
      
    } catch (error) {
      console.error('❌ Erro ao buscar registros de produção:', error);
      throw error;
    }
  }
  
  // Buscar registro por ID
  async getProductionRecordById(recordId: string) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      
      const record = await ProductionRecord.findById(recordId).lean();
      if (!record) {
        throw new Error('Registro de produção não encontrado');
      }
      
      return record;
      
    } catch (error) {
      console.error('❌ Erro ao buscar registro por ID:', error);
      throw error;
    }
  }
  
  // Excluir registro
  async deleteProductionRecord(recordId: string) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      
      const result = await ProductionRecord.findByIdAndDelete(recordId);
      if (!result) {
        throw new Error('Registro de produção não encontrado');
      }
      
      console.log('✅ Registro de produção excluído do MongoDB:', recordId);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao excluir registro de produção:', error);
      throw error;
    }
  }
  
  // Estatísticas de produção
  async getProductionStatistics(filters?: {
    machineId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      
      let matchQuery: any = {};
      
      if (filters?.machineId) {
        matchQuery.machine_id = filters.machineId;
      }
      
      if (filters?.startDate || filters?.endDate) {
        matchQuery.start_time = {};
        if (filters.startDate) {
          matchQuery.start_time.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          matchQuery.start_time.$lte = new Date(filters.endDate);
        }
      }
      
      const stats = await ProductionRecord.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalProduction: { $sum: '$good_production' },
            totalFilmWaste: { $sum: '$film_waste' },
            totalOrganicWaste: { $sum: '$organic_waste' },
            totalDowntime: { $sum: '$downtime_minutes' },
            totalPlannedTime: { $sum: '$planned_time' },
            averageOEE: { $avg: '$oee_calculated' },
            averageAvailability: { $avg: '$availability_calculated' },
            averagePerformance: { $avg: '$performance_calculated' },
            averageQuality: { $avg: '$quality_calculated' }
          }
        }
      ]);
      
      if (stats.length === 0) {
        return {
          totalRecords: 0,
          totalProduction: 0,
          totalWaste: 0,
          totalDowntime: 0,
          totalPlannedTime: 0,
          averageOEE: 0,
          averageAvailability: 0,
          averagePerformance: 0,
          averageQuality: 0
        };
      }
      
      const result = stats[0];
      return {
        totalRecords: result.totalRecords,
        totalProduction: result.totalProduction,
        totalWaste: result.totalFilmWaste + result.totalOrganicWaste,
        totalDowntime: result.totalDowntime,
        totalPlannedTime: result.totalPlannedTime,
        averageOEE: Math.round((result.averageOEE || 0) * 100) / 100,
        averageAvailability: Math.round((result.averageAvailability || 0) * 100) / 100,
        averagePerformance: Math.round((result.averagePerformance || 0) * 100) / 100,
        averageQuality: Math.round((result.averageQuality || 0) * 100) / 100
      };
      
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      throw error;
    }
  }
  
  // Função para manter compatibilidade (upsert)
  async upsertProductionRecord(data: ProductionRecordData) {
    if (data.recordId) {
      return await this.updateProductionRecord(data.recordId, data);
    } else {
      return await this.createProductionRecord(data);
    }
  }

  // ===== FUNÇÕES DE HISTÓRICO OEE =====
  async getOeeHistory(machineId: string, startDate?: Date, endDate?: Date) {
    await this.connect();
    
    try {
      const ProductionRecord = (await import('@/models/mongoose/ProductionRecord')).default;
      
      let query: any = { machine_id: machineId };
      
      if (startDate || endDate) {
        query.start_time = {};
        if (startDate) {
          query.start_time.$gte = startDate;
        }
        if (endDate) {
          query.start_time.$lte = endDate;
        }
      }
      
      const records = await ProductionRecord
        .find(query)
        .sort({ start_time: -1 })
        .select('start_time oee_calculated availability_calculated performance_calculated quality_calculated')
        .lean();
      
      console.log(`✅ ${records.length} registros de histórico OEE encontrados`);
      return records;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico OEE:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE EVENTOS DE PARADA =====
  async createDowntimeEvent(eventData: any) {
    await this.connect();
    
    try {
      // Criar modelo de DowntimeEvent se não existir
      const DowntimeEvent = {
        machine_id: eventData.machine_id,
        start_time: eventData.start_time,
        end_time: eventData.end_time,
        reason: eventData.reason,
        category: eventData.category || 'production',
        minutes: eventData.minutes,
        downtime_reason_id: eventData.downtime_reason_id,
        created_at: new Date()
      };
      
      // Por enquanto, salvar no localStorage como fallback (se disponível)
       let events = [];
       try {
         if (typeof localStorage !== 'undefined') {
           events = JSON.parse(localStorage.getItem('downtimeEvents') || '[]');
         }
       } catch (e) {
         console.warn('localStorage não disponível, usando memória temporária');
       }
       
       const newEvent = {
         ...DowntimeEvent,
         _id: uuidv4()
       };
       events.push(newEvent);
       
       try {
         if (typeof localStorage !== 'undefined') {
           localStorage.setItem('downtimeEvents', JSON.stringify(events));
         }
       } catch (e) {
         console.warn('Não foi possível salvar no localStorage');
       }
      
      console.log('✅ Evento de parada criado:', newEvent._id);
      return newEvent;
    } catch (error) {
      console.error('❌ Erro ao criar evento de parada:', error);
      throw error;
    }
  }

  async getDowntimeEvents(machineId?: string) {
    await this.connect();
    
    try {
      // Por enquanto, buscar no localStorage como fallback
      const events = JSON.parse(localStorage.getItem('downtimeEvents') || '[]');
      
      let filteredEvents = events;
      if (machineId) {
        filteredEvents = events.filter((event: any) => event.machine_id === machineId);
      }
      
      console.log(`✅ ${filteredEvents.length} eventos de parada encontrados`);
      return filteredEvents;
    } catch (error) {
      console.error('❌ Erro ao buscar eventos de parada:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE MOTIVOS DE PARADA =====
  async getDowntimeReasons() {
    await this.connect();
    
    try {
      // Retornar motivos padrão por enquanto
      const defaultReasons = [
        { _id: '1', name: 'Troca de material', category: 'setup', active: true },
        { _id: '2', name: 'Manutenção preventiva', category: 'maintenance', active: true },
        { _id: '3', name: 'Falha de equipamento', category: 'breakdown', active: true },
        { _id: '4', name: 'Falta de material', category: 'material', active: true },
        { _id: '5', name: 'Limpeza programada', category: 'cleaning', active: true },
        { _id: '6', name: 'Parada para refeição', category: 'break', active: true },
        { _id: '7', name: 'Ajuste de qualidade', category: 'quality', active: true }
      ];
      
      console.log(`✅ ${defaultReasons.length} motivos de parada disponíveis`);
      return defaultReasons;
    } catch (error) {
      console.error('❌ Erro ao buscar motivos de parada:', error);
      throw error;
    }
  }

  async createDowntimeReason(reasonData: any) {
    await this.connect();
    
    try {
      // Por enquanto, salvar no localStorage como fallback
      const reasons = JSON.parse(localStorage.getItem('downtimeReasons') || '[]');
      const newReason = {
        ...reasonData,
        _id: uuidv4(),
        created_at: new Date(),
        active: true
      };
      reasons.push(newReason);
      localStorage.setItem('downtimeReasons', JSON.stringify(reasons));
      
      console.log('✅ Motivo de parada criado:', newReason._id);
      return newReason;
    } catch (error) {
      console.error('❌ Erro ao criar motivo de parada:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE ALERTAS =====
  async createAlert(alertData: any) {
    await this.connect();
    
    try {
      // Por enquanto, salvar no localStorage como fallback
      const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
      const newAlert = {
        ...alertData,
        _id: uuidv4(),
        created_at: new Date(),
        acknowledged: false,
        acknowledged_at: null,
        acknowledged_by: null
      };
      alerts.push(newAlert);
      localStorage.setItem('alerts', JSON.stringify(alerts));
      
      console.log('✅ Alerta criado:', newAlert._id);
      return newAlert;
    } catch (error) {
      console.error('❌ Erro ao criar alerta:', error);
      throw error;
    }
  }

  async getAlerts(machineId?: string) {
    await this.connect();
    
    try {
      // Por enquanto, buscar no localStorage como fallback
      const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
      
      let filteredAlerts = alerts;
      if (machineId) {
        filteredAlerts = alerts.filter((alert: any) => alert.machine_id === machineId);
      }
      
      // Ordenar por data de criação (mais recente primeiro)
      filteredAlerts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`✅ ${filteredAlerts.length} alertas encontrados`);
      return filteredAlerts;
    } catch (error) {
      console.error('❌ Erro ao buscar alertas:', error);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string) {
    await this.connect();
    
    try {
      // Por enquanto, atualizar no localStorage como fallback
      const alerts = JSON.parse(localStorage.getItem('alerts') || '[]');
      const alertIndex = alerts.findIndex((alert: any) => alert._id === alertId);
      
      if (alertIndex === -1) {
        throw new Error('Alerta não encontrado');
      }
      
      alerts[alertIndex].acknowledged = true;
      alerts[alertIndex].acknowledged_at = new Date();
      alerts[alertIndex].acknowledged_by = 'current_user'; // TODO: usar ID do usuário real
      
      localStorage.setItem('alerts', JSON.stringify(alerts));
      
      console.log('✅ Alerta reconhecido:', alertId);
      return alerts[alertIndex];
    } catch (error) {
      console.error('❌ Erro ao reconhecer alerta:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE AUTENTICAÇÃO =====
  async createUser(userData: { email: string; password: string; full_name?: string; roles?: string[]; department?: string; position?: string; }) {
    await this.connect();
    
    try {
      // Por enquanto, salvar no localStorage como fallback
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Verificar se usuário já existe
      const existingUser = users.find((u: any) => u.email === userData.email);
      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const newUser = {
        _id: uuidv4(),
        email: userData.email,
        password: hashedPassword,
        full_name: userData.full_name || userData.email.split('@')[0],
        avatar_url: null,
        roles: userData.roles || [AppRole.OPERADOR],
        department: userData.department,
        position: userData.position,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          email: true,
          push: true,
          whatsapp: false
        },
        preferences: {
          theme: 'light',
          dashboard_layout: 'default'
        },
        security: {
          two_factor_enabled: false,
          login_attempts: 0,
          password_changed_at: new Date()
        },
        status: 'active',
        created_at: new Date(),
        updated_at: new Date()
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = newUser;
      console.log('✅ Usuário criado:', newUser._id);
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error);
      throw error;
    }
  }

  async authenticateUser(email: string, password: string) {
    await this.connect();
    
    try {
      // Por enquanto, buscar no localStorage como fallback
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email);
      
      if (!user) {
        throw new Error('Credenciais inválidas');
      }
      
      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Credenciais inválidas');
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        this.jwtSecret,
        { expiresIn: '24h' }
      );
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = user;
      console.log('✅ Usuário autenticado:', user._id);
      return { user: userWithoutPassword, token };
    } catch (error) {
      console.error('❌ Erro na autenticação:', error);
      throw error;
    }
  }

  async verifyToken(token: string) {
    await this.connect();
    
    try {
      // Verificar e decodificar token JWT
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Buscar usuário
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u._id === decoded.userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Erro na verificação do token:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE USUÁRIO =====
  async getUserProfile(userId: string) {
    await this.connect();
    
    try {
      // Por enquanto, buscar no localStorage como fallback
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u._id === userId);
      
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Erro ao buscar perfil do usuário:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: any) {
    await this.connect();
    
    try {
      // Por enquanto, atualizar no localStorage como fallback
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u._id === userId);
      
      if (userIndex === -1) {
        throw new Error('Usuário não encontrado');
      }
      
      // Atualizar campos
      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updated_at: new Date()
      };
      
      // Se a senha foi atualizada, fazer hash
      if (updates.password) {
        users[userIndex].password = await bcrypt.hash(updates.password, 10);
      }
      
      localStorage.setItem('users', JSON.stringify(users));
      
      // Retornar usuário sem senha
      const { password: _, ...userWithoutPassword } = users[userIndex];
      console.log('✅ Perfil do usuário atualizado:', userId);
      return userWithoutPassword;
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil do usuário:', error);
      throw error;
    }
  }

  // ===== FUNÇÕES DE INICIALIZAÇÃO =====
  async initializeDefaultData() {
    await this.connect();
    
    try {
      console.log('🔄 Inicializando dados padrão do sistema...');
      
      // Verificar se já existem dados
      const machines = await this.getMachines();
      if (machines.length > 0) {
        console.log('ℹ️ Dados já existem, pulando inicialização');
        return { message: 'Dados já inicializados' };
      }
      
      // Criar usuário administrador padrão
      try {
        await this.createUser('admin@sistema-oee.com', 'admin123', 'Administrador do Sistema');
        console.log('✅ Usuário administrador criado');
      } catch (error) {
        console.log('ℹ️ Usuário administrador já existe');
      }
      
      // Criar máquinas padrão
      const defaultMachines = [
        {
          name: 'Extrusora 01',
          code: 'EXT001',
          status: 'ativa',
          target_production: 1000,
          capacity: 1500,
          current_production: 0,
          oee: 85.5,
          availability: 92.3,
          performance: 88.7,
          quality: 96.2,
          permissions: ['view_production', 'create_production'],
          access_level: 'operador'
        },
        {
          name: 'Extrusora 02',
          code: 'EXT002',
          status: 'ativa',
          target_production: 800,
          capacity: 1200,
          current_production: 0,
          oee: 78.2,
          availability: 89.1,
          performance: 85.4,
          quality: 98.1,
          permissions: ['view_production', 'create_production'],
          access_level: 'operador'
        },
        {
          name: 'Injetora 01',
          code: 'INJ001',
          status: 'manutencao',
          target_production: 500,
          capacity: 800,
          current_production: 0,
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 100,
          permissions: ['view_production'],
          access_level: 'supervisor'
        }
      ];
      
      for (const machineData of defaultMachines) {
        try {
          await this.createMachine(machineData);
          console.log(`✅ Máquina criada: ${machineData.name}`);
        } catch (error) {
          console.log(`ℹ️ Máquina já existe: ${machineData.name}`);
        }
      }
      
      console.log('✅ Inicialização de dados padrão concluída');
      return {
        message: 'Dados inicializados com sucesso',
        machines: defaultMachines.length,
        users: 1
      };
    } catch (error) {
      console.error('❌ Erro na inicialização de dados padrão:', error);
      throw error;
    }
  }
}

export const mongoService = new MongoService();
export default mongoService;