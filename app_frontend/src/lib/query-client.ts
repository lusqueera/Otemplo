import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { MutationCache, QueryClient, type Query } from '@tanstack/react-query';
import Constants from 'expo-constants';

import { errorMessage, notify } from '@/lib/notify';

/**
 * Política de cache
 *
 * 1. Memória (React Query) + disco (AsyncStorage / localStorage na web): o app abre
 *    mostrando a última resposta conhecida e revalida em segundo plano (stale-while-revalidate).
 * 2. Frescor por tipo de dado (`stale.*`): catálogos mudam pouco, séries/estatísticas mudam
 *    a cada lançamento. Dentro do `staleTime` a leitura vem do cache sem rede.
 * 3. Invalidação por domínio (src/api/invalidate.ts): toda escrita derruba o domínio inteiro
 *    (`['study']`, `['habits']`…) — queries ativas refazem na hora, inativas ficam marcadas e
 *    refazem ao montar. Assim listas, KPIs e séries derivadas nunca divergem entre si.
 * 4. Sessão: login, logout, troca de conta e refresh expirado zeram memória e disco (`resetCache`).
 */

const MINUTE = 60 * 1000;

/** `staleTime` por natureza do dado. */
export const stale = {
  /** Catálogos editados pelo usuário: matérias, treinos, alocação, perfil. */
  catalog: 5 * MINUTE,
  /** Registros do dia/semana: hábitos, horas, cronograma, lançamentos. */
  live: 1 * MINUTE,
  /** Agregados calculados no servidor: stats, séries, resumos. */
  stats: 2 * MINUTE,
} as const;

/** Quanto tempo um dado fica restaurável do disco sem ser revalidado. */
export const PERSIST_MAX_AGE = 24 * 60 * MINUTE;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: stale.live,
      // Precisa ser ≥ PERSIST_MAX_AGE, senão o dado é coletado antes de poder ser persistido
      gcTime: PERSIST_MAX_AGE,
      retry: 1,
      // Sem rede, entrega o cache e só marca erro quando a revalidação falhar
      networkMode: 'offlineFirst',
      refetchOnReconnect: true,
      refetchOnWindowFocus: true,
    },
    mutations: {
      networkMode: 'online',
    },
  },
  // Toda mutation que falhar avisa o usuário, a menos que a chamada tenha o próprio onError
  // ou declare `meta: { silent: true }` (telas que mostram o erro inline, como login/registro)
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.options.onError || mutation.meta?.silent) return;
      notify('Não foi possível salvar', errorMessage(error));
    },
  }),
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'atelier-query-cache',
  // Agrupa escritas: várias queries resolvendo juntas geram um único write no disco
  throttleTime: 1000,
});

/** Muda a cada versão do app: um cache gravado por um schema antigo é descartado, não migrado. */
export const persistBuster = `v${Constants.expoConfig?.version ?? '0'}`;

/** Só respostas completas vão para o disco; erros e carregamentos pendentes não. */
export function shouldDehydrateQuery(query: Query) {
  return query.state.status === 'success' && query.meta?.persist !== false;
}

/** Zera memória e disco — usado em login, logout, exclusão de conta e refresh expirado. */
export async function resetCache() {
  queryClient.clear();
  await persister.removeClient();
}
