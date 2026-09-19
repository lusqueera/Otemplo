import type { WeekDay } from '@/components/week-strip';

export const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Índice do dia da semana com segunda = 0. */
export function weekdayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

/** Segunda-feira 00:00 da semana de `date`, deslocada `offset` semanas. */
export function startOfWeek(offset = 0, date = new Date()) {
  const monday = addDays(date, -weekdayIndex(date) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** Chave estável de uma semana (ISO da segunda-feira). */
export function weekKey(offset = 0) {
  return toISO(startOfWeek(offset));
}

/** Número da semana ISO 8601. */
export function isoWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
}

export type WeekInfo = {
  key: string;
  offset: number;
  number: number;
  /** Mês da quinta-feira (regra ISO para a semana "pertencer" a um mês). */
  monthName: string;
  /** "16 — 22 Out" ou "30 Set — 6 Out" quando cruza o mês. */
  rangeLabel: string;
  days: (WeekDay & { iso: string })[];
  /** Índice de hoje dentro da semana, ou -1 se não for a semana atual. */
  todayIndex: number;
};

export function weekInfo(offset = 0): WeekInfo {
  const monday = startOfWeek(offset);
  const sunday = addDays(monday, 6);
  const thursday = addDays(monday, 3);
  const days = DAY_LABELS.map((label, i) => {
    const d = addDays(monday, i);
    return { label, day: d.getDate(), iso: toISO(d) };
  });
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const rangeLabel = sameMonth
    ? `${monday.getDate()} — ${sunday.getDate()} ${MONTH_SHORT[sunday.getMonth()]}`
    : `${monday.getDate()} ${MONTH_SHORT[monday.getMonth()]} — ${sunday.getDate()} ${MONTH_SHORT[sunday.getMonth()]}`;
  return {
    key: toISO(monday),
    offset,
    number: isoWeekNumber(thursday),
    monthName: MONTH_NAMES[thursday.getMonth()],
    rangeLabel,
    days,
    todayIndex: offset === 0 ? weekdayIndex(new Date()) : -1,
  };
}

export type MonthInfo = {
  /** "YYYY-MM" */
  key: string;
  offset: number;
  year: number;
  month: number;
  label: string;
};

export function monthInfo(offset = 0): MonthInfo {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return {
    key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    offset,
    year: d.getFullYear(),
    month: d.getMonth(),
    label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
  };
}

export type PeriodFilter = 'month' | 'quarter' | 'year' | 'overview';

/** Verifica se uma data ISO cai no período: mês/trimestre/ano relativos ao mês `offset`, ou tudo. */
export function inPeriod(iso: string, offset: number, filter: PeriodFilter) {
  if (filter === 'overview') return true;
  const ref = monthInfo(offset);
  const [y, m] = iso.split('-').map(Number);
  const index = y * 12 + (m - 1);
  const refIndex = ref.year * 12 + ref.month;
  if (filter === 'month') return index === refIndex;
  if (filter === 'quarter') return index <= refIndex && index > refIndex - 3;
  return y === ref.year;
}

/** ISO de `n` dias atrás — útil para seeds relativos a hoje. */
export function daysAgo(n: number) {
  return toISO(addDays(new Date(), -n));
}

/** Sete `false`, para inicializar uma semana. */
export const emptyWeek = () => [false, false, false, false, false, false, false];
