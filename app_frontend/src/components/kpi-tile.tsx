import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { ProgressBar } from '@/components/progress-bar';
import { colors } from '@/theme/colors';

type KpiTileProps = {
  label: string;
  /** Pill de texto no canto superior direito (ex.: "+4.8% mês"). */
  badge?: string;
  /** Ícone no canto superior direito (usado quando não há badge). */
  icon?: ReactNode;
  value: string;
  unit?: string;
  hint?: string;
  hintIcon?: ReactNode;
  /** Entre 0 e 1; exibe barra de progresso quando definido. */
  progress?: number;
  /** Conteúdo extra abaixo do hint (ex.: bolinhas de sequência). */
  children?: ReactNode;
};

export function KpiTile({
  label,
  badge,
  icon,
  value,
  unit,
  hint,
  hintIcon,
  progress,
  children,
}: KpiTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : (
          icon
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          {unit && <Text style={styles.unit}>{unit}</Text>}
        </View>
        {progress != null && <ProgressBar value={progress} />}
        {hint && (
          <View style={styles.hintRow}>
            {hintIcon}
            <Text style={styles.hint}>{hint}</Text>
          </View>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    minHeight: 124,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  badge: {
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '55%',
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    gap: 8,
    marginTop: 'auto',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexWrap: 'wrap',
  },
  value: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
  },
  unit: {
    color: colors.muted,
    fontSize: 13,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hint: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
