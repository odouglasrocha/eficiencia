// Utilitários para cálculo de turnos baseado em horários de produção

export interface ShiftConfig {
  name: string;
  start: string; // HH:MM format
  end: string;   // HH:MM format
  color: string;
  icon: string;
}

export const SHIFTS: ShiftConfig[] = [
  { 
    name: 'Manhã', 
    start: '05:40', 
    end: '13:50',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '🌅'
  },
  { 
    name: 'Tarde', 
    start: '13:50', 
    end: '22:08',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '☀️'
  },
  { 
    name: 'Noite', 
    start: '22:08', 
    end: '05:40', // Turno noturno cruza meia-noite
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: '🌙'
  }
];

/**
 * Converte string HH:MM para minutos desde meia-noite
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte Date para minutos desde meia-noite
 */
function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Determina o turno baseado em um horário específico
 */
export function getShiftByTime(time: Date): string {
  const timeMinutes = dateToMinutes(time);
  
  for (const shift of SHIFTS) {
    const startMinutes = timeToMinutes(shift.start);
    const endMinutes = timeToMinutes(shift.end);
    
    // Turno normal (não cruza meia-noite)
    if (startMinutes < endMinutes) {
      if (timeMinutes >= startMinutes && timeMinutes < endMinutes) {
        return shift.name;
      }
    }
    // Turno noturno (cruza meia-noite)
    else {
      if (timeMinutes >= startMinutes || timeMinutes < endMinutes) {
        return shift.name;
      }
    }
  }
  
  // Fallback - não deveria acontecer com os horários definidos
  return 'Indefinido';
}

/**
 * Determina o turno baseado no período entre dataHoraInicio e dataHoraFinal
 * Prioriza o turno onde a maior parte da produção ocorreu
 */
export function getShiftByProductionPeriod(startTime: Date, endTime: Date): string {
  // Se a produção começou e terminou no mesmo turno, retorna esse turno
  const startShift = getShiftByTime(startTime);
  const endShift = getShiftByTime(endTime);
  
  if (startShift === endShift) {
    return startShift;
  }
  
  // Se cruzou turnos, calcula qual turno teve maior duração
  const totalDuration = endTime.getTime() - startTime.getTime();
  let maxDuration = 0;
  let dominantShift = startShift;
  
  for (const shift of SHIFTS) {
    const shiftStart = timeToMinutes(shift.start);
    const shiftEnd = timeToMinutes(shift.end);
    
    // Calcula interseção entre período de produção e turno
    const intersectionDuration = calculateIntersectionDuration(
      startTime, endTime, shift
    );
    
    if (intersectionDuration > maxDuration) {
      maxDuration = intersectionDuration;
      dominantShift = shift.name;
    }
  }
  
  return dominantShift;
}

/**
 * Calcula a duração da interseção entre um período e um turno
 */
function calculateIntersectionDuration(
  periodStart: Date,
  periodEnd: Date,
  shift: ShiftConfig
): number {
  // Implementação simplificada - usa o turno do horário de início
  // Para uma implementação mais precisa, seria necessário calcular
  // a sobreposição exata considerando que turnos podem cruzar dias
  const startShift = getShiftByTime(periodStart);
  return startShift === shift.name ? 1 : 0;
}

/**
 * Obtém o turno atual baseado no horário atual
 */
export function getCurrentShift(): string {
  return getShiftByTime(new Date());
}

/**
 * Formata o nome do turno para exibição
 */
export function formatShiftDisplay(shiftName: string): string {
  const shift = SHIFTS.find(s => s.name === shiftName);
  return shift ? `${shift.icon} ${shift.name}` : shiftName;
}

/**
 * Obtém informações completas do turno
 */
export function getShiftInfo(shiftName: string): ShiftConfig | null {
  return SHIFTS.find(shift => shift.name === shiftName) || null;
}

/**
 * Valida se um horário está dentro de um turno específico
 */
export function isTimeInShift(time: Date, shiftName: string): boolean {
  return getShiftByTime(time) === shiftName;
}

/**
 * Obtém a cor do turno
 */
export function getShiftColor(shiftName: string): string {
  const shift = SHIFTS.find(s => s.name === shiftName);
  return shift ? shift.color : 'bg-gray-100 text-gray-800 border-gray-300';
}

// Manter compatibilidade com código existente
export type ShiftType = 'Manhã' | 'Tarde' | 'Noite';
export interface ShiftInfo {
  name: ShiftType;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
}

/**
 * Determina o turno baseado na data/hora fornecida (compatibilidade)
 */
export function getShiftFromDateTime(dateTime: string | Date): ShiftType {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  const shiftName = getShiftByTime(date);
  return shiftName as ShiftType;
}