import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { materialsData } from '@/data/materialsData';
import mockMongoService from '@/services/mockMongoService';
import machineService from '@/services/machineService';

export interface Machine {
  id: string;
  name: string;
  code: string;
  status: 'ativa' | 'manutencao' | 'parada' | 'inativa';
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  current_production: number;
  target_production: number;
  capacity: number;
  permissions: string[];
  access_level: 'operador' | 'supervisor' | 'administrador';
  created_at?: string;
  updated_at?: string;
}

export interface CreateMachineData {
  name: string;
  code: string;
  status: 'ativa' | 'manutencao' | 'parada' | 'inativa';
  permissions: string[];
  access_level: 'operador' | 'supervisor' | 'administrador';
}

export function useMachines() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchMachines = async () => {
    try {
      setLoading(true);
      
      // Tentar usar API real primeiro
      const isApiAvailable = await machineService.isApiAvailable();
      
      let machinesData;
      if (isApiAvailable) {
        console.log('✅ Usando API MongoDB real para buscar máquinas');
        const response = await machineService.getMachines();
        machinesData = response.machines;
      } else {
        console.log('ℹ️ Usando mockMongoService para buscar máquinas');
        machinesData = await mockMongoService.getMachines();
      }

      // Para cada máquina, buscar valores da production_records e calcular métricas
      const machinesWithCalculatedValues = await Promise.all(
        machinesData.map(async (machine: any) => {
          try {
            // Validar se a máquina tem ID válido
            const machineId = machine.id || machine._id;
            if (!machineId) {
              console.warn('⚠️ Máquina sem ID válido:', machine);
              return {
                id: 'unknown',
                name: machine.name || 'Máquina sem nome',
                code: machine.code || 'UNKNOWN',
                status: machine.status || 'inativa',
                oee: 0,
                availability: 0,
                performance: 0,
                quality: 100,
                current_production: 0,
                target_production: 0,
                capacity: machine.capacity || 1000,
                permissions: machine.permissions || [],
                access_level: machine.access_level || 'operador',
                created_at: machine.created_at,
                updated_at: machine.updated_at
              };
            }
            
            // Buscar dados de produção da máquina
            const machineIdString = typeof machineId === 'string' ? machineId : machineId.toString();
            
            let currentProduction = 0;
            let calculatedMeta = 0;
            let lastRecord = null;
            
            try {
              if (isApiAvailable) {
                // Buscar good_production do oee_history para data atual
                console.log(`🔍 Buscando dados OEE para máquina ${machineIdString} via API`);
                const today = new Date().toISOString().split('T')[0];
                const oeeResponse = await fetch(`http://localhost:3001/api/oee-history?machine_id=${machineIdString}&date=${today}&limit=1`);
                
                if (oeeResponse.ok) {
                  const oeeData = await oeeResponse.json();
                  if (oeeData.records && oeeData.records.length > 0) {
                    // Se existe registro OEE de hoje, usar good_production dele
                    currentProduction = oeeData.records[0].good_production || 0;
                    console.log(`✅ Good production do OEE history: ${currentProduction}`);
                  }
                }
                
                // Buscar último registro de produção para calcular meta
                const prodResponse = await fetch(`http://localhost:3001/api/production-records?machine_id=${machineIdString}&limit=1`);
                if (prodResponse.ok) {
                  const prodData = await prodResponse.json();
                  lastRecord = prodData.records?.[0];
                  
                  // Se não encontrou good_production no OEE, usar do production record
                  if (currentProduction === 0 && lastRecord) {
                    currentProduction = lastRecord.good_production || 0;
                  }
                }
              } else {
                // Fallback para mock service
                const productionRecords = await mockMongoService.getProductionRecords(machineIdString);
                lastRecord = productionRecords[0];
                currentProduction = lastRecord?.good_production || machine.current_production || 0;
              }
              
              // Calcular meta baseada no material: PPm * planned_time * 85%
              if (lastRecord && lastRecord.material_code && lastRecord.planned_time) {
                const material = materialsData.find(m => m.Codigo === lastRecord.material_code);
                if (material) {
                  // Meta = PPm * planned_time (em minutos) * 85%
                  calculatedMeta = Math.round(material.PPm * lastRecord.planned_time * 0.85);
                  console.log(`✅ Meta calculada: ${material.PPm} PPm * ${lastRecord.planned_time}min * 85% = ${calculatedMeta}`);
                }
              }
              
            } catch (error) {
              console.warn(`⚠️ Erro ao buscar dados para máquina ${machineIdString}:`, error);
              currentProduction = machine.current_production || 0;
            }

            // Fallback para meta se não foi calculada
            if (calculatedMeta === 0) {
              calculatedMeta = machine.target_production || 0;
            }
            
            // Se não tem meta definida, usar valores padrão baseados no código da máquina
            if (calculatedMeta === 0) {
              switch (machine.code) {
                case 'EXT-001': calculatedMeta = 1200; break;
                case 'INJ-002': calculatedMeta = 600; break;
                case 'LMA-003': calculatedMeta = 1800; break;
                case 'PRH-004': calculatedMeta = 400; break;
                case 'CNC-005': calculatedMeta = 250; break;
                case 'EA01': calculatedMeta = 1000; break;
                default: calculatedMeta = 1000; // Meta padrão genérica
              }
            }
            
            // Calcular OEE baseado nos registros de produção reais
            let calculatedAvailability, calculatedPerformance, calculatedQuality, calculatedOEE;
            
            if (lastRecord) {
              // Usar dados do último registro de produção para cálculo correto do OEE
              const oeeMetrics = mockMongoService.calculateOeeMetrics(
                lastRecord.good_production || 0,
                lastRecord.planned_time || 480, // 8 horas padrão em minutos
                lastRecord.downtime_minutes || 0,
                calculatedMeta
              );
              
              calculatedAvailability = oeeMetrics.availability;
              calculatedPerformance = oeeMetrics.performance;
              calculatedQuality = oeeMetrics.quality;
              calculatedOEE = oeeMetrics.oee;
            } else {
              // Se não há registro, usar valores da máquina ou padrões
              calculatedAvailability = machine.availability || 87.95;
              calculatedPerformance = machine.performance || 96.70;
              calculatedQuality = machine.quality || 100.0;
              calculatedOEE = (calculatedAvailability * calculatedPerformance * calculatedQuality) / 10000;
            }

            return {
              id: machineIdString,
              name: machine.name,
              code: machine.code,
              status: machine.status,
              current_production: currentProduction,
              target_production: calculatedMeta,
              oee: Math.max(0, Math.min(100, calculatedOEE)),
              availability: Math.max(0, Math.min(100, calculatedAvailability)),
              performance: Math.max(0, Math.min(100, calculatedPerformance)),
              quality: calculatedQuality,
              capacity: machine.capacity || 0,
              permissions: machine.permissions || [],
              access_level: machine.access_level || 'operador',
              created_at: machine.created_at,
              updated_at: machine.updated_at
            } as Machine;
          } catch (err) {
            console.error(`Erro ao processar máquina ${machine.name || machine.code || 'desconhecida'}:`, err);
            // Retornar máquina com valores padrão em caso de erro
            const fallbackId = machine.id || machine._id || `fallback-${Date.now()}`;
            const fallbackIdString = typeof fallbackId === 'string' ? fallbackId : fallbackId.toString();
            
            return {
              id: fallbackIdString,
              name: machine.name || 'Máquina com erro',
              code: machine.code || 'ERROR',
              status: machine.status || 'inativa',
              current_production: 0,
              target_production: 0,
              oee: 0,
              availability: 0,
              performance: 0,
              quality: 100,
              capacity: machine.capacity || 0,
              permissions: machine.permissions || [],
              access_level: machine.access_level || 'operador',
              created_at: machine.created_at,
              updated_at: machine.updated_at
            } as Machine;
          }
        })
      );
      
      setMachines(machinesWithCalculatedValues);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar máquinas';
      setError(message);
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMachine = async (machineData: CreateMachineData) => {
    try {
      // Tentar usar API real primeiro
      const isApiAvailable = await machineService.isApiAvailable();
      
      let newMachine;
      if (isApiAvailable) {
        console.log('✅ Usando API MongoDB real para criar máquina');
        newMachine = await machineService.createMachine(machineData);
      } else {
        console.log('ℹ️ Usando mockMongoService para criar máquina');
        newMachine = await mockMongoService.createMachine({
          ...machineData,
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 0,
          current_production: 0,
          target_production: 0,
          capacity: 0,
        });
      }

      const machineForState: Machine = {
        id: newMachine.id || newMachine._id?.toString() || newMachine._id,
        name: newMachine.name,
        code: newMachine.code,
        status: newMachine.status,
        oee: newMachine.oee || 0,
        availability: newMachine.availability || 0,
        performance: newMachine.performance || 0,
        quality: newMachine.quality || 100,
        current_production: newMachine.current_production || 0,
        target_production: newMachine.target_production || 1,
        capacity: newMachine.capacity || 1000,
        permissions: newMachine.permissions || [],
        access_level: newMachine.access_level || 'operador',
        created_at: newMachine.created_at,
        updated_at: newMachine.updated_at
      };

      setMachines(prev => [machineForState, ...prev]);
      toast({
        title: "Sucesso",
        description: "Máquina criada com sucesso!",
      });
      return newMachine;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar máquina';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateMachine = async (id: string, updates: Partial<Machine>) => {
    try {
      // Tentar usar API real primeiro
      const isApiAvailable = await machineService.isApiAvailable();
      
      let updatedMachine;
      if (isApiAvailable) {
        console.log('✅ Usando API MongoDB real para atualizar máquina');
        updatedMachine = await machineService.updateMachine(id, updates);
      } else {
        console.log('ℹ️ Usando mockMongoService para atualizar máquina');
        updatedMachine = await mockMongoService.updateMachine(id, updates);
      }

      setMachines(prev => prev.map(machine => 
        machine.id === id ? { 
          ...machine, 
          ...updates,
          id: updatedMachine.id || updatedMachine._id?.toString() || updatedMachine._id,
          updated_at: updatedMachine.updated_at
        } as Machine : machine
      ));

      toast({
        title: "Sucesso",
        description: "Máquina atualizada com sucesso!",
      });
      return updatedMachine;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar máquina';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteMachine = async (id: string) => {
    try {
      // Tentar usar API real primeiro
      const isApiAvailable = await machineService.isApiAvailable();
      
      if (isApiAvailable) {
        console.log('✅ Usando API MongoDB real para deletar máquina');
        await machineService.deleteMachine(id);
      } else {
        console.log('ℹ️ Usando mockMongoService para deletar máquina');
        await mockMongoService.deleteMachine(id);
      }

      setMachines(prev => prev.filter(machine => machine.id !== id));
      toast({
        title: "Sucesso",
        description: "Máquina e todos os registros relacionados excluídos com sucesso!",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir máquina';
      toast({
        title: "Erro",
        description: message,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchMachines();
    
    // Listener para atualização automática quando salvar produção
    const handleMachineDataUpdate = (event: CustomEvent) => {
      console.log('🔄 Dados da máquina atualizados, recarregando...', event.detail);
      fetchMachines(); // Recarregar dados automaticamente
    };
    
    window.addEventListener('machineDataUpdated', handleMachineDataUpdate as EventListener);
    
    // Cleanup do listener
    return () => {
      window.removeEventListener('machineDataUpdated', handleMachineDataUpdate as EventListener);
    };
  }, []);

  return {
    machines,
    loading,
    error,
    createMachine,
    updateMachine,
    deleteMachine,
    refetch: fetchMachines,
  };
}