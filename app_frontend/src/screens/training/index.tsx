import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { Badge, Card } from '@/components/card';
import { ChipRow } from '@/components/chip-row';
import { KpiTile } from '@/components/kpi-tile';
import { LineChart } from '@/components/line-chart';
import { QuoteCard } from '@/components/quote-card';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { WeekStrip } from '@/components/week-strip';
import { confirmDelete } from '@/lib/confirm';
import { isoWeekNumber, weekInfo } from '@/lib/week';
import { formatDuration, useTrainingStats } from '@/api/stats';
import { useDeleteWorkout, useRemoveExercise, useToggleExercise, useTonnage, useTrainingWeek, useWorkouts } from '@/api/training';
import { estimateVolumeKg, useTrainingStore } from '@/store/training';
import { colors } from '@/theme/colors';
import { ExerciseFormSheet } from './components/exercise-form-sheet';
import { ExerciseRow } from './components/exercise-row';
import { WorkoutCard } from './components/workout-card';
import { WorkoutFormSheet } from './components/workout-form-sheet';
import { useProfile } from '@/api/auth';
import { PROFILE_DEFAULTS } from '@/store/profile';
import { GROUP_LABEL, quote, type Exercise, type ExerciseGroup, type Workout } from './data';

const SCREEN_PADDING = 20;

type Filter = 'all' | ExerciseGroup;

type SheetState =
  | { kind: 'none' }
  | { kind: 'workout-actions' }
  | { kind: 'workout-picker' }
  | { kind: 'workout-form'; workout?: Workout }
  | { kind: 'exercise-actions'; exercise: Exercise }
  | { kind: 'exercise-form'; exercise?: Exercise };

