// Serviço para gerenciamento de máquinas com integração MongoDB real
import { Machine, CreateMachineData } from '@/hooks/useMachines';

const API_BASE_URL = 'http://localhost:3001/api';

class MachineService {
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

  // Listar todas as máquinas
  async getMachines(filters?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ machines: Machine[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      const url = `/machines${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchWithAuth(url);
      
      // Converter formato MongoDB para formato do frontend
      const machines = response.machines.map((machine: any) => ({
        id: machine._id,
        name: machine.name,
        code: machine.code,
        status: machine.status,
        oee: machine.oee || 0,
        availability: machine.availability || 0,
        performance: machine.performance || 0,
        quality: machine.quality || 100,
        current_production: machine.current_production || 0,
        target_production: machine.target_production || 1,
        capacity: machine.capacity || 1000,
        permissions: machine.permissions || [],
        access_level: machine.access_level || 'operador',
        created_at: machine.created_at,
        updated_at: machine.updated_at
      }));
      
      return {
        machines,
        total: response.total
      };
    } catch (error) {
      console.error('❌ Erro ao buscar máquinas:', error);
      throw error;
    }
  }

  // Buscar máquina por ID
  async getMachineById(id: string): Promise<Machine> {
    try {
      const machine = await this.fetchWithAuth(`/machines/${id}`);
      
      return {
        id: machine._id,
        name: machine.name,
        code: machine.code,
        status: machine.status,
        oee: machine.oee || 0,
        availability: machine.availability || 0,
        performance: machine.performance || 0,
        quality: machine.quality || 100,
        current_production: machine.current_production || 0,
        target_production: machine.target_production || 1,
        capacity: machine.capacity || 1000,
        permissions: machine.permissions || [],
        access_level: machine.access_level || 'operador',
        created_at: machine.created_at,
        updated_at: machine.updated_at
      };
    } catch (error) {
      console.error('❌ Erro ao buscar máquina:', error);
      throw error;
    }
  }

  // Criar nova máquina
  async createMachine(machineData: CreateMachineData): Promise<Machine> {
    try {
      console.log('🔄 Criando nova máquina:', machineData);
      
      const response = await this.fetchWithAuth('/machines', {
          method: 'POST',
          body: JSON.stringify({
            name: machineData.name.trim(),
            code: machineData.code.toUpperCase().trim(),
            status: machineData.status || 'inativa',
            permissions: machineData.permissions || [],
            access_level: machineData.access_level || 'operador'
          })
        });
      
      console.log('✅ Máquina criada com sucesso:', response);
      
      return {
        id: response._id,
        name: response.name,
        code: response.code,
        status: response.status,
        oee: response.oee || 0,
        availability: response.availability || 0,
        performance: response.performance || 0,
        quality: response.quality || 100,
        current_production: response.current_production || 0,
        target_production: response.target_production || 1,
        capacity: response.capacity || 1000,
        permissions: response.permissions || [],
        access_level: response.access_level || 'operador',
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      console.error('❌ Erro ao criar máquina:', error);
      throw error;
    }
  }

  // Atualizar máquina
  async updateMachine(id: string, updates: Partial<CreateMachineData & {
    oee?: number;
    availability?: number;
    performance?: number;
    quality?: number;
    current_production?: number;
  }>): Promise<Machine> {
    try {
      console.log('🔄 Atualizando máquina:', id, updates);
      
      const response = await this.fetchWithAuth(`/machines/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      console.log('✅ Máquina atualizada com sucesso:', response);
      
      return {
        id: response._id,
        name: response.name,
        code: response.code,
        status: response.status,
        oee: response.oee || 0,
        availability: response.availability || 0,
        performance: response.performance || 0,
        quality: response.quality || 100,
        current_production: response.current_production || 0,
        target_production: response.target_production || 1,
        capacity: response.capacity || 1000,
        permissions: response.permissions || [],
        access_level: response.access_level || 'operador',
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      console.error('❌ Erro ao atualizar máquina:', error);
      throw error;
    }
  }

  // Deletar máquina
  async deleteMachine(id: string): Promise<void> {
    try {
      console.log('🔄 Deletando máquina:', id);
      
      await this.fetchWithAuth(`/machines/${id}`, {
        method: 'DELETE'
      });
      
      console.log('✅ Máquina deletada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao deletar máquina:', error);
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

export const machineService = new MachineService();
export default machineService;