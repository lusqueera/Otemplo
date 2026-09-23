import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { ProgressBar } from '@/components/progress-bar';
import { Tag } from '@/components/tag';
import { DeletingOverlay } from '@/components/deleting-overlay';
import { colors } from '@/theme/colors';
import { PRIORITY_LABEL, type Subject } from '../data';

type SubjectCardProps = {
  subject: Subject;
  /** Flashcards pendentes desta matéria. */
  dueCount: number;
  onStart: (subject: Subject) => void;
  /** Exclusão em andamento: card fica coberto e inerte. */
  deleting?: boolean;
  onMore: (subject: Subject) => void;
};

export function SubjectCard({ subject, dueCount, onStart, onMore, deleting }: SubjectCardProps) {
  const progress = subject.hoursGoal > 0 ? subject.hoursDone / subject.hoursGoal : 0;
  const percent = Math.round(progress * 100);

  return (
    // Sem Pressable no cartão inteiro: na web <button> aninhado engole o clique do "play"
    <View style={styles.card} pointerEvents={deleting ? 'none' : 'auto'}>
      <View style={styles.header}>
        <Pressable style={styles.headerText} onPress={() => onMore(subject)} accessibilityRole="button">
          <View style={styles.tagRow}>
            <Tag label={PRIORITY_LABEL[subject.priority]} variant={subject.priority === 'high' ? 'filled' : 'default'} />
            {subject.module ? <Text style={styles.module}>{subject.module}</Text> : null}
          </View>
          <Text style={styles.title}>{subject.title}</Text>
          {subject.description ? <Text style={styles.description}>{subject.description}</Text> : null}
        </Pressable>
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
          <Text style={styles.progressLabel}>{dueCount > 0 ? `${dueCount} flashcards para revisar` : 'Progresso da Matéria'}</Text>
          <Text style={styles.progressValue}>
            {percent}% ({subject.hoursDone}h/{subject.hoursGoal}h meta)
          </Text>
        </View>
        <ProgressBar value={progress} />
      </View>
      {deleting && <DeletingOverlay />}
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
