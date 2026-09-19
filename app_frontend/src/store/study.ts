import { create } from 'zustand';

import { toISO, weekdayIndex } from '@/lib/week';
import { DEFAULT_CYCLE_MINUTES, DEFAULT_TOTAL_CYCLES } from '@/screens/study/data';

// Só estado de UI: semana/dia exibidos e o cronômetro de foco.
// Matérias, cronograma, flashcards e horas vêm do servidor (src/api/study.ts).

export type Session = {
  subjectId: string;
  cycleSeconds: number;
  remainingSeconds: number;
  currentCycle: number;
  totalCycles: number;
  running: boolean;
};

export type SessionOptions = {
  cycleMinutes?: number;
  totalCycles?: number;
};

/** Tempo a registrar no servidor quando um ciclo termina. */
export type Elapsed = { subjectId: string; seconds: number };

type StudyState = {
  session: Session | null;
  /** Semana exibida no cronograma: 0 = atual. */
  weekOffset: number;
  selectedDay: number;

  selectDay: (index: number) => void;
  shiftWeek: (delta: number) => void;

  // Sessão de foco — começa sempre pausada
  startSession: (subjectId: string, options?: SessionOptions) => void;
  toggleSession: () => void;
  /** Encerra a sessão; devolve o tempo decorrido do ciclo atual para registrar via API. */
  stopSession: () => Elapsed | null;
  /** Avança um ciclo (ou encerra no último); devolve o tempo decorrido a registrar. */
  skipCycle: () => Elapsed | null;
  /** Um segundo do cronômetro; devolve tempo a registrar quando um ciclo fecha sozinho. */
  tick: () => Elapsed | null;
  reset: () => void;
};

/** ISO de hoje — usado como padrão de data dos blocos. */
export const todayKey = () => toISO(new Date());

function elapsedOf(session: Session): Elapsed | null {
  const seconds = session.cycleSeconds - session.remainingSeconds;
  return seconds > 0 ? { subjectId: session.subjectId, seconds } : null;
}

export const useStudyStore = create<StudyState>((set, get) => ({
  session: null,
  weekOffset: 0,
  selectedDay: weekdayIndex(new Date()),

  selectDay: (index) => set({ selectedDay: index }),
  shiftWeek: (delta) =>
    set((s) => {
      const weekOffset = s.weekOffset + delta;
      return { weekOffset, selectedDay: weekOffset === 0 ? weekdayIndex(new Date()) : s.selectedDay };
    }),

  startSession: (subjectId, options = {}) => {
    const cycleSeconds = (options.cycleMinutes ?? DEFAULT_CYCLE_MINUTES) * 60;
    set({
      session: {
        subjectId,
        cycleSeconds,
        remainingSeconds: cycleSeconds,
        currentCycle: 1,
        totalCycles: options.totalCycles ?? DEFAULT_TOTAL_CYCLES,
        running: false,
      },
    });
  },
  toggleSession: () =>
    set((s) => (s.session ? { session: { ...s.session, running: !s.session.running } } : {})),
  stopSession: () => {
    const { session } = get();
    if (!session) return null;
    set({ session: null });
    return elapsedOf(session);
  },
  skipCycle: () => {
    const { session } = get();
    if (!session) return null;
    const elapsed = elapsedOf(session);
    if (session.currentCycle >= session.totalCycles) {
      set({ session: null });
    } else {
      set({
        session: {
          ...session,
          currentCycle: session.currentCycle + 1,
          remainingSeconds: session.cycleSeconds,
          running: false,
        },
      });
    }
    return elapsed;
  },
  tick: () => {
    const { session } = get();
    if (!session || !session.running) return null;
    if (session.remainingSeconds <= 1) {
      // Ciclo terminou: conta o ciclo inteiro e avança pausado (ou encerra no último)
      set({ session: { ...session, remainingSeconds: 0 } });
      return get().skipCycle();
    }
    set({ session: { ...session, remainingSeconds: session.remainingSeconds - 1 } });
    return null;
  },
  reset: () => set({ session: null, weekOffset: 0, selectedDay: weekdayIndex(new Date()) }),
}));
