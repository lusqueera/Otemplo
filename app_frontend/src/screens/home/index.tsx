import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Avatar } from '@/components/avatar';
import { Badge, Card } from '@/components/card';
import { LineChart } from '@/components/line-chart';
import { formatBRL } from '@/lib/format';
import { DAY_LABELS, isoWeekNumber, weekInfo } from '@/lib/week';
import { useProfile } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import { dailyStudyGoal, PROFILE_DEFAULTS } from '@/store/profile';
import { useFinanceSummary } from '@/api/finance';
import { formatDuration, formatPct, useFinanceStats, useHabitsStats, useNetWorthEvolution, useStudyStats, useTrainingStats } from '@/api/stats';
import { useHabits, useToggleHabit } from '@/api/habits';
import { useFlashcards, useLogStudySession, useStudyHours, useSubjects } from '@/api/study';
import { useTrainingWeek, useWorkouts } from '@/api/training';
import { isDoneOn, weeklyOf } from '@/store/habits';
import { useStudyStore } from '@/store/study';
import { estimateVolumeKg, useTrainingStore } from '@/store/training';
import { HabitRow } from './components/habit-row';
import { StatTile } from './components/stat-tile';
import { colors, styles } from './style';

const WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const HOME_HABITS_LIMIT = 4;

function getGreeting(hour: number) {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function TrendIcon() {
  return <Feather name="trending-up" size={14} color={colors.text} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const now = new Date();
  const firstName = (user?.name ?? 'Fulano').split(' ')[0];
  // Home sempre mostra a semana atual, independente da navegação feita nas abas
  const week = weekInfo(0);
  const todayIndex = week.todayIndex;

  // Estudo
  const { data: hoursByDay = [0, 0, 0, 0, 0, 0, 0] } = useStudyHours(week.key);
  const studySession = useStudyStore((s) => s.session);
  const { data: subjects = [] } = useSubjects();
  const { data: flashcards = [] } = useFlashcards();
  const { mutate: logStudySession } = useLogStudySession();
  const { data: studyStats } = useStudyStats();
  const { data: profile } = useProfile();
  const goals = profile?.goals ?? PROFILE_DEFAULTS.goals;
  const dailyGoal = dailyStudyGoal(goals);
  const weeklyWorkoutGoal = goals.workouts;

  // Hábitos
  const { data: habits = [] } = useHabits(week.key);
  const toggleHabitMutation = useToggleHabit();
  const { data: habitsStats } = useHabitsStats();
  const toggleHabit = (id: string) => toggleHabitMutation.mutate({ id, date: week.days[todayIndex].iso, week: week.key });

  // Treino
  const { data: workouts = [] } = useWorkouts();
  const todayWorkoutId = useTrainingStore((s) => s.todayWorkoutId);
  const { data: weekDone = [false, false, false, false, false, false, false] } = useTrainingWeek(week.key);
  const trainingSession = useTrainingStore((s) => s.session);
  const trainingTick = useTrainingStore((s) => s.tick);
  const { data: trainingStats } = useTrainingStats();

  // Finanças
  const { data: summary } = useFinanceSummary('month', 0);
  const { data: financeStats } = useFinanceStats('month', 0);
  const { data: evolutionPoints = [] } = useNetWorthEvolution(6);

  // Timers continuam correndo enquanto a home está aberta
  const studyRunning = !!studySession?.running;
  const trainingActive = !!trainingSession;
  useEffect(() => {
    if (!studyRunning) return;
    // Um ciclo que fecha sozinho aqui também é registrado no servidor
    const id = setInterval(() => {
      const elapsed = useStudyStore.getState().tick();
      if (elapsed) logStudySession({ seconds: elapsed.seconds, subjectId: elapsed.subjectId });
    }, 1000);
    return () => clearInterval(id);
  }, [studyRunning, logStudySession]);
  useEffect(() => {
    if (!trainingActive) return;
    const id = setInterval(trainingTick, 1000);
    return () => clearInterval(id);
  }, [trainingActive, trainingTick]);

  // ---- Derivações: estudo
  const hoursToday = hoursByDay[todayIndex] ?? 0;
  const weekTotal = hoursByDay.reduce((a, b) => a + b, 0);
  const daysElapsed = todayIndex + 1;
  const dailyAverage = weekTotal / daysElapsed;
  const vsAverage = Math.round(weekTotal - (studyStats?.historicalDailyAverage ?? 0) * daysElapsed);
  const reviewed = flashcards.filter((c) => c.hits + c.misses > 0);
  const focus = reviewed.length
    ? Math.round((reviewed.reduce((a, c) => a + c.hits, 0) / reviewed.reduce((a, c) => a + c.hits + c.misses, 0)) * 100)
    : null;
  const studySubject = subjects.find((s) => s.id === studySession?.subjectId);

  // ---- Derivações: hábitos
  const doneToday = habits.filter((h) => isDoneOn(h, week.key, todayIndex)).length;
  const pendingToday = habits.length - doneToday;
  const weeklySlots = habits.length * 7;
  const weeklyDone = habits.reduce((acc, h) => acc + weeklyOf(h, week.key).filter(Boolean).length, 0);
  const consistency = weeklySlots ? Math.round((weeklyDone / weeklySlots) * 100) : 0;
  const homeHabits = habits.slice(0, HOME_HABITS_LIMIT);

  // ---- Derivações: treino
  const workout = workouts.find((w) => w.id === todayWorkoutId) ?? workouts[0];
  const daysTrained = weekDone.filter(Boolean).length;
  const volume = workout ? estimateVolumeKg(workout.exercises) : 0;
  const exercisesDone = workout?.exercises.filter((e) => e.done).length ?? 0;

  // ---- Derivações: finanças (mês atual)
  const { income = 0, expenses = 0, net = 0 } = summary ?? {};
  const balanceSeries = evolutionPoints.map((p) => Math.round(p.netWorth / 100) / 10);

  const goStudy = () => router.push('/(tabs)/estudo');
  const goHabits = () => router.push('/(tabs)/habitos');
  const goTraining = () => router.push('/(tabs)/treino');
  const goFinance = () => router.push('/(tabs)/financas');

  const prompt = studySession
    ? `Sessão de ${studySubject?.title ?? 'estudo'} ${studySession.running ? 'em andamento' : 'pausada'} — continue de onde parou.`
    : pendingToday > 0
      ? `${pendingToday} ${pendingToday === 1 ? 'ritual pendente' : 'rituais pendentes'} hoje. Pronto para o seu próximo bloco de foco?`
      : 'Rituais de hoje concluídos. Pronto para o seu próximo bloco de foco intencional?';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.push('/screens/profile')} accessibilityRole="button" accessibilityLabel="Perfil">
            <Avatar />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.overline}>
            Cronograma de {WEEKDAY_NAMES[now.getDay()]}  •  Semana {isoWeekNumber(now)}
          </Text>
          <Text style={styles.greeting}>
            {getGreeting(now.getHours())}, {firstName}.
          </Text>
          <Text style={styles.prompt}>{prompt}</Text>
        </View>

        {/* Estudo */}
        <Pressable onPress={goStudy} accessibilityRole="button">
          <Card
            overline="Métricas semanais"
            title="Performance de Estudo"
            action={<Badge icon={<TrendIcon />} label={formatPct(studyStats?.weeklyChangePct)} />}
          >
            <View style={styles.todayRow}>
              <View style={styles.todayPill}>
                <View style={[styles.todayDot, studyRunning && styles.dotLive]} />
                <Text style={styles.todayValue}>
                  {studySession ? formatClock(studySession.remainingSeconds) : `${hoursToday.toFixed(1)}h`}
                </Text>
                <Text style={styles.todayLabel}>
                  {studySession ? (studySession.running ? 'em foco' : 'pausado') : `${DAY_LABELS[todayIndex]} (hoje)`}
                </Text>
              </View>
              <Text style={styles.goal}>Meta: {dailyGoal.toFixed(1)}h</Text>
            </View>

            <LineChart
              data={hoursByDay}
              labels={DAY_LABELS}
              highlightIndex={todayIndex}
              markers={hoursByDay.map((_, i) => i).filter((i) => i > 0 && i < todayIndex)}
            />

            <View style={styles.statsRow}>
              <StatTile
                label="Tempo total"
                value={`${Math.round(weekTotal)}h`}
                hint={`${vsAverage >= 0 ? '+' : ''}${vsAverage}h vs média`}
              />
              <StatTile
                label="Média diária"
                value={`${dailyAverage.toFixed(1)}h`}
                hint={
                  dailyAverage >= dailyGoal
                    ? 'Acima da meta'
                    : dailyAverage >= dailyGoal * 0.8
                      ? 'Ritmo ideal'
                      : 'Abaixo da meta'
                }
              />
              <StatTile
                label="Retenção"
                value={focus === null ? '—' : `${focus}%`}
                hint={focus === null ? 'Sem revisões ainda' : focus >= 90 ? 'Memória sólida' : 'Revisar mais'}
              />
            </View>
          </Card>
        </Pressable>

        {/* Hábitos */}
        <Card
          overline="Consistência & rotina"
          title="Intensidade de Hábitos"
          action={<Badge icon={<TrendIcon />} label={formatPct(habitsStats?.monthlyChangePct, ' mês')} />}
        >
          <Pressable style={styles.consistencyRow} onPress={goHabits} accessibilityRole="button">
            <View style={styles.consistencyValue}>
              <Text style={styles.consistencyNumber}>{consistency}%</Text>
              <Text style={styles.consistencyLabel}>Consistência global</Text>
            </View>
            <Text style={styles.consistencyDays}>
              {doneToday}/{habits.length} hoje
            </Text>
          </Pressable>

          <View style={styles.habitList}>
            {homeHabits.length === 0 ? (
              <Pressable onPress={goHabits}>
                <Text style={styles.emptyText}>Nenhum hábito ainda — toque para criar o primeiro.</Text>
              </Pressable>
            ) : (
              homeHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  weekly={weeklyOf(habit, week.key)}
                  todayIndex={todayIndex}
                  onToggle={(h) => toggleHabit(h.id)}
                />
              ))
            )}
          </View>

          {habits.length > HOME_HABITS_LIMIT && (
            <Pressable style={styles.moreLink} onPress={goHabits} accessibilityRole="link">
              <Text style={styles.moreLinkText}>Ver todos os {habits.length} rituais</Text>
              <Feather name="chevron-right" size={14} color={colors.muted} />
            </Pressable>
          )}
        </Card>

        {/* Treino */}
        <Card
          overline="Atividade física"
          title="Performance de Treino"
          action={
            <Pressable style={styles.iconButton} onPress={goTraining} accessibilityRole="button" accessibilityLabel="Abrir treino">
              <Feather name="maximize-2" size={16} color={colors.text} />
            </Pressable>
          }
        >
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <StatTile
                label="Frequência"
                value={`${daysTrained}/${weeklyWorkoutGoal} dias`}
                hint={`${Math.round((daysTrained / weeklyWorkoutGoal) * 100)}% da meta semanal`}
              />
              <StatTile
                label="Volume previsto"
                value={`${volume.toLocaleString('pt-BR')} kg`}
                hint={workout ? `${workout.exercises.length} exercícios na ficha` : 'Sem treino hoje'}
              />
            </View>
            <View style={styles.gridRow}>
              <StatTile
                label="Tempo ativo"
                value={formatDuration(trainingStats?.weekActiveSeconds ?? 0)}
                hint={trainingStats?.weekSessions ? `Média ${formatDuration(trainingStats.avgSessionSeconds)} / sessão` : 'Sem sessões na semana'}
              />
              <StatTile
                label="Sessões"
                value={`${trainingStats?.weekSessions ?? 0}/${weeklyWorkoutGoal}`}
                hint={`${Math.round(trainingStats?.weekVolumeKg ?? 0).toLocaleString('pt-BR')} kg na semana`}
              />
            </View>
          </View>

          <Pressable style={styles.nextWorkout} onPress={goTraining} accessibilityRole="button">
            <View style={[styles.nextWorkoutDot, trainingActive && styles.dotLive]} />
            <View style={styles.nextWorkoutText}>
              <Text style={styles.nextWorkoutTitle} numberOfLines={1}>
                {workout?.title ?? 'Nenhum treino planejado'}
              </Text>
              <Text style={styles.nextWorkoutSubtitle}>
                {!workout
                  ? 'Toque para criar um treino'
                  : trainingSession
                    ? `Em andamento • ${formatClock(trainingSession.elapsedSeconds)} • ${exercisesDone}/${workout.exercises.length} concluídos`
                    : `Hoje às ${workout.time} • Descanso ${workout.restSeconds}s`}
              </Text>
            </View>
            <View style={styles.chevron}>
              <Feather name="chevron-right" size={18} color={colors.buttonText} />
            </View>
          </Pressable>
        </Card>

        {/* Finanças */}
        <Pressable onPress={goFinance} accessibilityRole="button">
          <Card
            overline="Patrimônio & balanço"
            title="Fluxo Financeiro"
            action={
              <Badge
                icon={<Feather name="target" size={14} color={colors.text} />}
                label={formatPct(financeStats?.savingsChangePct, ' aportes')}
              />
            }
          >
            <View>
              <Text style={styles.balanceLabel}>Aporte & saldo mensal</Text>
              <Text style={styles.balance}>{formatBRL(net, { sign: true })}</Text>
            </View>

            <LineChart
              data={balanceSeries}
              height={120}
              highlightIndex={balanceSeries.length - 1}
              highlightLine={false}
              markers={[1, 3]}
            />

            <View style={styles.flowRow}>
              <View style={styles.flowItem}>
                <View style={styles.flowLabelRow}>
                  <Feather name="arrow-down" size={12} color={colors.muted} />
                  <Text style={styles.flowLabel}>Entradas</Text>
                </View>
                <Text style={[styles.flowValue, styles.flowIncome]}>{formatBRL(income, { compact: true })}</Text>
              </View>
              <View style={styles.flowItem}>
                <View style={styles.flowLabelRow}>
                  <Feather name="arrow-up" size={12} color={colors.muted} />
                  <Text style={styles.flowLabel}>Gastos</Text>
                </View>
                <Text style={[styles.flowValue, styles.flowExpense]}>{formatBRL(expenses, { compact: true })}</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
