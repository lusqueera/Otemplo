import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { DeletingOverlay } from '@/components/deleting-overlay';
import { colors } from '@/theme/colors';
import type { ScheduleBlock, ScheduleStatus } from '../data';

const STATUS_LABEL: Record<ScheduleStatus, string> = {
  done: 'Concluído',
  next: 'Próximo',
  pending: 'Pendente',
};

function StatusIcon({ status }: { status: ScheduleStatus }) {
  switch (status) {
    case 'done':
      return (
        <View style={[styles.icon, styles.iconDone]}>
          <Feather name="check" size={12} color={colors.muted} />
        </View>
      );
    case 'next':
      return (
        <View style={[styles.icon, styles.iconNext]}>
          <Feather name="play" size={12} color={colors.buttonText} />
        </View>
      );
    case 'pending':
      return (
        <View style={styles.icon}>
          <Feather name="clock" size={14} color={colors.muted} />
        </View>
      );
  }
}

type ScheduleItemProps = {
  block: ScheduleBlock;
  isLast?: boolean;
  /** Toque no conteúdo: abrir edição. */
  onPress: (block: ScheduleBlock) => void;
  /** Toque no ícone de status: alterna concluído / pendente. */
  onToggle: (block: ScheduleBlock) => void;
  /** Remoção em andamento: bloco fica coberto e inerte. */
  deleting?: boolean;
};

export function ScheduleItem({ block, isLast, onPress, onToggle, deleting }: ScheduleItemProps) {
  const done = block.status === 'done';
  const next = block.status === 'next';

  return (
    <View style={styles.row} pointerEvents={deleting ? 'none' : 'auto'}>
      <View style={styles.rail}>
        <Pressable
          onPress={() => onToggle(block)}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={done ? 'Marcar como pendente' : 'Marcar como concluído'}
        >
          <StatusIcon status={block.status} />
        </Pressable>
        {!isLast && <View style={styles.line} />}
      </View>

      <Pressable
        style={[styles.content, isLast && styles.contentLast]}
        onPress={() => onPress(block)}
        accessibilityRole="button"
      >
        <View style={styles.timeRow}>
          <Text style={styles.time}>
            {block.start} — {block.end}
          </Text>
          {done ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{STATUS_LABEL.done}</Text>
            </View>
          ) : (
            <Text style={[styles.status, next && styles.statusNext]}>
              {STATUS_LABEL[block.status]}
            </Text>
          )}
        </View>
        <Text style={[styles.title, done && styles.titleDone]}>{block.title}</Text>
        {block.description ? <Text style={styles.description}>{block.description}</Text> : null}
      </Pressable>
      {deleting && <DeletingOverlay label="Removendo…" radius={12} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 14,
  },
  rail: {
    alignItems: 'center',
    width: 28,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: {
    backgroundColor: colors.tile,
  },
  iconNext: {
    backgroundColor: colors.text,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: colors.track,
    marginVertical: 4,
  },
  content: {
    flex: 1,
    gap: 3,
    paddingBottom: 22,
  },
  contentLast: {
    paddingBottom: 0,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  time: {
    color: colors.muted,
    fontSize: 12,
  },
  status: {
    color: colors.muted,
    fontSize: 12,
  },
  statusNext: {
    color: colors.text,
    fontWeight: '600',
  },
  statusPill: {
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusPillText: {
    color: colors.muted,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  titleDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
});
