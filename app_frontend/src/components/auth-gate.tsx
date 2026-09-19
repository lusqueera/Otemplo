import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter, useSegments } from 'expo-router';

import { useMe } from '@/api/auth';
import { session } from '@/lib/api';
import { resetCache } from '@/lib/query-client';
import { useAuthStore } from '@/store/auth';
import { Logo } from '@/components/logo';
import { colors } from '@/theme/colors';

/**
 * Restaura a sessão salva ao abrir o app e redireciona: sem sessão → login;
 * com sessão numa tela pública → tabs. Também trata refresh expirado.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const segments = useSegments() as string[];
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
  const me = useMe(hasTokens && status === 'loading');
  useEffect(() => {
    if (me.isError) {
      session.clear().then(markSignedOut);
    }
  }, [me.isError, markSignedOut]);

  // 3. Refresh expirado em qualquer chamada → volta para o login
  useEffect(() => {
    session.onExpired(() => {
      void resetCache();
      markSignedOut();
    });
    return () => session.onExpired(null);
  }, [markSignedOut]);

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

  // Encerrando sessão: cobre a tela desde o toque em "Sair" até o login aparecer,
  // para o perfil não piscar vazio enquanto tokens e cache são apagados.
  const leaving = status === 'signingOut' || (status === 'signedOut' && !inAuthScreen);
  return (
    <>
      {children}
      {leaving && (
        <View style={styles.leaving}>
          <Logo size={56} />
          <ActivityIndicator color={colors.text} style={styles.leavingSpinner} />
          <Text style={styles.leavingText}>Encerrando sessão…</Text>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  leaving: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    zIndex: 100,
  },
  leavingSpinner: {
    marginTop: 28,
  },
  leavingText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
