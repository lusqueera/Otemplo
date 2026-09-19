// Chaves do React Query. Invalidação por prefixo: `keys.study.all` derruba tudo de estudo.

export const keys = {
  me: ['me'] as const,
  profile: ['profile'] as const,
  study: {
    all: ['study'] as const,
    subjects: ['study', 'subjects'] as const,
    schedule: (week: string) => ['study', 'schedule', week] as const,
    flashcards: ['study', 'flashcards'] as const,
    hours: (week: string) => ['study', 'hours', week] as const,
  },
  habits: {
    all: ['habits'] as const,
    list: (week: string) => ['habits', 'list', week] as const,
  },
  training: {
    all: ['training'] as const,
    workouts: ['training', 'workouts'] as const,
    week: (week: string) => ['training', 'week', week] as const,
    tonnage: ['training', 'tonnage'] as const,
  },
  finance: {
    all: ['finance'] as const,
    transactions: (period: string, offset: number) => ['finance', 'transactions', period, offset] as const,
    summary: (period: string, offset: number) => ['finance', 'summary', period, offset] as const,
    allocation: ['finance', 'allocation'] as const,
  },
};
