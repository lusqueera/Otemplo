import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, apiList } from '@/lib/api';
import { notify } from '@/lib/notify';
import { toISO, weekKey } from '@/lib/week';
import type { Habit } from '@/screens/habits/data';
import { keys } from './keys';
import type { HabitsStats } from './stats';
import { invalidate } from './invalidate';
import { compact, hhmmOrUndefined } from './mappers';

type ApiHabit = Omit<Habit, 'scheduledAt' | 'quantity'> & {
  scheduledAt: string | null;
  quantity: { current: number; target: number; step: number; unit: string } | null;
};

const toHabit = (h: ApiHabit): Habit => ({
  ...h,
  scheduledAt: hhmmOrUndefined(h.scheduledAt),
  // Sem `target` não é hábito quantitativo: a tela usaria números nulos e quebraria
  quantity: h.quantity && h.quantity.target ? h.quantity : undefined,
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
    onSuccess: () => invalidate(qc, 'habits'),
  });
}

export function useUpdateHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, clearQuantity = false, ...input }: { id: string; clearQuantity?: boolean } & Partial<HabitInput>) =>
      toHabit(await api<ApiHabit>(`/api/habits/${id}/`, { method: 'PATCH', body: fromHabit(input, clearQuantity) })),
    onSuccess: () => invalidate(qc, 'habits'),
  });
}

export function useDeleteHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/habits/${id}/`, { method: 'DELETE' }),
    onSuccess: () => invalidate(qc, 'habits'),
  });
}


/** Mesma faixa do servidor: 0 nada · 1 < 50% · 2 < 100% · 3 tudo feito. */
const densityLevel = (done: number, total: number) => {
  const ratio = total ? done / total : 0;
  return ratio === 0 ? 0 : ratio < 0.5 ? 1 : ratio < 1 ? 2 : 3;
};

/**
 * Recalcula a célula do dia tocado em cada `['habits','stats',days]` em cache a partir da
 * lista otimista (mais antigo primeiro; último = hoje). Devolve os snapshots para rollback.
 */
function patchDensity(qc: ReturnType<typeof useQueryClient>, habits: Habit[], week: string, day: number, date: string) {
  const daysAgo = Math.round((Date.parse(`${todayISO()}T12:00:00`) - Date.parse(`${date}T12:00:00`)) / 86_400_000);
  if (daysAgo < 0) return [];
  const done = habits.filter((h) => h.weekly[week]?.[day]).length;
  const snapshots: [readonly unknown[], HabitsStats][] = [];
  for (const q of qc.getQueryCache().findAll({ queryKey: ['habits', 'stats'] })) {
    const data = q.state.data as HabitsStats | undefined;
    if (!data) continue;
    const idx = data.density.length - 1 - daysAgo;
    if (idx < 0) continue;
    snapshots.push([q.queryKey, data]);
    const density = [...data.density];
    density[idx] = densityLevel(done, habits.length);
    qc.setQueryData(q.queryKey, { ...data, density });
  }
  return snapshots;
}

type DayInput = { id: string; date: string; week: string };

/** Índice Seg..Dom (0-6) de uma data ISO, igual ao `weekly` do servidor. */
const todayISO = () => toISO(new Date());
const weekdayOf = (iso: string) => (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;

/**
 * Otimismo com rollback: aplica a mudança no cache antes da resposta (o toque responde na
 * hora), guarda o snapshot e restaura se a API falhar. No sucesso a resposta do servidor
 * substitui o item e o domínio é revalidado (streak/consistência/densidade dependem disso).
 */
function useOptimisticDay(path: 'toggle' | 'increment', apply: (habit: Habit, day: number) => Habit) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, date, week }: DayInput) =>
      toHabit(await api<ApiHabit>(`/api/habits/${id}/${path}/?week=${week}`, { method: 'POST', body: { date } })),
    onMutate: async ({ id, date, week }) => {
      const key = keys.habits.list(week);
      await qc.cancelQueries({ queryKey: ['habits'] });
      const previous = qc.getQueryData<Habit[]>(key);
      const day = weekdayOf(date);
      const next = previous?.map((h) => (h.id === id ? apply(h, day) : h));
      qc.setQueryData<Habit[]>(key, next);
      // A matriz de densidade também reflete o toque na hora; o servidor confirma no refetch
      const previousStats = next ? patchDensity(qc, next, week, day, date) : [];
      return { previous, key, previousStats };
    },
    onError: (_error, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(ctx.key, ctx.previous);
      for (const [key, data] of ctx?.previousStats ?? []) qc.setQueryData(key, data);
      notify('Não foi possível salvar', 'Verifique a conexão e tente novamente.');
    },
    onSuccess: (habit, { week }) => {
      qc.setQueryData<Habit[]>(keys.habits.list(week), (list) => list?.map((h) => (h.id === habit.id ? habit : h)));
    },
    onSettled: () => invalidate(qc, 'habits'),
  });
}

/** Marca/desmarca o hábito num dia (ISO); a resposta traz `weekly` da semana desse dia. */
export function useToggleHabit() {
  return useOptimisticDay('toggle', (h, day) => {
    const week = Object.keys(h.weekly)[0];
    if (!week) return h;
    const days = [...h.weekly[week]];
    days[day] = !days[day];
    return { ...h, weekly: { [week]: days } };
  });
}

/** Soma `step` ao hábito quantitativo; ao bater a meta o dia fica marcado. */
export function useIncrementHabit() {
  return useOptimisticDay('increment', (h, day) => {
    if (!h.quantity) return h;
    const current = Math.min(h.quantity.target, h.quantity.current + h.quantity.step);
    const week = Object.keys(h.weekly)[0];
    const weekly = week ? { [week]: h.weekly[week].map((v, i) => (i === day ? current >= h.quantity!.target : v)) } : h.weekly;
    return { ...h, quantity: { ...h.quantity, current }, weekly };
  });
}
