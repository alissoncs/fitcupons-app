const MONTHS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThat = new Date(date);
  startOfThat.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);

  if (dayDiff === 1) return 'ontem';
  if (dayDiff < 7) return `há ${dayDiff} dias`;

  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export function formatExpiresIn(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const ms = date.getTime() - Date.now();
  if (ms <= 0) return 'Expirada';
  const hours = Math.ceil(ms / 3_600_000);
  if (hours < 24) return hours <= 1 ? 'Acaba em 1 hora' : `Acaba em ${hours} horas`;
  const days = Math.ceil(hours / 24);
  return days === 1 ? 'Acaba em 1 dia' : `Acaba em ${days} dias`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

export function startOfDayKey(iso: string): string {
  const date = new Date(iso);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function dayGroupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(date);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  return date.toLocaleDateString('pt-BR');
}
