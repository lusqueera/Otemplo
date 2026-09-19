import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/theme/colors';
import type { Exercise } from '../data';

type ExerciseRowProps = {
  exercise: Exercise;
  onToggle: (exercise: Exercise) => void;
  onPress: (exercise: Exercise) => void;
};

function formatDelta(delta: number) {
  return `${delta > 0 ? '+' : ''}${delta} kg`;
}

export function ExerciseRow({ exercise, onToggle, onPress }: ExerciseRowProps) {
  const detail = [
    `${exercise.sets}× ${exercise.reps}`,
    exercise.load > 0 ? `Carga atual: ${exercise.load} kg` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Pressable style={styles.row} onPress={() => onPress(exercise)} accessibilityRole="button">
      <View style={styles.icon}>
        <MaterialCommunityIcons name={exercise.icon} size={20} color={colors.text} />
      </View>

      <View style={styles.text}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, exercise.done && styles.nameDone]} numberOfLines={1}>
            {exercise.name}
          </Text>
          {exercise.delta != null && exercise.delta !== 0 && (
            <View style={styles.delta}>
              <Text style={styles.deltaText}>{formatDelta(exercise.delta)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.detail}>{detail}</Text>
        {exercise.muscle ? (
          <View style={styles.muscle}>
            <Text style={styles.muscleText}>{exercise.muscle}</Text>
          </View>
        ) : null}
      </View>

      <Pressable
        style={[styles.check, exercise.done && styles.checkDone]}
        onPress={() => onToggle(exercise)}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: exercise.done }}
      >
        <Feather name="check" size={16} color={exercise.done ? colors.buttonText : colors.muted} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  nameDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  delta: {
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  deltaText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  detail: {
    color: colors.muted,
    fontSize: 12,
  },
  muscle: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  muscleText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '500',
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: colors.text,
  },
});
