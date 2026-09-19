import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { stale } from '@/lib/query-client';
import { api, apiList } from '@/lib/api';
import type { PeriodFilter } from '@/lib/week';
import { ALLOCATION_TONES, type AssetClass, type Transaction } from '@/screens/finance/data';
import { keys } from './keys';
import { invalidate } from './invalidate';
import { compact, dec, num } from './mappers';

// ---- Lançamentos (filtrados no servidor por período/offset)

type ApiTransaction = Omit<Transaction, 'amount'> & { amount: string };

const toTransaction = (t: ApiTransaction): Transaction => ({ ...t, amount: num(t.amount) });

export type TransactionInput = Omit<Transaction, 'id'>;

const fromTransaction = (i: Partial<TransactionInput>) =>
  compact({
    title: i.title,
    category: i.category,
    kind: i.kind,
    amount: i.amount === undefined ? undefined : dec(i.amount),
    date: i.date,
    icon: i.icon,
  });

export function useTransactions(period: PeriodFilter, offset: number, enabled = true) {
  return useQuery({
    enabled,
    queryKey: keys.finance.transactions(period, offset),
    queryFn: async () => (await apiList<ApiTransaction>('/api/finance/transactions/', { period, offset })).map(toTransaction),
  });
}

export type FinanceSummary = {
  income: number;
  expenses: number;
  net: number;
  essential: number;
  investment: number;
  lifestyle: number;
  totalAllocation: number;
};

export function useFinanceSummary(period: PeriodFilter, offset: number) {
  return useQuery({
    queryKey: keys.finance.summary(period, offset),
    staleTime: stale.stats,
    queryFn: async () => {
      const s = await api<Record<keyof FinanceSummary, string>>(`/api/finance/transactions/summary/?period=${period}&offset=${offset}`);
      return {
        income: num(s.income),
        expenses: num(s.expenses),
        net: num(s.net),
        essential: num(s.essential),
        investment: num(s.investment),
        lifestyle: num(s.lifestyle),
        totalAllocation: num(s.totalAllocation),
      } satisfies FinanceSummary;
    },
  });
}

function useTransactionMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate(qc, 'finance') });
}

export function useCreateTransaction() {
  return useTransactionMutation(async (input: TransactionInput) =>
    toTransaction(await api<ApiTransaction>('/api/finance/transactions/', { method: 'POST', body: fromTransaction(input) })),
  );
}

export function useUpdateTransaction() {
  return useTransactionMutation(async ({ id, ...input }: { id: string } & Partial<TransactionInput>) =>
    toTransaction(await api<ApiTransaction>(`/api/finance/transactions/${id}/`, { method: 'PATCH', body: fromTransaction(input) })),
  );
}

export function useDeleteTransaction() {
  return useTransactionMutation((id: string) => api<void>(`/api/finance/transactions/${id}/`, { method: 'DELETE' }));
}

// ---- Alocação (tons são visuais: maior classe = mais claro)

type ApiAssetClass = { id: string; name: string; amount: string };

export type AssetClassInput = Omit<AssetClass, 'id' | 'tone'>;

const withTones = (list: ApiAssetClass[]): AssetClass[] =>
  list
    .map((a) => ({ id: a.id, name: a.name, amount: num(a.amount) }))
    .sort((a, b) => b.amount - a.amount)
    .map((a, i) => ({ ...a, tone: ALLOCATION_TONES[Math.min(i, ALLOCATION_TONES.length - 1)] }));

export function useAllocation() {
  return useQuery({
    queryKey: keys.finance.allocation,
    staleTime: stale.catalog,
    queryFn: async () => withTones(await apiList<ApiAssetClass>('/api/finance/allocation/')),
  });
}

function useAllocationMutation<TVars>(fn: (vars: TVars) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      // Alocação muda patrimônio, resumo, stats e a série de evolução
      invalidate(qc, 'finance');
    },
  });
}

export function useCreateAssetClass() {
  return useAllocationMutation((input: AssetClassInput) =>
    api('/api/finance/allocation/', { method: 'POST', body: { name: input.name, amount: dec(input.amount) } }),
  );
}

export function useUpdateAssetClass() {
  return useAllocationMutation(({ id, ...input }: { id: string } & Partial<AssetClassInput>) =>
    api(`/api/finance/allocation/${id}/`, {
      method: 'PATCH',
      body: compact({ name: input.name, amount: input.amount === undefined ? undefined : dec(input.amount) }),
    }),
  );
}

export function useDeleteAssetClass() {
  return useAllocationMutation((id: string) => api<void>(`/api/finance/allocation/${id}/`, { method: 'DELETE' }));
}
