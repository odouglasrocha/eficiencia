import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { materialsData } from '@/data/materialsData';
import mockMongoService from '@/services/mockMongoService';

export interface ProductionRecordData {
  machineId: string;
  materialCode: string;
  startTime: string;
  endTime: string;
  plannedTime: number;
  goodProduction: number;
  filmWaste: number;
  organicWaste: string;
  downtimeEvents: DowntimeEventData[];
}

export interface DowntimeEventData {
  id: string;
  reason: string;
  duration: number;
  description: string;
}

export function useProductionRecords() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrUpdateProductionRecord = async (data: ProductionRecordData) => {
    try {
      setLoading(true);
      console.log('🔍 Iniciando inserção de produção:', data);

      // Verificar se temos o machineId
      if (!data.machineId) {
        console.error('❌ ID da máquina não fornecido');
        throw new Error('ID da máquina é obrigatório');
      }

      // Verificar se o material existe
      const material = materialsData.find(m => m.Codigo === data.materialCode);
      if (!material) {
        console.error('❌ Material não encontrado:', data.materialCode);
        throw new Error('Material não encontrado');
      }
      console.log('✅ Material encontrado:', material);
      console.log('✅ Usando máquina ID:', data.machineId);
      
      // Calcular total de tempo de parada
      const totalDowntimeMinutes = data.downtimeEvents.reduce(
        (total, event) => total + event.duration, 
        0
      );

      // Converter organicWaste para número
      const organicWasteNumber = parseFloat(data.organicWaste.replace(',', '.'));

      console.log('📊 Dados para inserção:', {
        machine_id: data.machineId,
        good_production: data.goodProduction,
        planned_time: data.plannedTime,
        downtime_minutes: totalDowntimeMinutes
      });

      // Usar a função de upsert do mockMongoService
      const result = await mockMongoService.upsertProductionRecord({
        machineId: data.machineId,
        startTime: data.startTime,
        endTime: data.endTime,
        goodProduction: data.goodProduction,
        filmWaste: data.filmWaste,
        organicWaste: organicWasteNumber,
        plannedTime: data.plannedTime,
        downtimeMinutes: totalDowntimeMinutes,
        downtimeReason: data.downtimeEvents.map(e => e.reason).join(', ') || undefined
      });

      console.log('✅ Registro inserido com sucesso:', result);

      // Criar eventos de parada individuais se existirem
      if (data.downtimeEvents.length > 0) {
        try {
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
          console.warn('Erro ao salvar eventos de parada:', downtimeError);
        }
      }

      toast({
        title: "Sucesso",
        description: "Registro de produção salvo com sucesso!",
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar registro';
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

  const deleteProductionRecord = async (machineId: string) => {
    try {
      setLoading(true);

      // Usar função de delete do mockMongoService que remove registros relacionados
      await mockMongoService.deleteMachine(machineId);

      toast({
        title: "Sucesso", 
        description: "Registros excluídos com sucesso!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir registros';
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

  return {
    createOrUpdateProductionRecord,
    deleteProductionRecord,
    loading,
  };
}