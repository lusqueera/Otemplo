import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type QuoteCardProps = {
  text: string;
  author?: string;
  /** Ícone centralizado acima da citação. */
  icon?: ReactNode;
  /** `card` com fundo; `plain` apenas o texto centralizado. */
  variant?: 'card' | 'plain';
};

export function QuoteCard({ text, author, icon, variant = 'card' }: QuoteCardProps) {
  return (
    <View style={[styles.container, variant === 'card' && styles.card]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.text}>{text}</Text>
      {author && <Text style={styles.author}>{author}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  text: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  author: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
