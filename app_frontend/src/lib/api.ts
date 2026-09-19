import { tokenStorage, type TokenPair } from './token-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Corpo de erro do DRF, quando JSON ({ campo: [mensagens] } ou { detail }). */
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Primeira mensagem legível do erro, para exibir na UI. */
  get userMessage() {
    const b = this.body as Record<string, unknown> | undefined;
    if (!b || typeof b !== 'object') return this.message;
    if (typeof b.detail === 'string') return b.detail;
    for (const value of Object.values(b)) {
      if (typeof value === 'string') return value;
      if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    }
    return this.message;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; auth?: boolean };

// ---- Sessão de tokens (memória + storage seguro)

let tokens: TokenPair | null = null;
let refreshing: Promise<TokenPair | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export const session = {
  get tokens() {
    return tokens;
  },
  async hydrate() {
    tokens = await tokenStorage.load();
    return tokens;
  },
  async set(pair: TokenPair) {
    tokens = pair;
    await tokenStorage.save(pair);
  },
  async clear() {
    tokens = null;
    await tokenStorage.clear();
  },
  /** Chamado quando o refresh falha (refresh expirado/revogado). */
  onExpired(handler: (() => void) | null) {
    onSessionExpired = handler;
  },
};

async function refreshTokens(): Promise<TokenPair | null> {
  if (!tokens) return null;
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: tokens?.refresh }),
        });
        if (!res.ok) return null;
        // ROTATE_REFRESH_TOKENS: o backend devolve um refresh novo
        const data = (await res.json()) as { access: string; refresh?: string };
        const pair = { access: data.access, refresh: data.refresh ?? tokens!.refresh };
        await session.set(pair);
        return pair;
      } catch {
        return null;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

async function parseBody(response: Response) {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Chamada à API com JWT. Em 401 tenta renovar o access uma vez; se o refresh falhar,
 * limpa a sessão e dispara `session.onExpired`.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const doFetch = (access?: string) =>
    fetch(`${API_URL}${path}`, {
      ...rest,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(auth && access ? { Authorization: `Bearer ${access}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await doFetch(tokens?.access);

  if (response.status === 401 && auth && tokens) {
    const renewed = await refreshTokens();
    if (renewed) {
      response = await doFetch(renewed.access);
    } else {
      await session.clear();
      onSessionExpired?.();
    }
  }

  const data = await parseBody(response);
  if (!response.ok) {
    const message = typeof data === 'string' && data ? data : response.statusText || `HTTP ${response.status}`;
    throw new ApiError(response.status, message, data);
  }
  return data as T;
}

/** Resposta paginada do DRF. */
export type Page<T> = { count: number; next: string | null; previous: string | null; results: T[] };

/** Lista completa (o app carrega tudo de uma vez; `page_size` máximo do backend). */
export async function apiList<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams({ page_size: '500' });
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') query.set(k, String(v));
  const page = await api<Page<T>>(`${path}?${query.toString()}`);
  return page.results;
}
