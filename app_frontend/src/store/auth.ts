import { create } from 'zustand';

// Estado de sessão em memória. Tokens ficam em src/lib/api.ts (session) + storage seguro;
// login/registro/logout são mutations em src/api/auth.ts.

export type User = { id: string; name: string; email: string; title?: string; avatarUri?: string };

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

type AuthState = {
  user: User | null;
  status: AuthStatus;
  setUser: (user: User | null) => void;
  updateUser: (input: Partial<Omit<User, 'id'>>) => void;
  /** Marca o fim da hidratação inicial sem sessão. */
  markSignedOut: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user, status: user ? 'signedIn' : 'signedOut' }),
  updateUser: (input) => set((s) => (s.user ? { user: { ...s.user, ...input } } : {})),
  markSignedOut: () => set({ user: null, status: 'signedOut' }),
}));
