import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { Avatar } from '@/components/avatar';
import { KpiTile } from '@/components/kpi-tile';
import { SectionHeader } from '@/components/section-header';
import { confirmDelete } from '@/lib/confirm';
import { formatBRL } from '@/lib/format';
import { useDeleteAccount, useLogout, useProfile } from '@/api/auth';
import { useHabits } from '@/api/habits';
import { useFlashcards, useSubjects } from '@/api/study';
import { useTonnage, useTrainingWeek, useWorkouts } from '@/api/training';
import { useAuthStore } from '@/store/auth';
import { useFinanceStore } from '@/store/finance';
import { useHabitsStore, weeklyOf } from '@/store/habits';
import { CURATOR_LABEL, PROFILE_DEFAULTS } from '@/store/profile';
import { useStudyStore } from '@/store/study';
import { estimateVolumeKg, useTrainingStore } from '@/store/training';
import { colors } from '@/theme/colors';
import { weekKey } from '@/lib/week';
import { AvatarSheet } from './components/avatar-sheet';
import { CircadianSheet } from './components/circadian-sheet';
import { EditProfileSheet } from './components/edit-profile-sheet';
import { GoalsSheet } from './components/goals-sheet';
import { QuotesSheet } from './components/quotes-sheet';

type SheetState = 'none' | 'settings' | 'profile' | 'avatar' | 'goals' | 'quotes' | 'circadian';

