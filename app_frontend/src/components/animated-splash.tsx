import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import * as SplashScreen from 'expo-splash-screen';

import { Logo } from '@/components/logo';
import { colors } from '@/theme/colors';

// Mantém a splash nativa visível até o React montar; a partir daí este componente assume
SplashScreen.preventAutoHideAsync().catch(() => {});

type AnimatedSplashProps = {
  children: ReactNode;
  /** Tempo mínimo com a marca em tela, em ms. */
  minDuration?: number;
};

/**
 * Splash animada: substitui a splash nativa (mesmo fundo e logo, sem "pulo"),
 * anima a marca e faz o fade para o app.
 */
export function AnimatedSplash({ children, minDuration = 1400 }: AnimatedSplashProps) {
  const [done, setDone] = useState(false);
  const overlay = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const wordmark = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // A splash nativa some assim que o overlay (idêntico) está na tela
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(wordmark, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      ]),
      Animated.delay(Math.max(0, minDuration - 900)),
      Animated.timing(overlay, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]).start(() => setDone(true));
  }, [glow, minDuration, overlay, scale, wordmark]);

  return (
    <>
      {children}
      {!done && (
        <Animated.View style={[styles.overlay, { opacity: overlay }]} pointerEvents="none">
          <Animated.View style={[styles.glow, { opacity: glow }]} />
          <Animated.View style={{ transform: [{ scale }] }}>
            <Logo size={96} />
          </Animated.View>
          <Animated.View style={[styles.wordmark, { opacity: wordmark }]}>
            <Text style={styles.title}>Atelier Noir</Text>
            <Text style={styles.subtitle}>Disciplina • Foco • Capital</Text>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  wordmark: {
    position: 'absolute',
    bottom: 72,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
