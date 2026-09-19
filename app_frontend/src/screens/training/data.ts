// Tipos e constantes da tela de treino. Os dados vêm da API (src/api/training.ts);
// o cronômetro e a semana exibida ficam em src/store/training.ts.

export type ExerciseGroup = 'abc' | 'cardio';

export const GROUP_LABEL: Record<ExerciseGroup, string> = {
  abc: 'Divisão ABC',
  cardio: 'Cardio & Mobilidade',
};

export type Intensity = 'low' | 'moderate' | 'high';

export const INTENSITY_LABEL: Record<Intensity, string> = {
  low: 'Leve',
  moderate: 'Moderada',
  high: 'Alta intensidade',
};

export const EXERCISE_ICONS = [
  'weight-lifter',
  'dumbbell',
  'view-sequential',
  'human-handsup',
  'run',
  'bike',
  'yoga',
  'jump-rope',
] as const;

export type ExerciseIcon = (typeof EXERCISE_ICONS)[number];

export type Exercise = {
  id: string;
  name: string;
  sets: number;
  /** Texto livre: "8–10 reps", "60 seg", "15 min". */
  reps: string;
  /** Carga em kg (0 para peso corporal / cardio). */
  load: number;
  /** Ajuste de carga vs. último treino, em kg (opcional). */
  delta?: number;
  muscle: string;
  group: ExerciseGroup;
  icon: ExerciseIcon;
  done: boolean;
};

export type Workout = {
  id: string;
  title: string;
  description: string;
  /** Horário previsto ("HH:MM"). */
  time: string;
  intensity: Intensity;
  /** Descanso entre séries, em segundos. */
  restSeconds: number;
  exercises: Exercise[];
};

export const quote = {
  text: '"Nenhum homem tem o direito de ser um amador na matéria do treinamento físico."',
  author: '— Sócrates',
};
