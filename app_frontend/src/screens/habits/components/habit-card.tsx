import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ProgressBar } from '@/components/progress-bar';
import { DeletingOverlay } from '@/components/deleting-overlay';
import { colors } from '@/theme/colors';
import type { Habit } from '../data';

type HabitCardProps = {
  habit: Habit;
  /** Execuções da semana exibida (Seg..Dom). */
  weekly: boolean[];
  done: boolean;
  onToggle: (habit: Habit) => void;
  onIncrement: (habit: Habit) => void;
  onPress: (habit: Habit) => void;
  /** Exclusão em andamento: card fica coberto e inerte. */
  deleting?: boolean;
};

function formatQty(value: number, unit: string) {
  return `${value.toLocaleString('pt-BR')}${unit}`;
}

export function HabitCard({ habit, weekly, done, onToggle, onIncrement, onPress, deleting }: HabitCardProps) {
  const weeklyDone = weekly.filter(Boolean).length;
  const qty = habit.quantity;
  const qtyProgress = qty ? qty.current / qty.target : 0;
  const inProgress = qty && !done && qty.current > 0;

  return (
    // O cartão não é um Pressable: na web, <button> dentro de <button> é inválido e o clique
    // em "+ 250 ml" era entregue ao cartão. Só a área de texto abre as ações.
    <View style={styles.card} pointerEvents={deleting ? 'none' : 'auto'}>
      <View style={styles.main}>
        <Pressable style={styles.body} onPress={() => onPress(habit)} accessibilityRole="button">
          <View style={styles.icon}>
            <MaterialCommunityIcons name={habit.icon} size={20} color={colors.text} />
          </View>

          <View style={styles.text}>
            <View style={styles.metaRow}>
              <Text style={styles.category}>{habit.category}</Text>
              {inProgress ? (
                <View style={styles.status}>
                  <Text style={styles.statusText}>Em andamento</Text>
                </View>
              ) : habit.streak > 0 ? (
                <View style={styles.streak}>
                  <MaterialCommunityIcons name="fire" size={12} color={colors.text} />
                  <Text style={styles.streakText}>{habit.streak}d</Text>
                </View>
              ) : habit.scheduledAt ? (
                <View style={styles.status}>
                  <Text style={styles.statusText}>Agendado {habit.scheduledAt}</Text>
                </View>
              ) : (
                <View style={styles.status}>
                  <Text style={styles.statusText}>{done ? 'Concluído' : 'Pendente'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {habit.title}
            </Text>
            <Text style={styles.goal}>
              {qty
                ? `${formatQty(qty.current, qty.unit)} de ${formatQty(qty.target, qty.unit)} (${Math.round(qtyProgress * 100)}%)`
                : habit.goal}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {qty && !done && (
            <Pressable
              style={styles.increment}
              onPress={() => onIncrement(habit)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Adicionar ${qty.step}${qty.unit}`}
            >
              <Text style={styles.incrementText}>+ {formatQty(qty.step, qty.unit)}</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.check, done && styles.checkDone]}
            onPress={() => onToggle(habit)}
            hitSlop={6}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: done }}
          >
            {done ? <Feather name="check" size={16} color={colors.buttonText} /> : <View style={styles.checkEmpty} />}
          </Pressable>
        </View>
      </View>

      {qty ? (
        <ProgressBar value={qtyProgress} />
      ) : (
        <View style={styles.weekly}>
          <Text style={styles.weeklyLabel}>
            Frequência semanal ({weeklyDone}/{weekly.length})
          </Text>
          <View style={styles.weeklySegments}>
            {weekly.map((on, i) => (
              <View key={i} style={[styles.segment, on && styles.segmentOn]} />
            ))}
          </View>
        </View>
      )}
      {deleting && <DeletingOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  category: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  status: {
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    color: colors.muted,
    fontSize: 10,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  goal: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  increment: {
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  incrementText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
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
  checkEmpty: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.muted,
  },
  weekly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  weeklyLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  weeklySegments: {
    flexDirection: 'row',
    gap: 4,
    flex: 1,
    maxWidth: 150,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  segmentOn: {
    backgroundColor: colors.text,
  },
});
