import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type SectionHeaderProps = {
  title: string;
  /** Contador ao lado do título (ex.: "3"). */
  count?: number;
  /** Conteúdo à direita: texto, link, badge... */
  right?: ReactNode;
};

export function SectionHeader({ title, count, right }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {count != null && (
          <View style={styles.count}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>
      {typeof right === 'string' ? <Text style={styles.rightText}>{right}</Text> : right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  count: {
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  rightText: {
    color: colors.muted,
    fontSize: 13,
  },
});
