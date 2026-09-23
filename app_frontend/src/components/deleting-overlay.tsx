import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

/**
 * Véu sobre o próprio card enquanto a exclusão está no servidor: o item continua visível
 * (some só quando a API confirma), mas fica claro que já está saindo e não aceita toques.
 *
 * Uso: o card precisa de `position: relative` (padrão no React Native) e este overlay como
 * último filho, para cobrir o conteúdo.
 */
export function DeletingOverlay({ label = 'Excluindo…', radius = 16 }: { label?: string; radius?: number }) {
  return (
    <View style={[styles.overlay, { borderRadius: radius }]}>
      <ActivityIndicator size="small" color={colors.text} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.78)',
    zIndex: 10,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
