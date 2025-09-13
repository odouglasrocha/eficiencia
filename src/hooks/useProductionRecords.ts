import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { materialsData } from '@/data/materialsData';
import productionService from '@/services/productionService';
import { ProductionRecordData as ServiceProductionRecordData } from '@/services/mongoService';
import { IProductionRecord } from '@/models';

// Interface para o frontend (mantém compatibilidade)
export interface ProductionRecordData {
  recordId?: string; // Para operações de update
  machineId: string;
  materialCode: string;
  startTime: string;
  endTime: string;
  plannedTime: number;
  goodProduction: number;
  filmWaste: number;
  organicWaste: string;
  downtimeEvents: DowntimeEventData[];
  shift?: string;
  operatorId?: string;
  notes?: string;
  batchNumber?: string;
  qualityCheck?: boolean;
  temperature?: number;
  pressure?: number;
  speed?: number;
}

export interface DowntimeEventData {
  id: string;
  reason: string;
  duration: number;
  description: string;
}

export interface ProductionFilters {
  machineId?: string;
  startDate?: string;
  endDate?: string;
  shift?: string;
  operatorId?: string;
  materialCode?: string;
  limit?: number;
  offset?: number;
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

export function useProductionRecords() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<IProductionRecord[]>([]);
  const [statistics, setStatistics] = useState<ProductionStatistics | null>(null);
  const { toast } = useToast();

  // ===== OPERAÇÕES CRUD COMPLETAS =====

  // Criar novo registro de produção
  const createProductionRecord = async (data: ProductionRecordData) => {
    try {
      setLoading(true);
      console.log('🔍 Criando registro de produção:', data);

      // Validações
      if (!data.machineId) {
        throw new Error('ID da máquina é obrigatório');
      }

      if (data.materialCode) {
        const material = materialsData.find(m => m.Codigo === data.materialCode);
        if (!material) {
          throw new Error('Material não encontrado');
        }
      }
      
      // Calcular total de tempo de parada
      const totalDowntimeMinutes = data.downtimeEvents.reduce(
        (total, event) => total + event.duration, 
        0
      );

      // Converter organicWaste para número
      const organicWasteNumber = parseFloat(data.organicWaste.replace(',', '.'));

      // Preparar dados para o serviço
      const serviceData: ServiceProductionRecordData = {
        machineId: data.machineId,
        startTime: data.startTime,
        endTime: data.endTime,
        goodProduction: data.goodProduction,
        filmWaste: data.filmWaste,
        organicWaste: organicWasteNumber,
        plannedTime: data.plannedTime,
        downtimeMinutes: totalDowntimeMinutes,
        downtimeReason: data.downtimeEvents.map(e => e.reason).join(', ') || undefined,
        materialCode: data.materialCode,
        shift: data.shift,
        operatorId: data.operatorId,
        notes: data.notes,
        batchNumber: data.batchNumber,
        qualityCheck: data.qualityCheck,
        temperature: data.temperature,
        pressure: data.pressure,
        speed: data.speed
      };

      const result = await productionService.createProductionRecord(serviceData);

      // Criar eventos de parada individuais
      if (data.downtimeEvents.length > 0) {
        try {
          // Tentar usar o serviço de downtime (se disponível)
          const { default: mockMongoService } = await import('@/services/mockMongoService');
          await Promise.all(
            data.downtimeEvents.map(event => 
              mockMongoService.createDowntimeEvent({
                machine_id: data.machineId,
                reason: event.reason,
                minutes: event.duration,
                category: 'production',
                start_time: new Date(data.startTime),
                end_time: new Date(
                  new Date(data.startTime).getTime() + event.duration * 60000
                )
              })
            )
          );
        } catch (downtimeError) {
          console.warn('⚠️ Erro ao salvar eventos de downtime:', downtimeError);
        }
      }

      // Atualizar lista local
      await loadProductionRecords();

      toast({
        title: "Sucesso",
        description: "Registro de produção criado com sucesso!",
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar registro';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar registro existente
  const updateProductionRecord = async (recordId: string, data: Partial<ProductionRecordData>) => {
    try {
      setLoading(true);

      // Preparar dados para atualização
      const updateData: Partial<ServiceProductionRecordData> = {
        ...data,
        organicWaste: data.organicWaste ? parseFloat(data.organicWaste.replace(',', '.')) : undefined
      };

      const result = await productionService.updateProductionRecord(recordId, updateData);
      
      // Atualizar lista local
      await loadProductionRecords();

      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso!",
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar registro';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar registros com filtros
  const loadProductionRecords = async (filters?: ProductionFilters) => {
    try {
      setLoading(true);
      const result = await productionService.getProductionRecords(filters);
      setRecords(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar registros';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar registro específico por ID
  const getProductionRecordById = async (recordId: string) => {
    try {
      setLoading(true);
      return await productionService.getProductionRecordById(recordId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar registro';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir registro
  const deleteProductionRecord = async (recordId: string) => {
    try {
      setLoading(true);
      await productionService.deleteProductionRecord(recordId);
      
      // Atualizar lista local
      await loadProductionRecords();

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir registro';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas de produção
  const loadProductionStatistics = async (filters?: ProductionFilters) => {
    try {
      const stats = await productionService.getProductionStatistics(filters);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Função para manter compatibilidade com código existente
  const createOrUpdateProductionRecord = async (data: ProductionRecordData) => {
    if (data.recordId) {
      return await updateProductionRecord(data.recordId, data);
    } else {
      return await createProductionRecord(data);
    }
  };

  // Carregar registros iniciais
  useEffect(() => {
    loadProductionRecords();
  }, []);

  return {
    // Dados
    records,
    statistics,
    loading,
    
    // Operações CRUD
    createProductionRecord,
    updateProductionRecord,
    loadProductionRecords,
    getProductionRecordById,
    deleteProductionRecord,
    loadProductionStatistics,
    
    // Compatibilidade
    createOrUpdateProductionRecord,
  };
}