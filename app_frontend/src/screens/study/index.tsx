import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { Avatar } from '@/components/avatar';
import { SectionHeader } from '@/components/section-header';
import { WeekStrip } from '@/components/week-strip';
import { confirmDelete } from '@/lib/confirm';
import { weekInfo } from '@/lib/week';
import { useStudyStats } from '@/api/stats';
import { useDeleteBlock, useDeleteSubject, useFlashcards, useSchedule, useStudyHours, useSubjects, useUpdateBlock } from '@/api/study';
import { useStudyStore } from '@/store/study';
import { FlashcardReviewModal } from './components/flashcard-review-modal';
import { FlashcardsSheet } from './components/flashcards-sheet';
import { MetricTile } from './components/metric-tile';
import { ScheduleFormSheet } from './components/schedule-form-sheet';
import { ScheduleItem } from './components/schedule-item';
import { SessionCard } from './components/session-card';
import { StartSessionSheet } from './components/start-session-sheet';
import { SubjectCard } from './components/subject-card';
import { SubjectFormSheet } from './components/subject-form-sheet';
import { useProfile } from '@/api/auth';
import { dailyStudyGoal, PROFILE_DEFAULTS } from '@/store/profile';
import { memoryBank, quote, type Metric, type ScheduleBlock, type Subject } from './data';
import { colors, styles } from './style';

type SheetState =
  | { kind: 'none' }
  | { kind: 'start'; subjectId?: string }
  | { kind: 'subject-actions'; subject: Subject }
  | { kind: 'subject-form'; subject?: Subject }
  | { kind: 'schedule-form'; block?: ScheduleBlock }
  | { kind: 'flashcards' }
  | { kind: 'review' };

