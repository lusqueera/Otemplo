import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type StatTileProps = {
  label: string;
  value: string;
  hint: string;
  style?: ViewStyle;
};

export function StatTile({ label, value, hint, style }: StatTileProps) {
  return (
    <View style={[styles.tile, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.tile,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
  },
});
