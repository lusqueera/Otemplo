import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { PeriodFilter } from '@/lib/week';
import { num } from './mappers';

// Indicadores calculados no servidor (substituem os números fixos que as telas exibiam).
// As chaves entram sob o prefixo do domínio, então as mutations de cada área já os invalidam.

export type StudyStats = {
  streak: number;
  recordStreak: number;
  weekHours: number;
  lastWeekHours: number;
  weeklyChangePct: number | null;
  historicalDailyAverage: number;
};

export function useStudyStats() {
  return useQuery({
    queryKey: ['study', 'stats'],
    queryFn: async () => {
      const s = await api<Record<keyof StudyStats, string | number | null>>('/api/study/stats/');
      return {
        streak: Number(s.streak),
        recordStreak: Number(s.recordStreak),
        weekHours: num(s.weekHours),
        lastWeekHours: num(s.lastWeekHours),
        weeklyChangePct: s.weeklyChangePct == null ? null : Number(s.weeklyChangePct),
        historicalDailyAverage: num(s.historicalDailyAverage),
      } satisfies StudyStats;
    },
  });
}

export type HabitsStats = {
  weekConsistency: number;
  lastWeekConsistency: number;
  monthConsistency: number;
  lastMonthConsistency: number;
  monthlyChangePct: number | null;
  recordStreak: number;
  /** Intensidade 0–3 por dia, mais antigo primeiro. */
  density: number[];
};

export function useHabitsStats(days = 30) {
  return useQuery({
    queryKey: ['habits', 'stats', days],
    queryFn: () => api<HabitsStats>(`/api/habits/stats/?days=${days}`),
  });
}

export type TrainingStats = {
  weekVolumeKg: number;
  lastWeekVolumeKg: number;
  volumeChangeKg: number;
  weekActiveSeconds: number;
  goalActiveSeconds: number;
  weekSessions: number;
  avgSessionSeconds: number;
};

export function useTrainingStats() {
  return useQuery({
    queryKey: ['training', 'stats'],
    queryFn: async () => {
      const s = await api<Record<keyof TrainingStats, string | number>>('/api/training/stats/');
      return {
        weekVolumeKg: num(s.weekVolumeKg),
        lastWeekVolumeKg: num(s.lastWeekVolumeKg),
        volumeChangeKg: num(s.volumeChangeKg),
        weekActiveSeconds: Number(s.weekActiveSeconds),
        goalActiveSeconds: Number(s.goalActiveSeconds),
        weekSessions: Number(s.weekSessions),
        avgSessionSeconds: Number(s.avgSessionSeconds),
      } satisfies TrainingStats;
    },
  });
}

export type NetWorthPoint = { month: string; netWorth: number };

/** Patrimônio no fim de cada mês (mais antigo primeiro). */
export function useNetWorthEvolution(months = 6) {
  return useQuery({
    queryKey: ['finance', 'evolution', months],
    queryFn: async () =>
      (await api<{ month: string; netWorth: string }[]>(`/api/finance/evolution/?months=${months}`)).map((p) => ({
        month: p.month,
        netWorth: num(p.netWorth),
      })),
  });
}

export type FinanceStats = {
  netWorth: number;
  netWorthChangePct: number | null;
  savingsChangePct: number | null;
  expenseCeiling: number;
};

export function useFinanceStats(period: PeriodFilter = 'month', offset = 0) {
  return useQuery({
    queryKey: ['finance', 'stats', period, offset],
    queryFn: async () => {
      const s = await api<Record<keyof FinanceStats, string | number | null>>(`/api/finance/stats/?period=${period}&offset=${offset}`);
      return {
        netWorth: num(s.netWorth),
        netWorthChangePct: s.netWorthChangePct == null ? null : Number(s.netWorthChangePct),
        savingsChangePct: s.savingsChangePct == null ? null : Number(s.savingsChangePct),
        expenseCeiling: num(s.expenseCeiling),
      } satisfies FinanceStats;
    },
  });
}

// ---- Formatação compartilhada pelas telas

/** "+12,5%" / "-3,0%"; `null` (sem base de comparação) vira "—". */
export function formatPct(value: number | null | undefined, suffix = '') {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%${suffix}`;
}

/** 13500 → "3h 45m"; menos de uma hora → "45m". */
export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** "2026-09" → "Set". */
export const monthLabel = (key: string) => MONTH_SHORT[Number(key.slice(5, 7)) - 1] ?? key;
