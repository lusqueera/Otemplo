import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProgressBar } from '@/components/progress-bar';
import { colors } from '@/theme/colors';
import type { Metric } from '../data';

export function MetricTile({ metric }: { metric: Metric }) {
  return (
    <View style={styles.tile}>
      <View style={styles.header}>
        <Text style={styles.label}>{metric.label}</Text>
        <MaterialCommunityIcons name={metric.icon} size={16} color={colors.muted} />
      </View>

      <View style={styles.body}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{metric.value}</Text>
          {metric.unit && <Text style={styles.unit}>{metric.unit}</Text>}
        </View>
        {metric.hint && <Text style={styles.hint}>{metric.hint}</Text>}
        {metric.progress != null && <ProgressBar value={metric.progress} />}
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
    gap: 20,
    minHeight: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: {
    gap: 6,
    marginTop: 'auto',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '600',
  },
  unit: {
    color: colors.muted,
    fontSize: 13,
  },
  hint: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
});
