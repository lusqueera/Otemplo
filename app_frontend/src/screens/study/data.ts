// Tipos e constantes da tela de estudo. Os dados vêm da API (src/api/study.ts);
// o cronômetro e a semana exibida ficam em src/store/study.ts.

export type Priority = 'normal' | 'high' | 'review';

export type Subject = {
  id: string;
  title: string;
  module: string;
  description: string;
  priority: Priority;
  /** Horas estudadas e meta, usadas para o progresso. */
  hoursDone: number;
  hoursGoal: number;
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  normal: 'Em andamento',
  high: 'Alta prioridade',
  review: 'Revisão hoje',
};

export type ScheduleStatus = 'done' | 'next' | 'pending';

export type ScheduleBlock = {
  id: string;
  /** Dia do bloco (ISO YYYY-MM-DD). */
  date: string;
  start: string;
  end: string;
  status: ScheduleStatus;
  title: string;
  description: string;
};

export type Flashcard = {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  /** Pendente de revisão hoje. */
  due: boolean;
  hits: number;
  misses: number;
};

export type Metric = {
  id: string;
  label: string;
  icon: 'circle-half-full' | 'fire' | 'layers-outline' | 'head-cog-outline';
  value: string;
  unit?: string;
  hint?: string;
  /** Entre 0 e 1; exibe barra de progresso quando definido. */
  progress?: number;
};

// Métrica ainda estática (sequência) — as demais são derivadas do store
export const memoryBank = {
  version: 'v2.4',
  title: 'Banco de Memorização',
};

export const CYCLE_OPTIONS = [25, 50, 90] as const;
export const DEFAULT_CYCLE_MINUTES = 50;
export const DEFAULT_TOTAL_CYCLES = 4;

export const quote =
  '"A profundidade do pensamento exige a disciplina do silêncio e repetição intencional."';