export default function TrainingScreen() {
  const todayWorkoutId = useTrainingStore((s) => s.todayWorkoutId);
  const weekOffset = useTrainingStore((s) => s.weekOffset);
  const selectedDay = useTrainingStore((s) => s.selectedDay);
  const shiftWeek = useTrainingStore((s) => s.shiftWeek);
  const session = useTrainingStore((s) => s.session);
  const selectDay = useTrainingStore((s) => s.selectDay);
  const selectWorkout = useTrainingStore((s) => s.selectWorkout);
  const cancelSession = useTrainingStore((s) => s.cancelSession);

  const week = useMemo(() => weekInfo(weekOffset), [weekOffset]);
  const { data: workouts = [] } = useWorkouts();
  const { data: weekDone = [false, false, false, false, false, false, false] } = useTrainingWeek(week.key);
  const { data: tonnagePoints = [] } = useTonnage(6);
  const { data: stats } = useTrainingStats();
  const { data: profile } = useProfile();
  const weeklyGoal = (profile?.goals ?? PROFILE_DEFAULTS.goals).workouts;
  const activeProgress = stats?.goalActiveSeconds ? Math.min(1, stats.weekActiveSeconds / stats.goalActiveSeconds) : 0;
  const deleteWorkout = useDeleteWorkout();
  const removeExercise = useRemoveExercise();
  const toggleExercise = (workoutId: string, id: string) => toggleExerciseMutation.mutate({ workoutId, id });
  const toggleExerciseMutation = useToggleExercise();
  const isCurrentWeek = weekOffset === 0;

  // Sem seleção explícita (ou treino excluído), o de hoje é o primeiro da lista
  const workout = workouts.find((w) => w.id === todayWorkoutId) ?? workouts[0];

  // Curva de tonelagem: uma leitura por semana (kg), mais antiga primeiro
  const tonnage = useMemo(() => {
    const values = tonnagePoints.map((p) => p.volumeKg);
    const labels = tonnagePoints.map((p) => `Sem ${isoWeekNumber(new Date(`${p.week}T12:00:00`))}`);
    const prev = values.at(-2) ?? 0;
    const last = values.at(-1) ?? 0;
    const change = prev > 0 ? `${last >= prev ? '+' : ''}${(((last - prev) / prev) * 100).toFixed(1)}%` : '—';
    return { values, labels, change };
  }, [tonnagePoints]);
  const exercises = workout?.exercises ?? [];

  const [filter, setFilter] = useState<Filter>('all');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const close = () => setSheet({ kind: 'none' });

  const chips = useMemo(
    () => [
      { id: 'all', label: `Todos (${exercises.length})` },
      ...(Object.keys(GROUP_LABEL) as ExerciseGroup[]).map((g) => ({
        id: g,
        label: `${GROUP_LABEL[g]} (${exercises.filter((e) => e.group === g).length})`,
      })),
    ],
    [exercises],
  );
  const visible = filter === 'all' ? exercises : exercises.filter((e) => e.group === filter);

  // KPIs derivados
  const daysDone = weekDone.filter(Boolean).length;
  const days = week.days.map((d, i) => ({ ...d, done: weekDone[i] }));
  const volume = estimateVolumeKg(exercises);

  function handleDeleteWorkout(w: Workout) {
    confirmDelete('Excluir treino', `"${w.title}" e sua ficha de exercícios serão removidos.`, () => {
      deleteWorkout.mutate(w.id);
      close();
    });
  }

  function handleDeleteExercise(e: Exercise) {
    if (!workout) return;
    confirmDelete('Remover exercício', `"${e.name}" será removido da ficha.`, () => {
      removeExercise.mutate(workout.id, e.id);
      close();
    });
  }

  const workoutActions: Action[] = workout
    ? [
        { id: 'edit', label: 'Editar treino', icon: 'edit-2', onPress: () => setSheet({ kind: 'workout-form', workout }) },
        { id: 'add', label: 'Adicionar exercício', icon: 'plus', onPress: () => setSheet({ kind: 'exercise-form' }) },
        ...(workouts.length > 1
          ? [{ id: 'switch', label: 'Trocar treino de hoje', icon: 'repeat' as const, onPress: () => setSheet({ kind: 'workout-picker' }) }]
          : []),
        ...(session
          ? [{ id: 'cancel', label: 'Cancelar sessão em andamento', icon: 'x-circle' as const, destructive: true, onPress: cancelSession }]
          : []),
        { id: 'delete', label: 'Excluir treino', icon: 'trash-2', destructive: true, onPress: () => handleDeleteWorkout(workout) },
      ]
    : [];

  const pickerActions: Action[] = workouts.map((w) => ({
    id: w.id,
    label: w.title,
    icon: w.id === todayWorkoutId ? 'check-circle' : 'circle',
    onPress: () => selectWorkout(w.id),
  }));

  const exerciseActions: Action[] =
    sheet.kind === 'exercise-actions'
      ? [
          {
            id: 'toggle',
            label: sheet.exercise.done ? 'Desmarcar' : 'Marcar como feito',
            icon: sheet.exercise.done ? 'rotate-ccw' : 'check',
            onPress: () => workout && toggleExercise(workout.id, sheet.exercise.id),
          },
          { id: 'edit', label: 'Editar exercício', icon: 'edit-2', onPress: () => setSheet({ kind: 'exercise-form', exercise: sheet.exercise }) },
          { id: 'delete', label: 'Remover da ficha', icon: 'trash-2', destructive: true, onPress: () => handleDeleteExercise(sheet.exercise) },
        ]
      : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Treino & Físico"
          subtitle="Arquitetura corporal, hipertrofia progressiva e disciplina motora."
          action={{ label: 'Novo Treino', onPress: () => setSheet({ kind: 'workout-form' }) }}
          actionPlacement="right"
        />

        <WeekStrip
          title={
            <View style={styles.weekTitle}>
              <Feather name="calendar" size={14} color={colors.muted} />
              <Text style={styles.weekTitleText}>
                Semana {week.number} • {week.monthName}
              </Text>
            </View>
          }
          range={week.rangeLabel}
          days={days}
          selectedIndex={selectedDay}
          onSelect={selectDay}
          onPrev={() => shiftWeek(-1)}
          onNext={() => shiftWeek(1)}
        />

        {/* KPIs */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <KpiTile
              label="Frequência"
              badge={isCurrentWeek ? `${daysDone}/${weeklyGoal} meta` : `Semana ${week.number}`}
              value={`${daysDone} / ${weeklyGoal}`}
              unit="dias"
              progress={daysDone / weeklyGoal}
              hint={daysDone >= weeklyGoal ? 'Meta batida' : daysDone >= 3 ? 'Consistência alta' : 'Ritmo abaixo da meta'}
            />
            <KpiTile
              label="Volume previsto"
              badge={`${(stats?.volumeChangeKg ?? 0) >= 0 ? '+' : ''}${Math.round(stats?.volumeChangeKg ?? 0).toLocaleString('pt-BR')} kg`}
              value={volume.toLocaleString('pt-BR')}
              unit="kg"
              hint="Sobrecarga contínua"
              hintIcon={<Feather name="trending-up" size={12} color={colors.muted} />}
            />
          </View>
          <View style={styles.gridRow}>
            <KpiTile
              label="Tempo ativo"
              icon={<MaterialCommunityIcons name="timer-outline" size={16} color={colors.muted} />}
              value={formatDuration(stats?.weekActiveSeconds ?? 0)}
              progress={activeProgress}
              hint={`Meta: ${formatDuration(stats?.goalActiveSeconds ?? 0)} na semana`}
            />
            <KpiTile
              label="Sessões na semana"
              icon={<Feather name="heart" size={16} color={colors.muted} />}
              value={String(stats?.weekSessions ?? 0)}
              unit={`/${weeklyGoal}`}
              hint={stats?.weekSessions ? `Média ${formatDuration(stats.avgSessionSeconds)} / sessão` : 'Nenhuma sessão registrada'}
              hintIcon={<MaterialCommunityIcons name="fire" size={12} color={colors.muted} />}
            />
          </View>
        </View>

        <WorkoutCard
          workout={workout}
          onMore={() => setSheet({ kind: 'workout-actions' })}
          onCreate={() => setSheet({ kind: 'workout-form' })}
        />

        {workout && (
          <>
            <ChipRow
              chips={chips}
              selectedId={filter}
              onSelect={(id) => setFilter(id as Filter)}
              inset={SCREEN_PADDING}
            />

            {/* Ficha */}
            <View style={styles.section}>
              <SectionHeader
                title="Ficha de treino • Sobrecarga progressiva"
                right={
                  <Pressable style={styles.link} onPress={() => setSheet({ kind: 'exercise-form' })} accessibilityRole="button">
                    <Feather name="plus" size={14} color={colors.text} />
                    <Text style={styles.linkText}>
                      {exercises.length} {exercises.length === 1 ? 'item' : 'itens'}
                    </Text>
                  </Pressable>
                }
              />
              {visible.length === 0 ? (
                <Pressable style={styles.emptyCard} onPress={() => setSheet({ kind: 'exercise-form' })}>
                  <Text style={styles.emptyTitle}>
                    {exercises.length === 0 ? 'Ficha vazia' : 'Nenhum exercício neste grupo'}
                  </Text>
                  <Text style={styles.emptyText}>Toque para adicionar um exercício.</Text>
                </Pressable>
              ) : (
                visible.map((exercise) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onToggle={(e) => toggleExercise(workout.id, e.id)}
                    onPress={(e) => setSheet({ kind: 'exercise-actions', exercise: e })}
                  />
                ))
              )}
            </View>
          </>
        )}

        {/* Tonelagem */}
        <Card
          overline="Histórico de tonelagem"
          title="Curva de Sobrecarga (6 Semanas)"
          action={
            <Badge
              icon={<Feather name="arrow-up-right" size={14} color={colors.text} />}
              label={tonnage.change}
            />
          }
        >
          <LineChart
            data={tonnage.values}
            labels={tonnage.labels}
            curve="linear"
            markers={tonnage.values.map((_, i) => i)}
            highlightIndex={tonnage.values.length - 1}
            highlightLine={false}
            height={110}
          />
        </Card>

        <QuoteCard text={quote.text} author={quote.author} variant="plain" />
      </ScrollView>

      <ActionSheet
        visible={sheet.kind === 'workout-actions'}
        onClose={close}
        title={workout?.title ?? ''}
        subtitle={workout ? `${isCurrentWeek && selectedDay === week.todayIndex ? 'Hoje' : `${week.days[selectedDay].label} ${week.days[selectedDay].day}`} • ${workout.time}` : undefined}
        actions={workoutActions}
      />
      <ActionSheet
        visible={sheet.kind === 'workout-picker'}
        onClose={close}
        title="Treino de hoje"
        subtitle="Escolha qual ficha usar hoje"
        actions={pickerActions}
      />
      <WorkoutFormSheet
        visible={sheet.kind === 'workout-form'}
        onClose={close}
        workout={sheet.kind === 'workout-form' ? sheet.workout : undefined}
        onDelete={handleDeleteWorkout}
      />
      <ActionSheet
        visible={sheet.kind === 'exercise-actions'}
        onClose={close}
        title={sheet.kind === 'exercise-actions' ? sheet.exercise.name : ''}
        subtitle={sheet.kind === 'exercise-actions' ? sheet.exercise.muscle : undefined}
        actions={exerciseActions}
      />
      {workout && (
        <ExerciseFormSheet
          visible={sheet.kind === 'exercise-form'}
          onClose={close}
          workoutId={workout.id}
          exercise={sheet.kind === 'exercise-form' ? sheet.exercise : undefined}
          onDelete={handleDeleteExercise}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 20,
  },
  weekTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTitleText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  section: {
    gap: 12,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
});
