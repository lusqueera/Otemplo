import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { DeletingOverlay } from '@/components/deleting-overlay';
import { ProgressBar } from '@/components/progress-bar';
import { Tag } from '@/components/tag';
import { useFinishTrainingSession } from '@/api/training';
import { estimateDurationMinutes, estimateVolumeKg, useTrainingStore } from '@/store/training';
import { colors, fonts } from '@/theme/colors';
import { INTENSITY_LABEL, type Workout } from '../data';

type WorkoutCardProps = {
  workout: Workout | undefined;
  onMore: () => void;
  onCreate: () => void;
  /** Exclusão em andamento: card fica coberto e inerte. */
  deleting?: boolean;
};

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WorkoutCard({ workout, onMore, onCreate, deleting }: WorkoutCardProps) {
  const session = useTrainingStore((s) => s.session);
  const finish = useFinishTrainingSession();

  const startSession = () => workout && useTrainingStore.getState().startSession(workout.id);
  // Fecha o cronômetro e registra a sessão no servidor (marca o dia e limpa os checks)
  const finishSession = () => {
    const ended = useTrainingStore.getState().finishSession();
    if (ended)
      finish.mutate({
        workoutId: ended.workoutId,
        durationSeconds: ended.elapsedSeconds,
      });
  };

  const active = !!session && session.workoutId === workout?.id;

  if (!workout) {
    return (
      <Pressable style={[styles.card, styles.empty]} onPress={onCreate} accessibilityRole="button">
        <Text style={styles.emptyTitle}>Nenhum treino para hoje</Text>
        <Text style={styles.emptyText}>Toque para criar o primeiro treino e montar a ficha.</Text>
      </Pressable>
    );
  }

  const done = workout.exercises.filter((e) => e.done).length;
  const total = workout.exercises.length;
  const duration = Math.round(estimateDurationMinutes(workout.exercises, workout.restSeconds));
  const volume = estimateVolumeKg(workout.exercises);

  return (
    <View style={styles.card} pointerEvents={deleting ? 'none' : 'auto'}>
      <View style={styles.header}>
        <View style={styles.tags}>
          <Tag label={active ? 'Em andamento' : `Hoje • ${workout.time}`} variant="filled" />
          <Tag label={INTENSITY_LABEL[workout.intensity]} />
        </View>
        <Pressable hitSlop={8} onPress={onMore} accessibilityRole="button" accessibilityLabel="Mais opções">
          <Feather name="more-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>{workout.title}</Text>
        {workout.description ? <Text style={styles.description}>{workout.description}</Text> : null}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Exercícios</Text>
          <Text style={styles.statValue}>
            {total} {total === 1 ? 'item' : 'itens'}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Duração</Text>
          <Text style={styles.statValue}>~{duration} min</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Vol. previsto</Text>
          <Text style={styles.statValue}>{volume.toLocaleString('pt-BR')} kg</Text>
        </View>
      </View>

      {active ? (
        <View style={styles.session}>
          <View style={styles.sessionRow}>
            <Text style={styles.elapsed}>{formatElapsed(session.elapsedSeconds)}</Text>
            <Text style={styles.sessionMeta}>
              {done}/{total} concluídos • Descanso {workout.restSeconds}s
            </Text>
          </View>
          <ProgressBar value={total ? done / total : 0} height={4} />
          <Pressable style={styles.button} onPress={finishSession} accessibilityRole="button">
            <Feather name="check" size={14} color={colors.buttonText} />
            <Text style={styles.buttonLabel}>Finalizar treino</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.button, total === 0 && styles.buttonDisabled]}
          onPress={startSession}
          disabled={total === 0}
          accessibilityRole="button"
        >
          <Feather name="play" size={14} color={colors.buttonText} />
          <Text style={styles.buttonLabel}>Iniciar Treino Agora</Text>
          <Text style={styles.buttonHint}>• Descanso {workout.restSeconds}s</Text>
        </Pressable>
      )}
      {deleting && <DeletingOverlay label="Excluindo treino…" />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  empty: {
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  text: {
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.tile,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  session: {
    gap: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  elapsed: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  sessionMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonHint: {
    color: colors.placeholder,
    fontSize: 13,
    marginLeft: 'auto',
  },
});
