import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { ChipRow } from '@/components/chip-row';
import { KpiTile } from '@/components/kpi-tile';
import { QuoteCard } from '@/components/quote-card';
import { ScreenHeader } from '@/components/screen-header';
import { SectionHeader } from '@/components/section-header';
import { WeekStrip } from '@/components/week-strip';
import { confirmDelete } from '@/lib/confirm';
import { weekInfo } from '@/lib/week';
import { useDeleteHabit, useHabits, useIncrementHabit, useToggleHabit } from '@/api/habits';
import { formatPct, useHabitsStats } from '@/api/stats';
import { isDoneOn, useHabitsStore, weeklyOf } from '@/store/habits';
import { colors } from '@/theme/colors';
import { DensityCard } from './components/density-card';
import { HabitCard } from './components/habit-card';
import { HabitFormSheet } from './components/habit-form-sheet';
import { GROUP_LABEL, quote, type Habit, type HabitGroup } from './data';

const SCREEN_PADDING = 20;

type Filter = 'all' | HabitGroup;

type SheetState =
  | { kind: 'none' }
  | { kind: 'actions'; habit: Habit }
  | { kind: 'form'; habit?: Habit };

export default function HabitsScreen() {
  const selectedDay = useHabitsStore((s) => s.selectedDay);
  const weekOffset = useHabitsStore((s) => s.weekOffset);
  const selectDay = useHabitsStore((s) => s.selectDay);
  const shiftWeek = useHabitsStore((s) => s.shiftWeek);

  const week = useMemo(() => weekInfo(weekOffset), [weekOffset]);
  const { data: habits = [] } = useHabits(week.key);
  const { data: stats } = useHabitsStats(30);
  const toggle = useToggleHabit();
  const increment = useIncrementHabit();
  const deleteHabit = useDeleteHabit();
  // Dia selecionado na semana exibida (ISO), enviado ao servidor
  const selectedDate = week.days[selectedDay].iso;
  const toggleHabit = (id: string) => toggle.mutate({ id, date: selectedDate, week: week.key });
  const incrementQuantity = (id: string) => increment.mutate({ id, date: selectedDate, week: week.key });
  const isCurrentWeek = weekOffset === 0;

  const [filter, setFilter] = useState<Filter>('all');
  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const close = () => setSheet({ kind: 'none' });

  // Filtros com contagem por período
  const chips = useMemo(
    () => [
      { id: 'all', label: `Todos  (${habits.length})` },
      ...(Object.keys(GROUP_LABEL) as HabitGroup[]).map((g) => ({
        id: g,
        label: `${GROUP_LABEL[g]}  (${habits.filter((h) => h.group === g).length})`,
      })),
    ],
    [habits],
  );
  const visible = filter === 'all' ? habits : habits.filter((h) => h.group === filter);

  // KPIs derivados (da semana exibida)
  const doneToday = habits.filter((h) => isDoneOn(h, week.key, selectedDay)).length;
  const weeklyTotal = habits.length * 7;
  const weeklyDone = habits.reduce((acc, h) => acc + weeklyOf(h, week.key).filter(Boolean).length, 0);
  const consistency = weeklyTotal ? Math.round((weeklyDone / weeklyTotal) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const remainingNight = habits.filter((h) => h.group === 'night' && !isDoneOn(h, week.key, selectedDay)).length;

  // Dias da semana com pelo menos um hábito concluído ganham a bolinha
  const days = week.days.map((d, i) => ({ ...d, done: habits.some((h) => weeklyOf(h, week.key)[i]) }));
  const dayLabel = isCurrentWeek && selectedDay === week.todayIndex ? 'hoje' : `${week.days[selectedDay].label} ${week.days[selectedDay].day}`;

  function handleDelete(habit: Habit) {
    confirmDelete('Excluir hábito', `"${habit.title}" e seu histórico serão removidos.`, () => {
      deleteHabit.mutate(habit.id);
      close();
    });
  }

  const actions: Action[] =
    sheet.kind === 'actions'
      ? [
          {
            id: 'toggle',
            label: isDoneOn(sheet.habit, week.key, selectedDay) ? `Desmarcar ${dayLabel}` : `Marcar como feito ${dayLabel}`,
            icon: isDoneOn(sheet.habit, week.key, selectedDay) ? 'rotate-ccw' : 'check',
            onPress: () => toggleHabit(sheet.habit.id),
          },
          { id: 'edit', label: 'Editar hábito', icon: 'edit-2', onPress: () => setSheet({ kind: 'form', habit: sheet.habit }) },
          { id: 'delete', label: 'Excluir hábito', icon: 'trash-2', destructive: true, onPress: () => handleDelete(sheet.habit) },
        ]
      : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Hábitos & Rituais"
          subtitle="Consistência intencional para alta performance e clareza mental."
          action={{ label: 'Novo Hábito', onPress: () => setSheet({ kind: 'form' }) }}
        />

        <WeekStrip
          title={`Semana ${week.number} • ${week.monthName}`}
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
              label="Consistência"
              badge={formatPct(stats?.monthlyChangePct, ' mês')}
              value={`${consistency}%`}
              progress={consistency / 100}
              hint={!isCurrentWeek ? `Semana ${week.number}` : consistency >= 80 ? 'Ritmo sustentável' : consistency >= 50 ? 'Em construção' : 'Precisa de atenção'}
            />
            <KpiTile
              label="Streak atual"
              icon={<MaterialCommunityIcons name="fire" size={16} color={colors.muted} />}
              value={String(bestStreak)}
              unit="dias"
              hint={`Recorde: ${Math.max(stats?.recordStreak ?? 0, bestStreak)} dias`}
            >
              <View style={styles.dots}>
                {Array.from({ length: 5 }, (_, i) => (
                  <View key={i} style={[styles.dot, i < Math.min(5, Math.ceil(bestStreak / 7)) && styles.dotOn]} />
                ))}
              </View>
            </KpiTile>
          </View>
          <View style={styles.gridRow}>
            <KpiTile
              label={isCurrentWeek && selectedDay === week.todayIndex ? 'Rituais hoje' : `Rituais de ${week.days[selectedDay].label}`}
              icon={<Feather name="check-circle" size={16} color={colors.muted} />}
              value={String(doneToday)}
              unit={`/${habits.length}`}
              hint={
                habits.length
                  ? `${Math.round((doneToday / habits.length) * 100)}% completado\n${
                      remainingNight > 0 ? `Restam ${remainingNight} noturnos` : 'Noturnos em dia'
                    }`
                  : 'Nenhum hábito ainda'
              }
            />
            <KpiTile
              label="Ritmo 30 dias"
              icon={<Feather name="zap" size={16} color={colors.muted} />}
              value={`${Math.round(stats?.monthConsistency ?? 0)}%`}
              progress={(stats?.monthConsistency ?? 0) / 100}
              hint={`Semana passada: ${Math.round(stats?.lastWeekConsistency ?? 0)}%`}
            />
          </View>
        </View>

        <DensityCard density={stats?.density ?? []} />

        <ChipRow
          chips={chips}
          selectedId={filter}
          onSelect={(id) => setFilter(id as Filter)}
          inset={SCREEN_PADDING}
        />

        {/* Rituais */}
        <View style={styles.section}>
          <SectionHeader
            title={isCurrentWeek && selectedDay === week.todayIndex ? 'Rituais em foco hoje' : `Rituais de ${week.days[selectedDay].label} ${week.days[selectedDay].day}`}
            right={
              <Text style={styles.executed}>
                {doneToday} de {habits.length} executados
              </Text>
            }
          />
          {visible.length === 0 ? (
            <Pressable style={styles.emptyCard} onPress={() => setSheet({ kind: 'form' })}>
              <Text style={styles.emptyTitle}>
                {habits.length === 0 ? 'Nenhum hábito cadastrado' : 'Nada neste período'}
              </Text>
              <Text style={styles.emptyText}>Toque para criar um hábito.</Text>
            </Pressable>
          ) : (
            visible.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                weekly={weeklyOf(habit, week.key)}
                done={isDoneOn(habit, week.key, selectedDay)}
                onToggle={(h) => toggleHabit(h.id)}
                onIncrement={(h) => incrementQuantity(h.id)}
                onPress={(h) => setSheet({ kind: 'actions', habit: h })}
              />
            ))
          )}
        </View>

        <QuoteCard text={quote.text} author={quote.author} />
      </ScrollView>

      <ActionSheet
        visible={sheet.kind === 'actions'}
        onClose={close}
        title={sheet.kind === 'actions' ? sheet.habit.title : ''}
        subtitle={sheet.kind === 'actions' ? sheet.habit.category : undefined}
        actions={actions}
      />
      <HabitFormSheet
        visible={sheet.kind === 'form'}
        onClose={close}
        habit={sheet.kind === 'form' ? sheet.habit : undefined}
        onDelete={handleDelete}
      />
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
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.track,
  },
  dotOn: {
    backgroundColor: colors.text,
  },
  section: {
    gap: 12,
  },
  executed: {
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
