import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Habit } from '@/screens/habits/data';
import { colors, fonts } from '@/theme/colors';

type HabitRowProps = {
  habit: Habit;
  /** Execuções da semana atual (Seg..Dom). */
  weekly: boolean[];
  /** Dia da semana em destaque (0 = Seg). */
  todayIndex: number;
  onToggle: (habit: Habit) => void;
};

export function HabitRow({ habit, weekly, todayIndex, onToggle }: HabitRowProps) {
  const done = weekly.filter(Boolean).length;
  const doneToday = weekly[todayIndex];

  return (
    <Pressable
      style={styles.row}
      onPress={() => onToggle(habit)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: doneToday }}
      accessibilityLabel={`${habit.title}: ${doneToday ? 'feito hoje' : 'pendente hoje'}`}
    >
      <View style={styles.header}>
        <View style={styles.name}>
          <MaterialCommunityIcons name={habit.icon} size={14} color={doneToday ? colors.text : colors.muted} />
          <Text style={[styles.nameText, !doneToday && styles.nameTextPending]}>{habit.title}</Text>
        </View>
        <Text style={styles.count}>
          {done}/{weekly.length} dias
        </Text>
      </View>
      <View style={styles.segments}>
        {weekly.map((filled, i) => (
          <View
            key={i}
            style={[styles.segment, filled && styles.segmentFilled, i === todayIndex && !filled && styles.segmentToday]}
          />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nameText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  nameTextPending: {
    color: colors.muted,
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  segmentFilled: {
    backgroundColor: colors.text,
  },
  segmentToday: {
    borderWidth: 1,
    borderColor: colors.muted,
  },
});
