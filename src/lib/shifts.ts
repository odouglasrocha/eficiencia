// Utilitário para gerenciamento de turnos
export type ShiftType = 'Manhã' | 'Tarde' | 'Noite';

export interface ShiftInfo {
  name: ShiftType;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
}

// Definição dos turnos
export const SHIFTS: Record<ShiftType, ShiftInfo> = {
  'Manhã': {
    name: 'Manhã',
    startTime: '05:40',
    endTime: '13:50',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '🌅'
  },
  'Tarde': {
    name: 'Tarde', 
    startTime: '13:50',
    endTime: '22:08',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '☀️'
  },
  'Noite': {
    name: 'Noite',
    startTime: '22:08', 
    endTime: '05:40',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🌙'
  }
};

/**
 * Determina o turno baseado na data/hora fornecida
 * @param dateTime - Data e hora no formato ISO string ou Date object
 * @returns O turno correspondente
 */
export function getShiftFromDateTime(dateTime: string | Date): ShiftType {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  
  // Obter horário do Brasil usando Intl API mais confiável
  const brasilTime = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(date);
  
  const hours = parseInt(brasilTime.find(part => part.type === 'hour')?.value || '0');
  const minutes = parseInt(brasilTime.find(part => part.type === 'minute')?.value || '0');
  
  // Converter para minutos desde meia-noite para facilitar comparação
  const totalMinutes = hours * 60 + minutes;
  
  // Turno Manhã: 05:40 às 13:50 (340 min a 830 min)
  const morningStart = 5 * 60 + 40; // 340 min
  const morningEnd = 13 * 60 + 50;   // 830 min
  
  // Turno Tarde: 13:50 às 22:08 (830 min a 1328 min)  
  const afternoonStart = 13 * 60 + 50; // 830 min
  const afternoonEnd = 22 * 60 + 8;    // 1328 min
  
  // Turno Noite: 22:08 às 05:40 (cruza meia-noite)
  const nightStart = 22 * 60 + 8; // 1328 min
  const nightEnd = 5 * 60 + 40;   // 340 min (próximo dia)
  
  let shift: ShiftType;
  
  if (totalMinutes >= morningStart && totalMinutes < afternoonStart) {
    shift = 'Manhã';
  } else if (totalMinutes >= afternoonStart && totalMinutes < nightStart) {
    shift = 'Tarde';
  } else {
    // Turno noite: 22:08 às 05:40 do dia seguinte (inclui tudo antes de 05:40 e depois de 22:08)
    shift = 'Noite';
  }
  
  return shift;
}

/**
 * Formata o turno para exibição com ícone e nome
 */
export function formatShiftDisplay(shift: ShiftType): string {
  const shiftInfo = SHIFTS[shift];
  return `${shiftInfo.icon} ${shiftInfo.name}`;
}

/**
 * Obtém as informações completas do turno
 */
export function getShiftInfo(shift: ShiftType): ShiftInfo {
  return SHIFTS[shift];
}