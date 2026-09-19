import { create } from 'zustand';

import { weekdayIndex } from '@/lib/week';
import type { Exercise } from '@/screens/training/data';

// Só estado de UI: semana/dia, treino selecionado para hoje e o cronômetro da sessão.
// Treinos, exercícios e dias treinados vêm do servidor (src/api/training.ts).

export type ActiveSession = {
  workoutId: string;
  /** Segundos decorridos desde o início. */
  elapsedSeconds: number;
};

type TrainingState = {
  /** Treino selecionado para hoje (null = primeiro da lista). */
  todayWorkoutId: string | null;
  /** Semana exibida: 0 = atual. */
  weekOffset: number;
  selectedDay: number;
  session: ActiveSession | null;

  selectDay: (index: number) => void;
  shiftWeek: (delta: number) => void;
  selectWorkout: (id: string | null) => void;

  startSession: (workoutId: string) => void;
  /** Encerra o cronômetro; devolve a sessão para registrar via API. */
  finishSession: () => ActiveSession | null;
  cancelSession: () => void;
  tick: () => void;
  reset: () => void;
};

export const useTrainingStore = create<TrainingState>((set, get) => ({
  todayWorkoutId: null,
  weekOffset: 0,
  selectedDay: weekdayIndex(new Date()),
  session: null,

  selectDay: (index) => set({ selectedDay: index }),
  shiftWeek: (delta) =>
    set((s) => {
      const weekOffset = s.weekOffset + delta;
      return { weekOffset, selectedDay: weekOffset === 0 ? weekdayIndex(new Date()) : s.selectedDay };
    }),
  selectWorkout: (id) => set({ todayWorkoutId: id }),

  startSession: (workoutId) => set({ session: { workoutId, elapsedSeconds: 0 } }),
  finishSession: () => {
    const { session } = get();
    set({ session: null });
    return session;
  },
  cancelSession: () => set({ session: null }),
  tick: () =>
    set((s) =>
      s.session ? { session: { ...s.session, elapsedSeconds: s.session.elapsedSeconds + 1 } } : {},
    ),
  reset: () => set({ todayWorkoutId: null, weekOffset: 0, selectedDay: weekdayIndex(new Date()), session: null }),
}));

// Derivações puras (mesma fórmula do backend)
export const estimateDurationMinutes = (exercises: Exercise[], restSeconds: number) =>
  exercises.reduce((acc, e) => acc + e.sets * (0.75 + restSeconds / 60), 0);

/** Volume previsto em kg: séries × reps estimadas × carga. */
export const estimateVolumeKg = (exercises: Exercise[]) =>
  exercises.reduce((acc, e) => {
    const reps = Number(e.reps.match(/\d+/)?.[0] ?? 0);
    return acc + e.sets * reps * e.load;
  }, 0);
