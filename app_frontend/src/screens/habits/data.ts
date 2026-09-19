// Tipos e constantes da tela de hábitos. Os dados vêm da API (src/api/habits.ts);
// a semana/dia exibidos ficam em src/store/habits.ts.

export type HabitGroup = 'morning' | 'focus' | 'body' | 'night';

export const GROUP_LABEL: Record<HabitGroup, string> = {
  morning: 'Manhã',
  focus: 'Foco & Estudo',
  body: 'Corpo & Saúde',
  night: 'Noturno',
};

export const HABIT_ICONS = [
  'book-open-variant',
  'meditation',
  'water-outline',
  'arm-flex-outline',
  'layers-outline',
  'weather-night',
  'notebook-edit-outline',
  'run',
  'food-apple-outline',
  'music-note-outline',
  'brush',
  'heart-outline',
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];

export type Habit = {
  id: string;
  title: string;
  category: string;
  group: HabitGroup;
  goal: string;
  icon: HabitIcon;
  /** Sequência atual em dias. */
  streak: number;
  /** Horário agendado ("HH:MM"), opcional. */
  scheduledAt?: string;
  /** Execução por dia (Seg..Dom), indexada pela chave da semana (ISO da segunda). */
  weekly: Record<string, boolean[]>;
  /** Hábito quantitativo (ex.: hidratação): progresso parcial do dia. */
  quantity?: { current: number; target: number; step: number; unit: string };
};

/** Intensidade 0–3 por dia, nos últimos 30 dias (3 linhas × 10 colunas). */
export const quote = {
  text: '"Somos o que repetidamente fazemos. A excelência, portanto, não é um ato, mas um hábito."',
  author: '— Aristóteles',
};
