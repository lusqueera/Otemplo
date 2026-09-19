import { StyleSheet } from 'react-native';

import { colors, fonts } from '@/theme/colors';

export { colors };

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 24,
  },

  // Cabeçalho
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  header: {
    gap: 8,
  },
  overline: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  greeting: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 38,
  },
  prompt: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },

  // Estudo
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  dotLive: {
    backgroundColor: colors.success,
  },
  todayValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  todayLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  goal: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.mono,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Hábitos
  consistencyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  consistencyValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  consistencyNumber: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
  },
  consistencyLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  consistencyDays: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.mono,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  habitList: {
    gap: 14,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  moreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  moreLinkText: {
    color: colors.muted,
    fontSize: 13,
  },

  // Treino
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nextWorkout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.tile,
    borderRadius: 12,
    padding: 12,
    paddingLeft: 16,
  },
  nextWorkoutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.muted,
  },
  nextWorkoutText: {
    flex: 1,
    gap: 2,
  },
  nextWorkoutTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  nextWorkoutSubtitle: {
    color: colors.muted,
    fontSize: 12,
  },
  chevron: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Finanças
  balanceLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  balance: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    fontFamily: fonts.mono,
    marginTop: 4,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flowItem: {
    gap: 4,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowLabel: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  flowValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  flowIncome: {
    color: colors.success,
  },
  flowExpense: {
    color: colors.danger,
  },
});
