import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { ChipRow } from '@/components/chip-row';
import { monthInfo, type PeriodFilter } from '@/lib/week';
import { colors } from '@/theme/colors';
import { PERIOD_FILTERS } from '../data';

type PeriodCardProps = {
  monthOffset: number;
  period: PeriodFilter;
  onShiftMonth: (delta: number) => void;
  onPeriodChange: (period: PeriodFilter) => void;
};

const PERIOD_CAPTION: Record<PeriodFilter, string> = {
  month: 'Exercício\nmensal',
  quarter: 'Trimestre\nencerrado',
  year: 'Exercício\nanual',
  overview: 'Histórico\nconsolidado',
};

export function PeriodCard({ monthOffset, period, onShiftMonth, onPeriodChange }: PeriodCardProps) {
  const month = monthInfo(monthOffset);
  const label = period === 'overview' ? 'Todo o período' : period === 'year' ? String(month.year) : month.label;
  const canGoForward = monthOffset < 0 && period !== 'overview';
  const canGoBack = period !== 'overview';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.month}>
          <Pressable
            style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
            onPress={() => onShiftMonth(-1)}
            disabled={!canGoBack}
            accessibilityLabel="Mês anterior"
          >
            <Feather name="chevron-left" size={14} color={colors.muted} />
          </Pressable>
          <Text style={styles.monthText}>{label}</Text>
          <Pressable
            style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
            onPress={() => onShiftMonth(1)}
            disabled={!canGoForward}
            accessibilityLabel="Próximo mês"
          >
            <Feather name="chevron-right" size={14} color={colors.muted} />
          </Pressable>
        </View>
        <Text style={styles.caption}>{PERIOD_CAPTION[period]}</Text>
      </View>

      <ChipRow chips={PERIOD_FILTERS} selectedId={period} onSelect={(id) => onPeriodChange(id as PeriodFilter)} onCard />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  monthText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  caption: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
});
