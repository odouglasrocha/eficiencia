// Script para inicializar registros de produção padrão no MongoDB
import productionRecordService from '@/services/productionRecordService';

const defaultProductionRecords = [
  {
    machineId: '', // Será preenchido dinamicamente
    materialCode: 'MAT001',
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    plannedTime: 120, // 2 horas em minutos
    goodProduction: 950,
    filmWaste: 30,
    organicWaste: 20,
    downtimeEvents: [
      {
        reason: 'Manutenção preventiva',
        duration: 15,
        description: 'Troca de filtros'
      },
      {
        reason: 'Ajuste de parâmetros',
        duration: 10,
        description: 'Calibração de temperatura'
      }
    ],
    shift: 'A',
    operatorId: 'OP001',
    notes: 'Produção normal, sem intercorrências',
    batchNumber: 'LOTE2025001',
    qualityCheck: true,
    temperature: 185.5,
    pressure: 12.3,
    speed: 85.2
  },
  {
    machineId: '', // Será preenchido dinamicamente
    materialCode: 'MAT002',
    startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 horas atrás
    endTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
    plannedTime: 120,
    goodProduction: 1150,
    filmWaste: 45,
    organicWaste: 25,
    downtimeEvents: [
      {
        reason: 'Troca de material',
        duration: 20,
        description: 'Setup para novo lote'
      }
    ],
    shift: 'B',
    operatorId: 'OP002',
    notes: 'Boa produtividade no turno B',
    batchNumber: 'LOTE2025002',
    qualityCheck: true,
    temperature: 190.0,
    pressure: 11.8,
    speed: 92.1
  },
  {
    machineId: '', // Será preenchido dinamicamente
    materialCode: 'MAT003',
    startTime: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
    endTime: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 horas atrás
    plannedTime: 120,
    goodProduction: 800,
    filmWaste: 60,
    organicWaste: 40,
    downtimeEvents: [
      {
        reason: 'Problema técnico',
        duration: 35,
        description: 'Falha no sistema de refrigeração'
      },
      {
        reason: 'Limpeza',
        duration: 15,
        description: 'Limpeza de rotina'
      }
    ],
    shift: 'C',
    operatorId: 'OP003',
    notes: 'Problemas técnicos resolvidos',
    batchNumber: 'LOTE2025003',
    qualityCheck: false,
    temperature: 175.2,
    pressure: 13.1,
    speed: 78.5
  },
  {
    machineId: '', // Será preenchido dinamicamente
    materialCode: 'MAT001',
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 horas atrás
    endTime: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), // 22 horas atrás
    plannedTime: 120,
    goodProduction: 1050,
    filmWaste: 25,
    organicWaste: 15,
    downtimeEvents: [
      {
        reason: 'Pausa programada',
        duration: 10,
        description: 'Intervalo de turno'
      }
    ],
    shift: 'A',
    operatorId: 'OP001',
    notes: 'Excelente performance',
    batchNumber: 'LOTE2025004',
    qualityCheck: true,
    temperature: 188.7,
    pressure: 12.0,
    speed: 89.3
  },
  {
    machineId: '', // Será preenchido dinamicamente
    materialCode: 'MAT002',
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 horas atrás
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 horas atrás
    plannedTime: 120,
    goodProduction: 920,
    filmWaste: 35,
    organicWaste: 30,
    downtimeEvents: [
      {
        reason: 'Ajuste de qualidade',
        duration: 25,
        description: 'Correção de parâmetros de extrusão'
      }
    ],
    shift: 'B',
    operatorId: 'OP002',
    notes: 'Ajustes realizados com sucesso',
    batchNumber: 'LOTE2025005',
    qualityCheck: true,
    temperature: 192.1,
    pressure: 11.5,
    speed: 87.8
  }
];

export async function initializeProductionRecords() {
  try {
    console.log('🔄 Inicializando registros de produção padrão...');
    
    // Verificar se API está disponível
    const isApiAvailable = await productionRecordService.isApiAvailable();
    
    if (!isApiAvailable) {
      console.log('❌ API MongoDB não disponível. Não é possível inicializar registros.');
      return { success: false, message: 'API não disponível' };
    }
    
    // Buscar máquinas disponíveis para associar aos registros
    const machinesResponse = await fetch('http://localhost:3001/api/machines');
    if (!machinesResponse.ok) {
      throw new Error('Não foi possível buscar máquinas');
    }
    
    const machinesData = await machinesResponse.json();
    const machines = machinesData.machines || [];
    
    if (machines.length === 0) {
      console.log('⚠️ Nenhuma máquina encontrada. Inicialize as máquinas primeiro.');
      return { success: false, message: 'Nenhuma máquina disponível' };
    }
    
    const results = [];
    
    for (let i = 0; i < defaultProductionRecords.length; i++) {
      const recordData = { ...defaultProductionRecords[i] };
      
      // Associar máquina (rotacionar entre as disponíveis)
      const machineIndex = i % machines.length;
      recordData.machineId = machines[machineIndex]._id;
      
      try {
        // Verificar se já existe registro similar (mesmo lote)
        const existingRecords = await productionRecordService.getProductionRecords({
          batch_number: recordData.batchNumber,
          limit: 1
        });
        
        if (existingRecords.records.length > 0) {
          results.push({ 
            batchNumber: recordData.batchNumber,
            machine: machines[machineIndex].name,
            status: 'já existe' 
          });
          continue;
        }
        
        // Criar registro de produção
        const newRecord = await productionRecordService.createProductionRecord(recordData);
        
        results.push({ 
          batchNumber: recordData.batchNumber,
          machine: machines[machineIndex].name,
          status: 'criado',
          id: newRecord._id,
          oee: newRecord.oee_calculated?.toFixed(1) + '%'
        });
        
        console.log(`✅ Registro criado: ${recordData.batchNumber} - ${machines[machineIndex].name}`);
        
      } catch (error) {
        console.error(`❌ Erro ao criar registro ${recordData.batchNumber}:`, error);
        results.push({ 
          batchNumber: recordData.batchNumber,
          machine: machines[machineIndex].name,
          status: 'erro', 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
    
    console.log('✅ Inicialização de registros de produção concluída');
    console.table(results);
    
    return { 
      success: true, 
      results,
      summary: {
        total: defaultProductionRecords.length,
        created: results.filter(r => r.status === 'criado').length,
        existing: results.filter(r => r.status === 'já existe').length,
        errors: results.filter(r => r.status === 'erro').length
      }
    };
    
  } catch (error) {
    console.error('❌ Erro na inicialização de registros de produção:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  }
}

// Executar se chamado diretamente
if (typeof window !== 'undefined') {
  // Disponibilizar globalmente para debug
  (window as any).initializeProductionRecords = initializeProductionRecords;
}

export default initializeProductionRecords;