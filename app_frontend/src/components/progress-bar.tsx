import { StyleSheet, View, type ViewStyle } from 'react-native';

import { colors } from '@/theme/colors';

type ProgressBarProps = {
  /** Valor entre 0 e 1. */
  value: number;
  height?: number;
  style?: ViewStyle;
};

export function ProgressBar({ value, height = 5, style }: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), 1);
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }, style]}>
      <View style={[styles.fill, { width: `${clamped * 100}%`, borderRadius: height / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: colors.text,
  },
});
