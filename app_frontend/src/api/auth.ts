import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, session } from '@/lib/api';
import { errorMessage, notify } from '@/lib/notify';
import { resetCache, stale } from '@/lib/query-client';
import { useAuthStore, type User } from '@/store/auth';
import type { CircadianPreferences, QuotePreferences, WeeklyGoals } from '@/store/profile';
import { invalidate } from './invalidate';
import { keys } from './keys';
import { compact, dec, hhmm, num } from './mappers';

// ---- Usuário

type ApiUser = { id: string; email: string; name: string; title: string; avatar: string | null; createdAt: string };

const toUser = (u: ApiUser): User => ({
  id: u.id,
  email: u.email,
  name: u.name,
  title: u.title || undefined,
  avatarUri: u.avatar ?? undefined,
});

type TokenResponse = { user: ApiUser; access: string; refresh: string };

/**
 * Entra com a sessão nova. O cache é zerado ANTES de marcar o usuário: com `setUser` a Home
 * monta e dispara as queries; um `clear()` depois disso apagaria os resultados debaixo dos
 * observers e o dashboard ficaria zerado até o próximo refetch.
 */
async function acceptSession(user: User, tokens: { access: string; refresh: string }) {
  await session.set(tokens);
  await resetCache();
  useAuthStore.getState().setUser(user);
  return user;
}

export function useLogin() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      // SimpleJWT devolve só os tokens; o usuário vem de /me
      const pair = await api<{ access: string; refresh: string }>('/api/auth/token/', { method: 'POST', body: input, auth: false });
      await session.set(pair);
      const me = await api<ApiUser>('/api/auth/me/');
      return acceptSession(toUser(me), pair);
    },
    meta: { silent: true },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: { email: string; password: string; name: string; title?: string }) => {
      const data = await api<TokenResponse>('/api/auth/register/', { method: 'POST', body: input, auth: false });
      return acceptSession(toUser(data.user), { access: data.access, refresh: data.refresh });
    },
    meta: { silent: true },
  });
}

export function useLogout() {
  return useMutation({
    onMutate: () => useAuthStore.getState().markSigningOut(),
    mutationFn: async () => {
      const refresh = session.tokens?.refresh;
      // Melhor esforço: invalida o refresh no servidor, mas a sessão local sempre é encerrada
      if (refresh) await api('/api/auth/logout/', { method: 'POST', body: { refresh } }).catch(() => undefined);
      await session.clear();
      useAuthStore.getState().setUser(null);
    },
    onSettled: () => resetCache(),
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: keys.me,
    staleTime: stale.catalog,
    queryFn: async () => {
      const user = toUser(await api<ApiUser>('/api/auth/me/'));
      useAuthStore.getState().setUser(user);
      return user;
    },
    enabled,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name?: string; title?: string }) =>
      toUser(await api<ApiUser>('/api/auth/me/', { method: 'PATCH', body: compact(input) })),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      qc.setQueryData(keys.me, user);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      api<void>('/api/auth/me/password/', { method: 'POST', body: input }),
  });
}

/** Envia a foto em base64 (data URI ou puro); o backend grava o arquivo e devolve a URL. */
export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (image: string) => (await api<{ avatar: string }>('/api/auth/me/avatar/', { method: 'PUT', body: { image } })).avatar,
    onSuccess: (avatar) => {
      useAuthStore.getState().updateUser({ avatarUri: avatar });
      invalidate(qc, 'me');
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('/api/auth/me/avatar/', { method: 'DELETE' }),
    onSuccess: () => {
      useAuthStore.getState().updateUser({ avatarUri: undefined });
      invalidate(qc, 'me');
    },
  });
}

/** Exclusão de conta: apaga o usuário e todos os dados no servidor. */
export function useDeleteAccount() {
  return useMutation({
    onMutate: () => useAuthStore.getState().markSigningOut(),
    mutationFn: async () => {
      await api<void>('/api/auth/me/', { method: 'DELETE' });
      await session.clear();
      useAuthStore.getState().setUser(null);
    },
    // Falhou (sem rede, etc.): a sessão continua válida, volta para a tela
    onError: (error) => {
      useAuthStore.getState().setUser(useAuthStore.getState().user);
      notify('Não foi possível excluir a conta', errorMessage(error));
    },
    onSettled: () => resetCache(),
  });
}

// ---- Perfil (metas, citações, circadiano) — a API é plana; o app usa três grupos

type ApiProfile = {
  studyHours: number;
  workouts: number;
  habitsConsistency: number;
  monthlySavings: string;
  expenseCeiling: string;
  quotesEnabled: boolean;
  quoteCurators: QuotePreferences['curators'];
  quoteTime: string;
  wakeTime: string;
  bedTime: string;
  windDownMinutes: number;
  blueLightFilter: boolean;
  dimAtDusk: boolean;
  habitReminders: boolean;
};

export type Profile = { goals: WeeklyGoals; quotes: QuotePreferences; circadian: CircadianPreferences };

const toProfile = (p: ApiProfile): Profile => ({
  goals: {
    studyHours: p.studyHours,
    workouts: p.workouts,
    habitsConsistency: p.habitsConsistency,
    monthlySavings: num(p.monthlySavings),
    expenseCeiling: num(p.expenseCeiling),
  },
  quotes: { enabled: p.quotesEnabled, curators: p.quoteCurators, time: hhmm(p.quoteTime) },
  circadian: {
    wakeTime: hhmm(p.wakeTime),
    bedTime: hhmm(p.bedTime),
    windDownMinutes: p.windDownMinutes,
    blueLightFilter: p.blueLightFilter,
    dimAtDusk: p.dimAtDusk,
    habitReminders: p.habitReminders,
  },
});

export type ProfilePatch = {
  goals?: Partial<WeeklyGoals>;
  quotes?: Partial<QuotePreferences>;
  circadian?: Partial<CircadianPreferences>;
};

const fromProfilePatch = ({ goals = {}, quotes = {}, circadian = {} }: ProfilePatch) =>
  compact({
    studyHours: goals.studyHours,
    workouts: goals.workouts,
    habitsConsistency: goals.habitsConsistency,
    monthlySavings: goals.monthlySavings === undefined ? undefined : dec(goals.monthlySavings),
    expenseCeiling: goals.expenseCeiling === undefined ? undefined : dec(goals.expenseCeiling),
    quotesEnabled: quotes.enabled,
    quoteCurators: quotes.curators,
    quoteTime: quotes.time,
    wakeTime: circadian.wakeTime,
    bedTime: circadian.bedTime,
    windDownMinutes: circadian.windDownMinutes,
    blueLightFilter: circadian.blueLightFilter,
    dimAtDusk: circadian.dimAtDusk,
    habitReminders: circadian.habitReminders,
  });

export function useProfile() {
  return useQuery({
    queryKey: keys.profile,
    staleTime: stale.catalog,
    queryFn: async () => toProfile(await api<ApiProfile>('/api/auth/me/profile/')),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProfilePatch) =>
      toProfile(await api<ApiProfile>('/api/auth/me/profile/', { method: 'PATCH', body: fromProfilePatch(patch) })),
    onSuccess: (profile) => {
      qc.setQueryData(keys.profile, profile);
      // Metas alimentam os KPIs de todos os domínios
      invalidate(qc, 'profile');
    },
  });
}
