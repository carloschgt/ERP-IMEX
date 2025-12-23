
/**
 * Lógica de tempo útil para IMEX Solutions
 */

export const getHolidays = (): string[] => {
  const saved = localStorage.getItem('imex_holidays');
  return saved ? JSON.parse(saved) : [];
};

export const isHoliday = (date: Date, holidays: string[]): boolean => {
  const iso = date.toISOString().split('T')[0];
  return holidays.includes(iso);
};

export const isBusinessDay = (date: Date, holidays: string[]): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6 && !isHoliday(date, holidays);
};

/**
 * Calcula a diferença em horas úteis entre duas datas (base 08:00 - 18:00 ou corrido em dias úteis)
 * Para IMEX, usaremos "corrido em dias úteis" conforme solicitado (24h por dia útil).
 */
export const businessHoursBetween = (start: Date, end: Date, holidays: string[]): number => {
  let count = 0;
  let current = new Date(start.getTime());

  while (current < end) {
    if (isBusinessDay(current, holidays)) {
      count++;
    }
    current.setHours(current.getHours() + 1);
  }
  return count;
};

/**
 * Adiciona horas úteis a uma data
 */
export const addBusinessHours = (startDate: Date, hours: number, holidays: string[]): Date => {
  let current = new Date(startDate.getTime());
  let added = 0;
  
  while (added < hours) {
    current.setHours(current.getHours() + 1);
    if (isBusinessDay(current, holidays)) {
      added++;
    }
  }
  return current;
};

/**
 * Formata duração legível
 */
export const formatDuration = (hours: number): string => {
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return `${days}d ${rem}h`;
};

/**
 * Busca inteligente com Wildcard
 */
export const matchWithWildcardPrefix = (value: string, pattern: string): boolean => {
  if (pattern === '*' || pattern === '') return true;
  const cleanPattern = pattern.replace('*', '').toUpperCase();
  if (pattern.endsWith('*')) {
    return value.toUpperCase().startsWith(cleanPattern);
  }
  return value.toUpperCase().includes(cleanPattern);
};
