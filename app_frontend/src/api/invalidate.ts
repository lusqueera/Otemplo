import type { QueryClient } from '@tanstack/react-query';

import { keys } from './keys';

/**
 * Grafo de invalidação: o que cada escrita afeta.
 *
 * Toda mutation invalida o *domínio* inteiro em vez de chaves pontuais — uma escrita em
 * hábitos muda a lista, a sequência, a consistência e a densidade ao mesmo tempo, e derrubar
 * só a lista deixaria os KPIs da Home defasados. O custo é um refetch a mais nas queries
 * ativas; a garantia é que tela, KPIs e séries sempre saem do mesmo estado do servidor.
 *
 * Dependências cruzadas:
 * - `profile` (metas) alimenta os KPIs de todos os domínios → derruba os `stats` de todos.
 * - `me` (nome/foto) não afeta dados de domínio.
 */
export type Domain = 'study' | 'habits' | 'training' | 'finance' | 'profile' | 'me';

const AFFECTS: Record<Domain, readonly (readonly string[])[]> = {
  study: [keys.study.all],
  habits: [keys.habits.all],
  training: [keys.training.all],
  finance: [keys.finance.all],
  profile: [keys.profile, ['study', 'stats'], ['habits', 'stats'], ['training', 'stats'], ['finance', 'stats']],
  me: [keys.me],
};

/** Invalida tudo que depende dos domínios informados (ativas refazem já; inativas ao montar). */
export function invalidate(qc: QueryClient, ...domains: Domain[]) {
  const seen = new Set<string>();
  for (const domain of domains) {
    for (const queryKey of AFFECTS[domain]) {
      const id = queryKey.join('/');
      if (seen.has(id)) continue;
      seen.add(id);
      void qc.invalidateQueries({ queryKey });
    }
  }
}
