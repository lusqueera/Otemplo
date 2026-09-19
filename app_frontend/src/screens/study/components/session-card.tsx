import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { useLogStudySession, useSubjects } from '@/api/study';
import { useStudyStore, type Elapsed } from '@/store/study';
import { colors, fonts } from '@/theme/colors';

const RING_SIZE = 168;
const RING_STROKE = 3;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type SessionCardProps = {
  onStart: () => void;
};

export function SessionCard({ onStart }: SessionCardProps) {
  const session = useStudyStore((s) => s.session);
  const { data: subjects = [] } = useSubjects();
  const subject = subjects.find((s) => s.id === session?.subjectId);
  const toggleSession = useStudyStore((s) => s.toggleSession);
  const { mutate: logSession } = useLogStudySession();

  // Tempo decorrido de cada ciclo vai para o servidor (horas do dia + matéria)
  const log = useCallback(
    (elapsed: Elapsed | null) => {
      if (elapsed) logSession({ seconds: elapsed.seconds, subjectId: elapsed.subjectId });
    },
    [logSession],
  );
  const stopSession = () => log(useStudyStore.getState().stopSession());
  const skipCycle = () => log(useStudyStore.getState().skipCycle());

  const running = session?.running ?? false;

  if (!session || !subject) {
    return (
      <View style={styles.card}>
        <View style={styles.overlineRow}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={colors.muted} />
          <Text style={[styles.overline, styles.overlineMuted]}>Nenhuma sessão ativa</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyRing}>
            <Feather name="play" size={28} color={colors.text} />
          </View>
          <Text style={styles.emptyTitle}>Pronto para focar?</Text>
          <Text style={styles.emptyText}>
            Escolha uma matéria e a duração dos ciclos para começar uma sessão de foco.
          </Text>
          <Pressable style={styles.emptyButton} onPress={onStart} accessibilityRole="button">
            <Text style={styles.emptyButtonText}>Iniciar sessão</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const progress = 1 - session.remainingSeconds / session.cycleSeconds;

  return (
    <View style={styles.card}>
      <View style={styles.overlineRow}>
        <MaterialCommunityIcons name="timer-outline" size={16} color={colors.text} />
        <Text style={styles.overline}>{running ? 'Sessão em andamento' : 'Sessão pausada'}</Text>
      </View>

      <View>
        <Text style={styles.title}>{subject.title}</Text>
        <Text style={styles.detail}>
          {subject.module} • {subject.description}
        </Text>
      </View>

      <View style={styles.ringWrapper}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.track}
            strokeWidth={RING_STROKE}
            fill="none"
          />
          <Circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            stroke={colors.text}
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH * progress}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringContent}>
          <Text style={styles.time}>{formatTime(session.remainingSeconds)}</Text>
          <Text style={styles.timeLabel}>Restantes</Text>
        </View>
      </View>

      <View style={styles.cycleRow}>
        <View style={styles.dots}>
          {Array.from({ length: session.totalCycles }, (_, i) => (
            <View key={i} style={[styles.dot, i < session.currentCycle && styles.dotActive]} />
          ))}
        </View>
        <Text style={styles.cycleText}>
          Ciclo {session.currentCycle} de {session.totalCycles} • {session.cycleSeconds / 60} min
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.control} onPress={stopSession} accessibilityLabel="Encerrar sessão">
          <Feather name="square" size={16} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.controlMain}
          onPress={toggleSession}
          accessibilityLabel={running ? 'Pausar' : 'Iniciar'}
        >
          <Feather name={running ? 'pause' : 'play'} size={22} color={colors.buttonText} />
        </Pressable>
        <Pressable style={styles.control} onPress={skipCycle} accessibilityLabel="Próximo ciclo">
          <Feather name="skip-forward" size={16} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  overlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  overline: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  overlineMuted: {
    color: colors.muted,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  ringWrapper: {
    alignSelf: 'center',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContent: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  time: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  timeLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.track,
  },
  dotActive: {
    backgroundColor: colors.text,
  },
  cycleText: {
    color: colors.muted,
    fontSize: 13,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  control: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlMain: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  emptyRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    paddingLeft: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: colors.text,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: colors.buttonText,
    fontSize: 14,
    fontWeight: '600',
  },
});
