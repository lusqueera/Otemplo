// Tipos e padrões das preferências do perfil. Os dados vivem no servidor:
// leitura com `useProfile()` e escrita com `useUpdateProfile()` (src/api/auth.ts).

/** Metas semanais dos quatro pilares. */
export type WeeklyGoals = {
  studyHours: number;
  workouts: number;
  /** Consistência mínima de hábitos, em %. */
  habitsConsistency: number;
  /** Aporte mensal em investimentos, em R$. */
  monthlySavings: number;
  /** Teto mensal de despesas, em R$. */
  expenseCeiling: number;
};

export type QuoteCurator = 'stoic' | 'renaissance' | 'eastern' | 'modern';

export const CURATOR_LABEL: Record<QuoteCurator, string> = {
  stoic: 'Estoica',
  renaissance: 'Renascentista',
  eastern: 'Oriental',
  modern: 'Contemporânea',
};

export type QuotePreferences = {
  enabled: boolean;
  curators: QuoteCurator[];
  /** Horário da citação diária ("HH:MM"). */
  time: string;
};

export type CircadianPreferences = {
  wakeTime: string;
  bedTime: string;
  /** Lembrete de desaceleração antes de dormir, em minutos (0 = desligado). */
  windDownMinutes: number;
  blueLightFilter: boolean;
  /** Alertas de luz: reduzir brilho ao anoitecer. */
  dimAtDusk: boolean;
  habitReminders: boolean;
};

/** Meta diária de estudo a partir da meta semanal (horas/7, uma casa). */
export const dailyStudyGoal = (goals: WeeklyGoals) => Math.round((goals.studyHours / 7) * 10) / 10;

/** Usado enquanto o perfil ainda não carregou (mesmos defaults do backend). */
export const PROFILE_DEFAULTS = {
  goals: { studyHours: 25, workouts: 5, habitsConsistency: 85, monthlySavings: 5000, expenseCeiling: 8500 } satisfies WeeklyGoals,
  quotes: { enabled: true, curators: ['stoic', 'renaissance'] as QuoteCurator[], time: '07:00' } satisfies QuotePreferences,
  circadian: {
    wakeTime: '06:00',
    bedTime: '22:30',
    windDownMinutes: 30,
    blueLightFilter: true,
    dimAtDusk: true,
    habitReminders: true,
  } satisfies CircadianPreferences,
};