const quote = {
  text: '"Conhece-te a ti mesmo e conhecerás o universo e os deuses."',
  author: 'Templo de Apolo • Sócrates',
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();

  const thisWeek = weekKey(0);
  const { data: subjects = [] } = useSubjects();
  const { data: flashcards = [] } = useFlashcards();
  const { data: habits = [] } = useHabits(thisWeek);
  const { data: workouts = [] } = useWorkouts();
  const { data: weekDone = [false, false, false, false, false, false, false] } = useTrainingWeek(thisWeek);
  const { data: tonnagePoints = [] } = useTonnage(26);
  const { data: profile } = useProfile();
  const { goals, quotes, circadian } = profile ?? PROFILE_DEFAULTS;

  const [sheet, setSheet] = useState<SheetState>('none');
  const close = () => setSheet('none');

  const name = user?.name ?? 'Fulano';

  // KPIs derivados dos outros pilares
  const consistentDays = habits.reduce((max, h) => Math.max(max, h.streak), 0);
  const studyHours = subjects.reduce((acc, s) => acc + s.hoursDone, 0);
  // Histórico registrado no servidor + o que já foi feito na sessão de hoje
  const liftedKg = tonnagePoints.reduce((a, p) => a + p.volumeKg, 0) + workouts.reduce((acc, w) => acc + estimateVolumeKg(w.exercises.filter((e) => e.done)), 0);
  const liftedTon = Math.round(liftedKg / 1000);

  const weeklySlots = habits.length * 7;
  const habitsScore = weeklySlots ? habits.reduce((acc, h) => acc + weeklyOf(h, thisWeek).filter(Boolean).length, 0) / weeklySlots : 0;
  const studyScore = subjects.length ? subjects.reduce((acc, s) => acc + (s.hoursGoal ? s.hoursDone / s.hoursGoal : 0), 0) / subjects.length : 0;
  const trainingScore = Math.min(1, weekDone.filter(Boolean).length / goals.workouts);
  const reviewed = flashcards.filter((c) => c.hits + c.misses > 0);
  const retentionScore = reviewed.length ? reviewed.reduce((a, c) => a + c.hits, 0) / reviewed.reduce((a, c) => a + c.hits + c.misses, 0) : 0.9;
  const lifeScore = Math.round(((habitsScore + studyScore + trainingScore + retentionScore) / 4) * 100);

  // Limpa estado de UI local (semanas navegadas, cronômetros); o AuthGate leva ao login
  function resetLocalState() {
    useStudyStore.getState().reset();
    useHabitsStore.getState().reset();
    useTrainingStore.getState().reset();
    useFinanceStore.getState().reset();
  }

  function handleSignOut() {
    resetLocalState();
    logout.mutate();
  }

  function handleDeleteData() {
    confirmDelete(
      'Excluir todos os dados',
      'Matérias, flashcards, hábitos, treinos, transações e preferências serão apagados e a sessão encerrada. Essa ação não pode ser desfeita.',
      () => {
        resetLocalState();
        deleteAccount.mutate();
      },
    );
  }

  const settingsActions: Action[] = [
    { id: 'profile', label: 'Editar perfil', icon: 'user', onPress: () => setSheet('profile') },
    { id: 'avatar', label: 'Alterar foto', icon: 'camera', onPress: () => setSheet('avatar') },
    { id: 'goals', label: 'Metas e foco semanal', icon: 'target', onPress: () => setSheet('goals') },
    { id: 'quotes', label: 'Citações diárias', icon: 'book-open', onPress: () => setSheet('quotes') },
    { id: 'circadian', label: 'Ritmo circadiano & lembretes', icon: 'moon', onPress: () => setSheet('circadian') },
    { id: 'signout', label: 'Encerrar sessão', icon: 'log-out', onPress: handleSignOut },
    { id: 'delete', label: 'Exclusão de dados', icon: 'trash-2', destructive: true, onPress: handleDeleteData },
  ];

  const preferences = [
    {
      id: 'goals' as const,
      icon: <Feather name="target" size={18} color={colors.text} />,
      title: 'Metas e Foco Semanal',
      subtitle: `${goals.studyHours}h estudo • ${goals.workouts} treinos • ${goals.habitsConsistency}% hábitos • ${formatBRL(goals.monthlySavings, { compact: true })}`,
    },
    {
      id: 'quotes' as const,
      icon: <Feather name="book-open" size={18} color={colors.text} />,
      title: 'Filosofia e Citações Diárias',
      subtitle: quotes.enabled
        ? `Curadoria ${quotes.curators.map((c) => CURATOR_LABEL[c]).join(' & ')} • ${quotes.time}`
        : 'Citações desativadas',
    },
    {
      id: 'circadian' as const,
      icon: <Feather name="moon" size={18} color={colors.text} />,
      title: 'Ritmo Circadiano & Lembretes',
      subtitle: `${circadian.wakeTime} – ${circadian.bedTime} • ${
        circadian.windDownMinutes ? `desacelerar ${circadian.windDownMinutes} min antes` : 'sem desaceleração'
      }`,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Voltar">
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.screenTitle}>Perfil do Usuário</Text>
          <Pressable onPress={() => setSheet('settings')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Configurações">
            <Feather name="settings" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* Cartão do perfil */}
        <View style={styles.profileCard}>
          <View style={styles.profileRow}>
            <Pressable
              style={styles.avatarWrapper}
              onPress={() => setSheet('avatar')}
              accessibilityRole="button"
              accessibilityLabel="Alterar foto de perfil"
            >
              <Avatar size={80} style={styles.avatar} />
              <View style={styles.avatarBadge}>
                <Feather name="camera" size={12} color={colors.text} />
              </View>
            </Pressable>
            <View style={styles.profileText}>
              <Text style={styles.name}>{name}</Text>
              <Text style={styles.email}>{user?.email ?? '—'}</Text>
              {user?.title ? <Text style={styles.title}>{user.title}</Text> : null}
            </View>
          </View>
          <Pressable style={styles.editButton} onPress={() => setSheet('profile')} accessibilityRole="button">
            <Feather name="edit-2" size={14} color={colors.text} />
            <Text style={styles.editButtonText}>Editar Perfil</Text>
          </Pressable>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <SectionHeader title="Performance & disciplina vital" right="Consolidado" />
          <View style={styles.grid}>
            <View style={styles.gridRow}>
              <KpiTile
                label="Dias consistentes"
                icon={<MaterialCommunityIcons name="fire" size={16} color={colors.text} />}
                value={String(consistentDays)}
                unit="dias"
                hint="Sequência ininterrupta"
              />
              <KpiTile
                label="Horas de estudo"
                icon={<MaterialCommunityIcons name="head-cog-outline" size={16} color={colors.text} />}
                value={String(studyHours)}
                unit="horas"
                hint="Foco profundo FSRS"
              />
            </View>
            <View style={styles.gridRow}>
              <KpiTile
                label="Tonelagem físico"
                icon={<Feather name="maximize-2" size={16} color={colors.text} />}
                value={String(liftedTon)}
                unit="ton"
                hint="Carga total erguida"
              />
              <KpiTile
                label="Score de Vida Noir"
                icon={<Feather name="activity" size={16} color={colors.text} />}
                value={String(lifeScore)}
                unit="/ 100"
                hint="Índice de autodomínio"
              />
            </View>
          </View>
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <SectionHeader title="Preferências pessoais & metas" />
          <View style={styles.prefList}>
            {preferences.map((pref, i) => (
              <Pressable
                key={pref.id}
                style={[styles.prefRow, i < preferences.length - 1 && styles.prefRowDivider]}
                onPress={() => setSheet(pref.id)}
                accessibilityRole="button"
              >
                <View style={styles.prefIcon}>{pref.icon}</View>
                <View style={styles.prefText}>
                  <Text style={styles.prefTitle}>{pref.title}</Text>
                  <Text style={styles.prefSubtitle} numberOfLines={2}>
                    {pref.subtitle}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.signOut} onPress={handleSignOut} accessibilityRole="button">
          <Feather name="log-out" size={16} color={colors.text} />
          <Text style={styles.signOutText}>Encerrar Sessão</Text>
        </Pressable>

        <Pressable style={styles.deleteRow} onPress={handleDeleteData} accessibilityRole="button">
          <View style={styles.deleteDot} />
          <Text style={styles.deleteText}>Exclusão de Dados</Text>
        </Pressable>

        <View style={styles.quote}>
          <MaterialCommunityIcons name="pillar" size={20} color={colors.placeholder} />
          <Text style={styles.quoteText}>{quote.text}</Text>
          <Text style={styles.quoteAuthor}>{quote.author}</Text>
        </View>
      </ScrollView>

      <ActionSheet visible={sheet === 'settings'} onClose={close} title="Configurações" actions={settingsActions} />
      <EditProfileSheet visible={sheet === 'profile'} onClose={close} />
      <AvatarSheet visible={sheet === 'avatar'} onClose={close} />
      <GoalsSheet visible={sheet === 'goals'} onClose={close} />
      <QuotesSheet visible={sheet === 'quotes'} onClose={close} />
      <CircadianSheet visible={sheet === 'circadian'} onClose={close} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    gap: 20,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tile,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
  email: {
    color: colors.muted,
    fontSize: 13,
  },
  title: {
    color: colors.placeholder,
    fontSize: 12,
  },
  editButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tile,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  editButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  prefList: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  prefRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefText: {
    flex: 1,
    gap: 3,
  },
  prefTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  prefSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 16,
  },
  signOutText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: -8,
  },
  deleteDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.track,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  quote: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  quoteText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  quoteAuthor: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
