// Script para inicializar dados de produção no MongoDB
import connectDB from '@/lib/mongodb';
import ProductionRecord from '@/models/mongoose/ProductionRecord';
import Machine from '@/models/mongoose/Machine';

// Dados iniciais de máquinas
const initialMachines = [
  {
    name: 'Extrusora 01',
    code: 'EXT001',
    status: 'ativa' as const,
    target_production: 1000,
    capacity: 1500,
    current_production: 0,
    oee: 85.5,
    availability: 92.3,
    performance: 88.7,
    quality: 96.2,
    permissions: ['view_production', 'create_production'],
    access_level: 'operador' as const
  },
  {
    name: 'Extrusora 02',
    code: 'EXT002',
    status: 'ativa' as const,
    target_production: 800,
    capacity: 1200,
    current_production: 0,
    oee: 78.2,
    availability: 89.1,
    performance: 85.4,
    quality: 98.1,
    permissions: ['view_production', 'create_production'],
    access_level: 'operador' as const
  },
  {
    name: 'Injetora 01',
    code: 'INJ001',
    status: 'manutencao' as const,
    target_production: 500,
    capacity: 800,
    current_production: 0,
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 100,
    permissions: ['view_production'],
    access_level: 'supervisor' as const
  }
];

// Dados de exemplo de registros de produção
const generateSampleRecords = (machineId: string, days: number = 7) => {
  const records = [];
  const now = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Turno A (06:00 - 14:00)
    const shiftAStart = new Date(date);
    shiftAStart.setHours(6, 0, 0, 0);
    const shiftAEnd = new Date(date);
    shiftAEnd.setHours(14, 0, 0, 0);
    
    records.push({
      machine_id: machineId,
      start_time: shiftAStart,
      end_time: shiftAEnd,
      good_production: Math.floor(Math.random() * 200 + 300), // 300-500
      film_waste: Math.floor(Math.random() * 20 + 5), // 5-25
      organic_waste: Math.floor(Math.random() * 10 + 2), // 2-12
      planned_time: 480, // 8 horas
      downtime_minutes: Math.floor(Math.random() * 60 + 10), // 10-70 min
      downtime_reason: 'Troca de material',
      material_code: 'MAT001',
      shift: 'A',
      operator_id: 'op_001',
      batch_number: `BATCH_${date.toISOString().split('T')[0]}_A`,
      quality_check: Math.random() > 0.1, // 90% passa
      temperature: Math.floor(Math.random() * 20 + 170), // 170-190°C
      pressure: Math.floor(Math.random() * 5 + 20) / 10, // 2.0-2.5 bar
      speed: Math.floor(Math.random() * 50 + 100) // 100-150 rpm
    });
    
    // Turno B (14:00 - 22:00)
    const shiftBStart = new Date(date);
    shiftBStart.setHours(14, 0, 0, 0);
    const shiftBEnd = new Date(date);
    shiftBEnd.setHours(22, 0, 0, 0);
    
    records.push({
      machine_id: machineId,
      start_time: shiftBStart,
      end_time: shiftBEnd,
      good_production: Math.floor(Math.random() * 180 + 280), // 280-460
      film_waste: Math.floor(Math.random() * 15 + 3), // 3-18
      organic_waste: Math.floor(Math.random() * 8 + 1), // 1-9
      planned_time: 480, // 8 horas
      downtime_minutes: Math.floor(Math.random() * 45 + 5), // 5-50 min
      downtime_reason: 'Limpeza programada',
      material_code: 'MAT002',
      shift: 'B',
      operator_id: 'op_002',
      batch_number: `BATCH_${date.toISOString().split('T')[0]}_B`,
      quality_check: Math.random() > 0.05, // 95% passa
      temperature: Math.floor(Math.random() * 15 + 175), // 175-190°C
      pressure: Math.floor(Math.random() * 4 + 22) / 10, // 2.2-2.6 bar
      speed: Math.floor(Math.random() * 40 + 110) // 110-150 rpm
    });
  }
  
  return records;
};

export async function initializeProductionData() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await connectDB();
    
    console.log('🔄 Verificando máquinas existentes...');
    const existingMachines = await Machine.find({});
    
    if (existingMachines.length === 0) {
      console.log('📝 Criando máquinas iniciais...');
      const createdMachines = await Machine.insertMany(initialMachines);
      console.log(`✅ ${createdMachines.length} máquinas criadas`);
      
      // Gerar registros de produção para cada máquina
      for (const machine of createdMachines) {
        if (machine.status === 'ativa') {
          console.log(`📊 Gerando registros para ${machine.name}...`);
          const records = generateSampleRecords(machine._id.toString(), 14); // 14 dias
          
          // Calcular métricas OEE para cada registro
          const recordsWithOEE = records.map(record => {
            const actualRuntime = record.planned_time - record.downtime_minutes;
            const availability = record.planned_time > 0 ? (actualRuntime / record.planned_time) * 100 : 0;
            const performance = machine.target_production > 0 ? (record.good_production / machine.target_production) * 100 : 0;
            const quality = record.quality_check ? 100 : 85;
            const oee = (availability * performance * quality) / 10000;
            
            return {
              ...record,
              availability_calculated: Math.max(0, Math.min(100, availability)),
              performance_calculated: Math.max(0, Math.min(100, performance)),
              quality_calculated: quality,
              oee_calculated: Math.max(0, Math.min(100, oee))
            };
          });
          
          await ProductionRecord.insertMany(recordsWithOEE);
          console.log(`✅ ${recordsWithOEE.length} registros criados para ${machine.name}`);
        }
      }
    } else {
      console.log(`ℹ️ ${existingMachines.length} máquinas já existem no banco`);
    }
    
    // Verificar registros existentes
    const totalRecords = await ProductionRecord.countDocuments();
    console.log(`📊 Total de registros de produção: ${totalRecords}`);
    
    if (totalRecords === 0) {
      console.log('⚠️ Nenhum registro de produção encontrado. Execute a inicialização completa.');
    }
    
    console.log('✅ Inicialização concluída com sucesso!');
    return {
      machines: existingMachines.length,
      records: totalRecords
    };
    
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initializeProductionData()
    .then((result) => {
      console.log('🎉 Inicialização completa:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na inicialização:', error);
      process.exit(1);
    });
}