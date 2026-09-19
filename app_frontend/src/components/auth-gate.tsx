import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { useMe } from '@/api/auth';
import { session } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/colors';

/**
 * Restaura a sessão salva ao abrir o app e redireciona: sem sessão → login;
 * com sessão numa tela pública → tabs. Também trata refresh expirado.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments() as string[];
  const qc = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const markSignedOut = useAuthStore((s) => s.markSignedOut);
  const [hydrated, setHydrated] = useState(false);

  // 1. Tokens do storage → memória
  useEffect(() => {
    session.hydrate().then((tokens) => {
      if (!tokens) markSignedOut();
      setHydrated(true);
    });
  }, [markSignedOut]);

  // 2. Com tokens, busca /me (também valida o access; em 401 o client renova)
  const hasTokens = hydrated && !!session.tokens;
  const me = useMe(hasTokens && status !== 'signedIn');
  useEffect(() => {
    if (me.isError) {
      session.clear().then(markSignedOut);
    }
  }, [me.isError, markSignedOut]);

  // 3. Refresh expirado em qualquer chamada → volta para o login
  useEffect(() => {
    session.onExpired(() => {
      qc.clear();
      markSignedOut();
    });
    return () => session.onExpired(null);
  }, [qc, markSignedOut]);

  // 4. Redirecionamento por status
  const inAuthScreen = segments[0] === 'screens' && (segments[1] === 'login' || segments[1] === 'register');
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'signedOut' && !inAuthScreen) router.replace('/screens/login');
    if (status === 'signedIn' && inAuthScreen) router.replace('/(tabs)');
  }, [status, inAuthScreen, router]);

  if (status === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
