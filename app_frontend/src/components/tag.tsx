import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type TagProps = {
  label: string;
  /** `filled` inverte as cores (fundo claro, texto escuro) para destaque. */
  variant?: 'default' | 'filled';
};

export function Tag({ label, variant = 'default' }: TagProps) {
  const filled = variant === 'filled';
  return (
    <View style={[styles.tag, filled && styles.tagFilled]}>
      <Text style={[styles.label, filled && styles.labelFilled]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagFilled: {
    backgroundColor: colors.muted,
  },
  label: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  labelFilled: {
    color: colors.buttonText,
  },
});
