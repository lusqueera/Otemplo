import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { ProgressBar } from '@/components/progress-bar';
import { Tag } from '@/components/tag';
import { colors } from '@/theme/colors';
import { PRIORITY_LABEL, type Subject } from '../data';

type SubjectCardProps = {
  subject: Subject;
  /** Flashcards pendentes desta matéria. */
  dueCount: number;
  onStart: (subject: Subject) => void;
  onMore: (subject: Subject) => void;
};

export function SubjectCard({ subject, dueCount, onStart, onMore }: SubjectCardProps) {
  const progress = subject.hoursGoal > 0 ? subject.hoursDone / subject.hoursGoal : 0;
  const percent = Math.round(progress * 100);

  return (
    <Pressable style={styles.card} onPress={() => onMore(subject)} accessibilityRole="button">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.tagRow}>
            <Tag
              label={PRIORITY_LABEL[subject.priority]}
              variant={subject.priority === 'high' ? 'filled' : 'default'}
            />
            {subject.module ? <Text style={styles.module}>{subject.module}</Text> : null}
          </View>
          <Text style={styles.title}>{subject.title}</Text>
          {subject.description ? <Text style={styles.description}>{subject.description}</Text> : null}
        </View>
        <Pressable
          style={styles.action}
          onPress={() => onStart(subject)}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sessão nesta matéria"
        >
          <Feather name="play" size={14} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>
            {dueCount > 0 ? `${dueCount} flashcards para revisar` : 'Progresso da Matéria'}
          </Text>
          <Text style={styles.progressValue}>
            {percent}% ({subject.hoursDone}h/{subject.hoursGoal}h meta)
          </Text>
        </View>
        <ProgressBar value={progress} />
      </View>
    </Pressable>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  module: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progress: {
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: colors.text,
    fontSize: 12,
  },
  progressValue: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
});
