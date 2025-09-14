// Hook para gerenciar refresh automático após salvar registros de produção
import { useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ProductionRefreshEvent {
  record: any;
  machineId: string;
  action: 'created' | 'updated';
}

export interface UseProductionRefreshOptions {
  onRefresh?: (event: ProductionRefreshEvent) => void | Promise<void>;
  onMachineUpdate?: (machineId: string) => void | Promise<void>;
  onKPIUpdate?: () => void | Promise<void>;
  onListUpdate?: () => void | Promise<void>;
  autoRefreshEnabled?: boolean;
}

/**
 * Hook para gerenciar refresh automático de componentes após salvar registros de produção
 * 
 * @param options Opções de configuração do refresh
 * @returns Funções para controle manual do refresh
 */
export function useProductionRefresh(options: UseProductionRefreshOptions = {}) {
  const {
    onRefresh,
    onMachineUpdate,
    onKPIUpdate,
    onListUpdate,
    autoRefreshEnabled = true
  } = options;
  
  const { toast } = useToast();

  // Handler para o evento de produção salva
  const handleProductionSaved = useCallback(async (event: CustomEvent<ProductionRefreshEvent>) => {
    if (!autoRefreshEnabled) return;
    
    const { detail } = event;
    console.log('🔄 Evento de produção salva recebido:', detail);
    
    try {
      // Executar callback geral de refresh
      if (onRefresh) {
        await onRefresh(detail);
      }
      
      // Executar callback específico da máquina
      if (onMachineUpdate) {
        await onMachineUpdate(detail.machineId);
      }
      
      // Executar callback de atualização de KPIs
      if (onKPIUpdate) {
        await onKPIUpdate();
      }
      
      // Executar callback de atualização de lista
      if (onListUpdate) {
        await onListUpdate();
      }
      
      console.log('✅ Refresh automático executado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro durante refresh automático:', error);
      toast({
        title: "Aviso",
        description: "Dados salvos com sucesso, mas houve erro na atualização da interface.",
        variant: "default",
      });
    }
  }, [onRefresh, onMachineUpdate, onKPIUpdate, onListUpdate, autoRefreshEnabled, toast]);

  // Registrar listener do evento
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    
    window.addEventListener('productionRecordSaved', handleProductionSaved as EventListener);
    
    return () => {
      window.removeEventListener('productionRecordSaved', handleProductionSaved as EventListener);
    };
  }, [handleProductionSaved, autoRefreshEnabled]);

  // Funções para controle manual
  const triggerRefresh = useCallback((data: ProductionRefreshEvent) => {
    window.dispatchEvent(new CustomEvent('productionRecordSaved', { detail: data }));
  }, []);

  const triggerMachineRefresh = useCallback(async (machineId: string) => {
    if (onMachineUpdate) {
      await onMachineUpdate(machineId);
    }
  }, [onMachineUpdate]);

  const triggerKPIRefresh = useCallback(async () => {
    if (onKPIUpdate) {
      await onKPIUpdate();
    }
  }, [onKPIUpdate]);

  const triggerListRefresh = useCallback(async () => {
    if (onListUpdate) {
      await onListUpdate();
    }
  }, [onListUpdate]);

  return {
    // Controles manuais
    triggerRefresh,
    triggerMachineRefresh,
    triggerKPIRefresh,
    triggerListRefresh,
    
    // Estado
    autoRefreshEnabled
  };
}

/**
 * Hook simplificado para componentes que só precisam atualizar dados
 * 
 * @param refreshFunction Função a ser executada no refresh
 * @param dependencies Dependências para o refresh
 * @returns Função para trigger manual
 */
export function useSimpleProductionRefresh(
  refreshFunction: () => void | Promise<void>,
  dependencies: string[] = []
) {
  return useProductionRefresh({
    onRefresh: async () => {
      await refreshFunction();
    },
    onKPIUpdate: async () => {
      await refreshFunction();
    },
    onListUpdate: async () => {
      await refreshFunction();
    }
  });
}

/**
 * Hook para componentes de máquina específica
 * 
 * @param machineId ID da máquina
 * @param refreshFunction Função de refresh
 * @returns Controles de refresh
 */
export function useMachineProductionRefresh(
  machineId: string,
  refreshFunction: () => void | Promise<void>
) {
  return useProductionRefresh({
    onMachineUpdate: async (updatedMachineId) => {
      if (updatedMachineId === machineId) {
        await refreshFunction();
      }
    },
    onRefresh: async (event) => {
      if (event.machineId === machineId) {
        await refreshFunction();
      }
    }
  });
}

export default useProductionRefresh;