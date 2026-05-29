export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDatePtBR(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('pt-BR', options);
}

export function formatDateTimePtBR(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  return date.toLocaleString('pt-BR');
}
