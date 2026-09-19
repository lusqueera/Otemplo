import { create } from 'zustand';

import type { PeriodFilter } from '@/lib/week';

// Só estado de UI (mês e filtro de período). Lançamentos, resumo e alocação
// vêm do servidor já filtrados (src/api/finance.ts).

type FinanceState = {
  /** Mês de referência: 0 = atual, -1 = anterior. */
  monthOffset: number;
  period: PeriodFilter;

  shiftMonth: (delta: number) => void;
  setPeriod: (period: PeriodFilter) => void;
  reset: () => void;
};

export const useFinanceStore = create<FinanceState>((set) => ({
  monthOffset: 0,
  period: 'month',

  shiftMonth: (delta) => set((s) => ({ monthOffset: Math.min(0, s.monthOffset + delta) })),
  setPeriod: (period) => set({ period }),
  reset: () => set({ monthOffset: 0, period: 'month' }),
}));
