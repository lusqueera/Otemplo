import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Tokens JWT persistidos entre aberturas do app. No web o SecureStore não existe: usa localStorage.

const ACCESS = 'atelier.access';
const REFRESH = 'atelier.refresh';

export type TokenPair = { access: string; refresh: string };

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    try {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } catch {
      // storage indisponível (modo privado) — segue só em memória
    }
    return;
  }
  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

export const tokenStorage = {
  async load(): Promise<TokenPair | null> {
    const [access, refresh] = await Promise.all([getItem(ACCESS), getItem(REFRESH)]);
    return access && refresh ? { access, refresh } : null;
  },
  async save(pair: TokenPair) {
    await Promise.all([setItem(ACCESS, pair.access), setItem(REFRESH, pair.refresh)]);
  },
  async clear() {
    await Promise.all([setItem(ACCESS, null), setItem(REFRESH, null)]);
  },
};