export default function StudyScreen() {
  const router = useRouter();
  const weekOffset = useStudyStore((s) => s.weekOffset);
  const selectedDay = useStudyStore((s) => s.selectedDay);
  const selectDay = useStudyStore((s) => s.selectDay);
  const shiftWeek = useStudyStore((s) => s.shiftWeek);
  const startSession = useStudyStore((s) => s.startSession);

  const week = useMemo(() => weekInfo(weekOffset), [weekOffset]);
  const { data: subjects = [] } = useSubjects();
  const { data: scheduleAll = [] } = useSchedule(week.key);
  const { data: flashcards = [] } = useFlashcards();
  const { data: hoursThisWeek = [] } = useStudyHours(weekInfo(0).key);
  const { data: stats } = useStudyStats();
  const { data: profile } = useProfile();
  const dailyGoal = dailyStudyGoal(profile?.goals ?? PROFILE_DEFAULTS.goals);
  const dueFlashcards = useMemo(() => flashcards.filter((c) => c.due), [flashcards]);
  const deleteSubject = useDeleteSubject();
  const deleteBlock = useDeleteBlock();
  const updateBlock = useUpdateBlock();

  const isToday = weekOffset === 0 && selectedDay === week.todayIndex;
  const selectedDate = week.days[selectedDay].iso;
  const schedule = useMemo(() => scheduleAll.filter((b) => b.date === selectedDate), [scheduleAll, selectedDate]);
  // Dias da semana com algum bloco ganham a bolinha
  const days = week.days.map((d) => ({ ...d, done: scheduleAll.some((b) => b.date === d.iso && b.status === 'done') }));

  const [sheet, setSheet] = useState<SheetState>({ kind: 'none' });
  const close = () => setSheet({ kind: 'none' });

  // Métricas derivadas do store
  const subjectsWithReview = subjects.filter((s) => dueFlashcards.some((c) => c.subjectId === s.id)).length;
  const reviewed = flashcards.filter((c) => c.hits + c.misses > 0);
  // Sem revisões ainda não há retenção a mostrar
  const retention = reviewed.length
    ? Math.round((reviewed.reduce((acc, c) => acc + c.hits, 0) / reviewed.reduce((acc, c) => acc + c.hits + c.misses, 0)) * 100)
    : null;
  const hoursToday = hoursThisWeek[weekInfo(0).todayIndex] ?? 0;
  const metrics: Metric[] = [
    {
      id: 'hours',
      label: 'Horas hoje',
      icon: 'circle-half-full',
      value: `${hoursToday.toFixed(1)}h`,
      unit: `/ ${dailyGoal.toFixed(1)}h`,
      progress: dailyGoal ? Math.min(1, hoursToday / dailyGoal) : 0,
    },
    {
      id: 'streak',
      label: 'Sequência',
      icon: 'fire',
      value: String(stats?.streak ?? 0),
      unit: 'dias seguidos',
      hint: stats ? `Recorde pessoal: ${stats.recordStreak}d` : undefined,
    },
    {
      id: 'subjects',
      label: 'Matérias',
      icon: 'layers-outline',
      value: String(subjects.length),
      unit: subjects.length === 1 ? 'ativa' : 'ativas',
      hint: subjectsWithReview > 0 ? `${subjectsWithReview} com revisão pendente` : 'Revisões em dia',
    },
    {
      id: 'retention',
      label: 'Retenção',
      icon: 'head-cog-outline',
      value: retention === null ? '—' : `${retention}%`,
      unit: retention === null ? 'sem revisões' : 'acertos',
      progress: retention === null ? undefined : retention / 100,
    },
  ];

  function handleDeleteSubject(subject: Subject) {
    confirmDelete(
      'Excluir matéria',
      `"${subject.title}" e seus flashcards serão removidos. Essa ação não pode ser desfeita.`,
      () => {
        deleteSubject.mutate(subject.id);
        close();
      },
    );
  }

  function handleDeleteBlock(block: ScheduleBlock) {
    confirmDelete('Remover bloco', `"${block.title}" será removido do cronograma.`, () => {
      deleteBlock.mutate(block.id);
      close();
    });
  }

  function toggleBlock(block: ScheduleBlock) {
    updateBlock.mutate({ id: block.id, status: block.status === 'done' ? 'pending' : 'done' });
  }

  const subjectActions: Action[] =
    sheet.kind === 'subject-actions'
      ? [
          {
            id: 'start',
            label: 'Iniciar sessão de foco',
            icon: 'play',
            onPress: () => startSession(sheet.subject.id),
          },
          {
            id: 'edit',
            label: 'Editar matéria',
            icon: 'edit-2',
            onPress: () => setSheet({ kind: 'subject-form', subject: sheet.subject }),
          },
          {
            id: 'cards',
            label: 'Gerenciar flashcards',
            icon: 'layers',
            onPress: () => setSheet({ kind: 'flashcards' }),
          },
          {
            id: 'delete',
            label: 'Excluir matéria',
            icon: 'trash-2',
            destructive: true,
            onPress: () => handleDeleteSubject(sheet.subject),
          },
        ]
      : [];

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
          <View style={styles.headerText}>
            <Text style={styles.title}>Estudos</Text>
            <Text style={styles.subtitle}>Gestão de matérias, ciclos de foco</Text>
          </View>
          <Pressable
            style={styles.startButton}
            onPress={() => setSheet({ kind: 'start' })}
            accessibilityRole="button"
          >
            <Feather name="play" size={12} color={colors.text} />
            <Text style={styles.startButtonText}>Iniciar</Text>
          </Pressable>
        </View>

        <SessionCard onStart={() => setSheet({ kind: 'start' })} />

        {/* Desempenho cognitivo */}
        <View style={styles.section}>
          <SectionHeader title="Desempenho cognitivo" right="Metas de Hoje" />
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <MetricTile metric={metrics[0]} />
              <MetricTile metric={metrics[1]} />
            </View>
            <View style={styles.gridRow}>
              <MetricTile metric={metrics[2]} />
              <MetricTile metric={metrics[3]} />
            </View>
          </View>
        </View>

        {/* Hub de foco */}
        <View style={styles.section}>
          <SectionHeader
            title="Atelier acadêmico • Hub de foco"
            right={
              <View style={styles.version}>
                <Text style={styles.versionText}>{memoryBank.version}</Text>
              </View>
            }
          />
          <View style={styles.memoryBank}>
            <Pressable
              style={styles.memoryIcon}
              onPress={() => setSheet({ kind: 'flashcards' })}
              accessibilityRole="button"
              accessibilityLabel="Gerenciar flashcards"
            >
              <MaterialCommunityIcons name="cards-outline" size={20} color={colors.text} />
            </Pressable>
            <Pressable style={styles.memoryText} onPress={() => setSheet({ kind: 'flashcards' })}>
              <View style={styles.memoryTitleRow}>
                <Text style={styles.memoryTitle}>{memoryBank.title}</Text>
                {dueFlashcards.length > 0 && <View style={styles.hubDot} />}
              </View>
              <Text style={styles.memorySubtitle} numberOfLines={1}>
                {dueFlashcards.length > 0
                  ? `${dueFlashcards.length} flashcards prontos para consolidação`
                  : `${flashcards.length} cards • revisão em dia`}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.reviewButton, dueFlashcards.length === 0 && styles.reviewButtonDisabled]}
              onPress={() => setSheet({ kind: 'review' })}
              accessibilityRole="button"
            >
              <Text style={styles.reviewButtonText}>Revisar</Text>
            </Pressable>
          </View>
        </View>

        {/* Matérias em andamento */}
        <View style={styles.section}>
          <SectionHeader
            title="Matérias em andamento"
            count={subjects.length}
            right={
              <Pressable
                style={styles.link}
                onPress={() => setSheet({ kind: 'subject-form' })}
                accessibilityRole="button"
              >
                <Feather name="plus" size={14} color={colors.text} />
                <Text style={styles.linkText}>Nova matéria</Text>
              </Pressable>
            }
          />
          {subjects.length === 0 ? (
            <Pressable style={styles.emptyCard} onPress={() => setSheet({ kind: 'subject-form' })}>
              <Text style={styles.emptyTitle}>Nenhuma matéria cadastrada</Text>
              <Text style={styles.emptyText}>Toque para adicionar a primeira e começar a acompanhar o progresso.</Text>
            </Pressable>
          ) : (
            subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                dueCount={dueFlashcards.filter((c) => c.subjectId === subject.id).length}
                onStart={(s) => setSheet({ kind: 'start', subjectId: s.id })}
                onMore={(s) => setSheet({ kind: 'subject-actions', subject: s })}
                deleting={deleteSubject.isPending && deleteSubject.variables === subject.id}
              />
            ))
          )}
        </View>

        {/* Cronograma */}
        <View style={styles.section}>
          <WeekStrip
            title={`Semana ${week.number} • ${week.monthName}`}
            range={week.rangeLabel}
            days={days}
            selectedIndex={selectedDay}
            onSelect={selectDay}
            onPrev={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
          />
          <SectionHeader
            title={isToday ? 'Cronograma de hoje' : `Cronograma de ${week.days[selectedDay].label} ${week.days[selectedDay].day}`}
            right={
              <Pressable
                style={styles.link}
                onPress={() => setSheet({ kind: 'schedule-form' })}
                accessibilityRole="button"
              >
                <Feather name="plus" size={14} color={colors.text} />
                <Text style={styles.linkText}>
                  {schedule.length} {schedule.length === 1 ? 'bloco' : 'blocos'}
                </Text>
              </Pressable>
            }
          />
          {schedule.length === 0 ? (
            <Pressable style={styles.emptyCard} onPress={() => setSheet({ kind: 'schedule-form' })}>
              <Text style={styles.emptyTitle}>Dia livre</Text>
              <Text style={styles.emptyText}>
                {isToday ? 'Toque para planejar o primeiro bloco de estudo de hoje.' : 'Nenhum bloco neste dia. Toque para planejar.'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.schedule}>
              {schedule.map((block, i) => (
                <ScheduleItem
                  key={block.id}
                  block={block}
                  isLast={i === schedule.length - 1}
                  onPress={(b) => setSheet({ kind: 'schedule-form', block: b })}
                  onToggle={toggleBlock}
                  deleting={deleteBlock.isPending && deleteBlock.variables === block.id}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.quote}>
          <Feather name="book-open" size={18} color={colors.muted} />
          <Text style={styles.quoteText}>{quote}</Text>
        </View>
      </ScrollView>

      <StartSessionSheet
        visible={sheet.kind === 'start'}
        onClose={close}
        initialSubjectId={sheet.kind === 'start' ? sheet.subjectId : undefined}
      />
      <ActionSheet
        visible={sheet.kind === 'subject-actions'}
        onClose={close}
        title={sheet.kind === 'subject-actions' ? sheet.subject.title : ''}
        subtitle={sheet.kind === 'subject-actions' ? sheet.subject.module : undefined}
        actions={subjectActions}
      />
      <SubjectFormSheet
        visible={sheet.kind === 'subject-form'}
        onClose={close}
        subject={sheet.kind === 'subject-form' ? sheet.subject : undefined}
        onDelete={handleDeleteSubject}
      />
      <ScheduleFormSheet
        visible={sheet.kind === 'schedule-form'}
        onClose={close}
        date={selectedDate}
        block={sheet.kind === 'schedule-form' ? sheet.block : undefined}
        onDelete={handleDeleteBlock}
      />
      <FlashcardsSheet visible={sheet.kind === 'flashcards'} onClose={close} />
      <FlashcardReviewModal visible={sheet.kind === 'review'} onClose={close} />
    </SafeAreaView>
  );
}
