const API_BASE_URL = 'http://localhost:3001/api';

export interface OeeHistoryEntry {
  _id: string;
  machine_id: string;
  production_record_id: string;
  timestamp: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  good_production: number;
  total_waste: number;
  downtime_minutes: number;
  planned_time: number;
  shift?: string;
  operator_id?: string;
  created_at: string;
}

export interface OeeHistoryFilters {
  machine_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

class OeeHistoryService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Erro interno do servidor' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Verificar se a API está disponível
  async isApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        timeout: 5000
      } as any);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Buscar histórico OEE com filtros
  async getOeeHistory(filters?: OeeHistoryFilters): Promise<{ history: OeeHistoryEntry[]; total: number }> {
    try {
      console.log('🔄 Buscando histórico OEE:', filters);
      
      const params = new URLSearchParams();
      if (filters?.machine_id) params.append('machine_id', filters.machine_id);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      
      const queryString = params.toString();
      const url = `/oee-history${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchWithAuth(url);
      
      console.log('✅ Histórico OEE carregado:', response.history?.length || 0, 'entradas');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico OEE:', error);
      throw error;
    }
  }

  // Buscar histórico OEE por máquina específica
  async getOeeHistoryByMachine(
    machineId: string, 
    startDate?: string, 
    endDate?: string, 
    limit?: number
  ): Promise<OeeHistoryEntry[]> {
    try {
      console.log('🔄 Buscando histórico OEE da máquina:', machineId);
      
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      if (limit) params.append('limit', limit.toString());
      
      const queryString = params.toString();
      const url = `/oee-history/${machineId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await this.fetchWithAuth(url);
      
      console.log('✅ Histórico OEE da máquina carregado:', response.length, 'entradas');
      return response;
    } catch (error) {
      console.error('❌ Erro ao buscar histórico OEE da máquina:', error);
      throw error;
    }
  }

  // Calcular estatísticas do histórico
  calculateHistoryStatistics(history: OeeHistoryEntry[]) {
    if (!history || history.length === 0) {
      return {
        avgOee: 0,
        avgAvailability: 0,
        avgPerformance: 0,
        avgQuality: 0,
        totalProduction: 0,
        totalWaste: 0,
        totalDowntime: 0,
        entriesCount: 0
      };
    }

    const totals = history.reduce((acc, entry) => {
      acc.oee += entry.oee;
      acc.availability += entry.availability;
      acc.performance += entry.performance;
      acc.quality += entry.quality;
      acc.production += entry.good_production;
      acc.waste += entry.total_waste;
      acc.downtime += entry.downtime_minutes;
      return acc;
    }, {
      oee: 0,
      availability: 0,
      performance: 0,
      quality: 0,
      production: 0,
      waste: 0,
      downtime: 0
    });

    const count = history.length;

    return {
      avgOee: totals.oee / count,
      avgAvailability: totals.availability / count,
      avgPerformance: totals.performance / count,
      avgQuality: totals.quality / count,
      totalProduction: totals.production,
      totalWaste: totals.waste,
      totalDowntime: totals.downtime,
      entriesCount: count
    };
  }

  // Agrupar histórico por período (dia, semana, mês)
  groupHistoryByPeriod(history: OeeHistoryEntry[], period: 'day' | 'week' | 'month' = 'day') {
    const grouped = new Map();

    history.forEach(entry => {
      const date = new Date(entry.timestamp);
      let key: string;

      switch (period) {
        case 'day':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(entry);
    });

    // Calcular médias para cada período
    const result = Array.from(grouped.entries()).map(([period, entries]) => {
      const stats = this.calculateHistoryStatistics(entries as OeeHistoryEntry[]);
      return {
        period,
        ...stats,
        entries: entries as OeeHistoryEntry[]
      };
    });

    return result.sort((a, b) => a.period.localeCompare(b.period));
  }
}

export const oeeHistoryService = new OeeHistoryService();
export default oeeHistoryService;