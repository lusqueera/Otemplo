import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { colors } from '@/theme/colors';

export type WeekDay = {
  label: string;
  day: number;
  /** Dia com atividade registrada (bolinha branca). */
  done?: boolean;
};

type WeekStripProps = {
  /** Texto do cabeçalho (ex.: "Semana 42 • Outubro"). */
  title: ReactNode;
  /** Texto entre as setas de navegação (ex.: "16 — 22 Out"). */
  range?: string;
  days: WeekDay[];
  selectedIndex: number;
  onSelect?: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

export function WeekStrip({
  title,
  range,
  days,
  selectedIndex,
  onSelect,
  onPrev,
  onNext,
}: WeekStripProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {typeof title === 'string' ? <Text style={styles.title}>{title}</Text> : title}
        <View style={styles.nav}>
          <Pressable style={styles.navButton} onPress={onPrev} accessibilityLabel="Semana anterior">
            <Feather name="chevron-left" size={14} color={colors.muted} />
          </Pressable>
          {range && <Text style={styles.range}>{range}</Text>}
          <Pressable style={styles.navButton} onPress={onNext} accessibilityLabel="Próxima semana">
            <Feather name="chevron-right" size={14} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.days}>
        {days.map((d, i) => {
          const selected = i === selectedIndex;
          return (
            <Pressable
              key={d.label}
              style={[styles.day, selected && styles.daySelected]}
              onPress={() => onSelect?.(i)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.dayLabel, selected && styles.dayLabelSelected]}>{d.label}</Text>
              <Text style={[styles.dayNumber, selected && styles.dayNumberSelected]}>{d.day}</Text>
              <View style={[styles.dot, (d.done || selected) && styles.dotActive]} />
            </Pressable>
          );
        })}
      </View>
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
    gap: 12,
  },
  title: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  range: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    minWidth: 40,
  },
  daySelected: {
    backgroundColor: colors.tile,
  },
  dayLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  dayLabelSelected: {
    color: colors.text,
  },
  dayNumber: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '600',
  },
  dayNumberSelected: {
    color: colors.text,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  dotActive: {
    backgroundColor: colors.text,
  },
});
