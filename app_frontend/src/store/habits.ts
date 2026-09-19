import { create } from 'zustand';

import { emptyWeek, weekdayIndex } from '@/lib/week';
import type { Habit } from '@/screens/habits/data';

// Só estado de UI (semana/dia exibidos). Hábitos e execuções vêm do servidor (src/api/habits.ts).

type HabitsState = {
  /** Semana exibida: 0 = atual, -1 = anterior, +1 = próxima. */
  weekOffset: number;
  /** Dia da semana selecionado na faixa (0 = Seg). */
  selectedDay: number;

  selectDay: (index: number) => void;
  shiftWeek: (delta: number) => void;
  reset: () => void;
};

/** Execuções de um hábito numa semana (sete posições, mesmo sem registro). */
export function weeklyOf(habit: Habit, key: string) {
  return habit.weekly[key] ?? emptyWeek();
}

/** Hábito concluído no dia `day` da semana `key`. */
export const isDoneOn = (habit: Habit, key: string, day: number) => weeklyOf(habit, key)[day] ?? false;

export const useHabitsStore = create<HabitsState>((set) => ({
  weekOffset: 0,
  selectedDay: weekdayIndex(new Date()),

  selectDay: (index) => set({ selectedDay: index }),
  shiftWeek: (delta) =>
    set((s) => {
      const weekOffset = s.weekOffset + delta;
      // Ao voltar para a semana atual, o dia selecionado volta a ser hoje
      return { weekOffset, selectedDay: weekOffset === 0 ? weekdayIndex(new Date()) : s.selectedDay };
    }),
  reset: () => set({ weekOffset: 0, selectedDay: weekdayIndex(new Date()) }),
}));
