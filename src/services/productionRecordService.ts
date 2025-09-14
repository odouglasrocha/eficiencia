// Serviço para gerenciamento de registros de produção com integração MongoDB real
import { ProductionRecordData } from '@/hooks/useProductionRecords';

const API_BASE_URL = 'http://localhost:3001/api';

export interface ProductionRecord {
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
  created_at: string;
  updated_at: string;
}

export interface ProductionStatistics {
  totalRecords: number;
  totalProduction: number;
  totalWaste: number;
  totalDowntime: number;
  totalPlannedTime: number;
  averageOEE: number;
  averageAvailability: number;
  averagePerformance: number;
  averageQuality: number;
}

class ProductionRecordService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
    }

    return response.json();
  }

  // Listar registros de produção
  async getProductionRecords(filters?: {
    machine_id?: string;
    start_date?: string;
    end_date?: string;
    shift?: string;
    operator_id?: string;
    material_code?: string;
    batch_number?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: ProductionRecord[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.machine_id) params.append('machine_id', filters.machine_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.shift) params.append('shift', filters.shift);
      if (filters?.operator_id) params.append('operator_id', filters.operator_id);
      if (filters?.material_code) params.append('material_code', filters.material_code);
      if (filters?.batch_number) params.append('batch_number', filters.batch_number);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      const url = `/production-records${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchWithAuth(url);
      
      return {
        records: response.records,
        total: response.total
      };
    } catch (error) {
      console.error('❌ Erro ao buscar registros de produção:', error);
      throw error;
    }
  }

  // Buscar registro por ID
  async getProductionRecordById(id: string): Promise<ProductionRecord> {
    try {
      const record = await this.fetchWithAuth(`/production-records/${id}`);
      return record;
    } catch (error) {
      console.error('❌ Erro ao buscar registro de produção:', error);
      throw error;
    }
  }

  // Criar novo registro de produção
  async createProductionRecord(data: {
    machineId: string;
    materialCode?: string;
    startTime: string;
    endTime?: string;
    plannedTime: number;
    goodProduction: number;
    filmWaste: number;
    organicWaste: number;
    downtimeEvents?: Array<{
      reason: string;
      duration: number;
      description: string;
    }>;
    shift?: string;
    operatorId?: string;
    notes?: string;
    batchNumber?: string;
    qualityCheck?: boolean;
    temperature?: number;
    pressure?: number;
    speed?: number;
  }): Promise<ProductionRecord> {
    try {
      console.log('🔄 Criando novo registro de produção:', data);
      
      // Calcular downtime total dos eventos
      const totalDowntime = data.downtimeEvents?.reduce((total, event) => total + event.duration, 0) || 0;
      const downtimeReason = data.downtimeEvents?.map(event => `${event.reason}: ${event.description}`).join('; ') || '';
      
      const response = await this.fetchWithAuth('/production-records', {
        method: 'POST',
        body: JSON.stringify({
          machine_id: data.machineId,
          start_time: data.startTime,
          end_time: data.endTime,
          good_production: data.goodProduction,
          film_waste: data.filmWaste,
          organic_waste: data.organicWaste,
          planned_time: data.plannedTime,
          downtime_minutes: totalDowntime,
          downtime_reason: downtimeReason,
          material_code: data.materialCode,
          shift: data.shift,
          operator_id: data.operatorId,
          notes: data.notes,
          batch_number: data.batchNumber,
          quality_check: data.qualityCheck,
          temperature: data.temperature,
          pressure: data.pressure,
          speed: data.speed
        })
      });
      
      console.log('✅ Registro de produção criado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao criar registro de produção:', error);
      throw error;
    }
  }

  // Atualizar registro de produção
  async updateProductionRecord(id: string, updates: Partial<{
    endTime: string;
    goodProduction: number;
    filmWaste: number;
    organicWaste: number;
    plannedTime: number;
    downtimeMinutes: number;
    downtimeReason: string;
    materialCode: string;
    shift: string;
    operatorId: string;
    notes: string;
    batchNumber: string;
    qualityCheck: boolean;
    temperature: number;
    pressure: number;
    speed: number;
  }>): Promise<ProductionRecord> {
    try {
      console.log('🔄 Atualizando registro de produção:', id, updates);
      
      const response = await this.fetchWithAuth(`/production-records/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          end_time: updates.endTime,
          good_production: updates.goodProduction,
          film_waste: updates.filmWaste,
          organic_waste: updates.organicWaste,
          planned_time: updates.plannedTime,
          downtime_minutes: updates.downtimeMinutes,
          downtime_reason: updates.downtimeReason,
          material_code: updates.materialCode,
          shift: updates.shift,
          operator_id: updates.operatorId,
          notes: updates.notes,
          batch_number: updates.batchNumber,
          quality_check: updates.qualityCheck,
          temperature: updates.temperature,
          pressure: updates.pressure,
          speed: updates.speed
        })
      });
      
      console.log('✅ Registro de produção atualizado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('❌ Erro ao atualizar registro de produção:', error);
      throw error;
    }
  }

  // Deletar registro de produção
  async deleteProductionRecord(id: string): Promise<void> {
    try {
      console.log('🔄 Deletando registro de produção:', id);
      
      await this.fetchWithAuth(`/production-records/${id}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Registro de produção deletado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar registro de produção:', error);
      throw error;
    }
  }

  // Upsert (criar ou atualizar) registro de produção
  async upsertProductionRecord(data: {
    machineId: string;
    materialCode?: string;
    startTime: string;
    endTime?: string;
    plannedTime: number;
    goodProduction: number;
    filmWaste: number;
    organicWaste: number;
    downtimeEvents?: Array<{
      reason: string;
      duration: number;
      description: string;
    }>;
    shift?: string;
    operatorId?: string;
    notes?: string;
    batchNumber?: string;
    qualityCheck?: boolean;
    temperature?: number;
    pressure?: number;
    speed?: number;
  }): Promise<ProductionRecord & { action: 'created' | 'updated' }> {
    try {
      console.log('🔄 Upsert de registro de produção:', data);
      
      // Calcular downtime total dos eventos
      const totalDowntime = data.downtimeEvents?.reduce((total, event) => total + event.duration, 0) || 0;
      const downtimeReason = data.downtimeEvents?.map(event => `${event.reason}: ${event.description}`).join('; ') || '';
      
      const response = await this.fetchWithAuth('/production-records/upsert', {
        method: 'POST',
        body: JSON.stringify({
          machine_id: data.machineId,
          start_time: data.startTime,
          end_time: data.endTime,
          good_production: data.goodProduction,
          film_waste: data.filmWaste,
          organic_waste: data.organicWaste,
          planned_time: data.plannedTime,
          downtime_minutes: totalDowntime,
          downtime_reason: downtimeReason,
          material_code: data.materialCode,
          shift: data.shift,
          operator_id: data.operatorId,
          notes: data.notes,
          batch_number: data.batchNumber,
          quality_check: data.qualityCheck,
          temperature: data.temperature,
          pressure: data.pressure,
          speed: data.speed
        })
      });
      
      console.log('✅ Upsert de registro de produção realizado:', response.action);
      return response;
    } catch (error) {
      console.error('❌ Erro no upsert de registro de produção:', error);
      throw error;
    }
  }

  // Obter estatísticas de produção
  async getProductionStatistics(filters?: {
    machine_id?: string;
    start_date?: string;
    end_date?: string;
    shift?: string;
  }): Promise<ProductionStatistics> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.machine_id) params.append('machine_id', filters.machine_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.shift) params.append('shift', filters.shift);
      
      const queryString = params.toString();
      const url = `/production-statistics${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchWithAuth(url);
      return response;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de produção:', error);
      throw error;
    }
  }

  // Verificar se API está disponível
  async isApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.log('ℹ️ API MongoDB não disponível, usando fallback');
      return false;
    }
  }
}

export const productionRecordService = new ProductionRecordService();
export default productionRecordService;