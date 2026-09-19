import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, apiList } from '@/lib/api';
import { weekKey } from '@/lib/week';
import type { Habit } from '@/screens/habits/data';
import { keys } from './keys';
import { compact, hhmmOrUndefined } from './mappers';

type ApiHabit = Omit<Habit, 'scheduledAt' | 'quantity'> & {
  scheduledAt: string | null;
  quantity: { current: number; target: number; step: number; unit: string } | null;
};

const toHabit = (h: ApiHabit): Habit => ({
  ...h,
  scheduledAt: hhmmOrUndefined(h.scheduledAt),
  quantity: h.quantity ?? undefined,
});

export type HabitInput = Omit<Habit, 'id' | 'streak' | 'weekly'>;

const fromHabit = (i: Partial<HabitInput>, clearQuantity: boolean) =>
  compact({
    title: i.title,
    category: i.category,
    group: i.group,
    goal: i.goal,
    icon: i.icon,
    scheduledAt: i.scheduledAt === undefined ? undefined : i.scheduledAt || null,
    // `current` é do servidor; enviar só target/step/unit
    quantity: clearQuantity
      ? null
      : i.quantity && { target: i.quantity.target, step: i.quantity.step, unit: i.quantity.unit },
  });

/** Hábitos com `weekly` da semana pedida (chave ISO da segunda). */
export function useHabits(week: string = weekKey(0)) {
  return useQuery({
    queryKey: keys.habits.list(week),
    queryFn: async () => (await apiList<ApiHabit>('/api/habits/', { week })).map(toHabit),
  });
}

export function useCreateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: HabitInput) => toHabit(await api<ApiHabit>('/api/habits/', { method: 'POST', body: fromHabit(input, false) })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits.all }),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clearQuantity = false, ...input }: { id: string; clearQuantity?: boolean } & Partial<HabitInput>) =>
      toHabit(await api<ApiHabit>(`/api/habits/${id}/`, { method: 'PATCH', body: fromHabit(input, clearQuantity) })),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits.all }),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/habits/${id}/`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.habits.all }),
  });
}

/** Marca/desmarca o hábito num dia (ISO); a resposta traz `weekly` da semana desse dia. */
export function useToggleHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, week }: { id: string; date: string; week: string }) =>
      toHabit(await api<ApiHabit>(`/api/habits/${id}/toggle/?week=${week}`, { method: 'POST', body: { date } })),
    onSuccess: (habit, { week }) => {
      qc.setQueryData<Habit[]>(keys.habits.list(week), (list) => list?.map((h) => (h.id === habit.id ? habit : h)));
      // Outras semanas em cache podem ter mudado de streak
      qc.invalidateQueries({ queryKey: keys.habits.all, refetchType: 'none' });
    },
  });
}

export function useIncrementHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, week }: { id: string; date: string; week: string }) =>
      toHabit(await api<ApiHabit>(`/api/habits/${id}/increment/?week=${week}`, { method: 'POST', body: { date } })),
    onSuccess: (habit, { week }) =>
      qc.setQueryData<Habit[]>(keys.habits.list(week), (list) => list?.map((h) => (h.id === habit.id ? habit : h))),
  });
}
