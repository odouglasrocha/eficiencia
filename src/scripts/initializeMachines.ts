// Script para inicializar máquinas padrão no MongoDB
import machineService from '@/services/machineService';

const defaultMachines = [
  {
    name: 'Extrusora Principal',
    code: 'EXT-001',
    status: 'ativa' as const,
    permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas'],
    access_level: 'operador' as const,
    capacity: 1500,
    target_production: 1200
  },
  {
    name: 'Injetora Automática',
    code: 'INJ-002',
    status: 'ativa' as const,
    permissions: ['visualizar_oee', 'editar_producao'],
    access_level: 'operador' as const,
    capacity: 800,
    target_production: 600
  },
  {
    name: 'Linha de Montagem A',
    code: 'LMA-003',
    status: 'manutencao' as const,
    permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas', 'gerenciar_manutencao'],
    access_level: 'supervisor' as const,
    capacity: 2000,
    target_production: 1800
  },
  {
    name: 'Prensa Hidráulica',
    code: 'PRH-004',
    status: 'ativa' as const,
    permissions: ['visualizar_oee', 'editar_producao'],
    access_level: 'operador' as const,
    capacity: 500,
    target_production: 400
  },
  {
    name: 'Centro de Usinagem CNC',
    code: 'CNC-005',
    status: 'parada' as const,
    permissions: ['visualizar_oee', 'editar_producao', 'visualizar_alertas', 'configurar_parametros'],
    access_level: 'supervisor' as const,
    capacity: 300,
    target_production: 250
  }
];

export async function initializeMachines() {
  try {
    console.log('🔄 Inicializando máquinas padrão...');
    
    // Verificar se API está disponível
    const isApiAvailable = await machineService.isApiAvailable();
    
    if (!isApiAvailable) {
      console.log('❌ API MongoDB não disponível. Não é possível inicializar máquinas.');
      return { success: false, message: 'API não disponível' };
    }
    
    const results = [];
    
    for (const machineData of defaultMachines) {
      try {
        // Verificar se máquina já existe
        const existingMachines = await machineService.getMachines({ search: machineData.code });
        const exists = existingMachines.machines.some(m => m.code === machineData.code);
        
        if (exists) {
          results.push({ 
            code: machineData.code, 
            name: machineData.name,
            status: 'já existe' 
          });
          continue;
        }
        
        // Criar máquina
        const newMachine = await machineService.createMachine(machineData);
        
        results.push({ 
          code: newMachine.code, 
          name: newMachine.name,
          status: 'criada',
          id: newMachine.id
        });
        
        console.log(`✅ Máquina criada: ${newMachine.name} (${newMachine.code})`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar máquina ${machineData.name}:`, error);
        results.push({ 
          code: machineData.code, 
          name: machineData.name,
          status: 'erro', 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    console.log('✅ Inicialização de máquinas concluída');
    console.table(results);
    
    return { 
      success: true, 
      results,
      summary: {
        total: defaultMachines.length,
        created: results.filter(r => r.status === 'criada').length,
        existing: results.filter(r => r.status === 'já existe').length,
        errors: results.filter(r => r.status === 'erro').length
      }
    };
    
  } catch (error) {
    console.error('❌ Erro na inicialização de máquinas:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  // Disponibilizar globalmente para debug
  (window as any).initializeMachines = initializeMachines;
}

export default initializeMachines;