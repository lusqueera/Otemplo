import { StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

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
    gap: 28,
  },

  // Cabeçalho
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  startButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Seções
  section: {
    gap: 14,
  },
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  linkText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },

  // Hub de foco
  hubTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hubDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.text,
  },
  version: {
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  versionText: {
    color: colors.muted,
    fontSize: 11,
  },
  memoryBank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  memoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryText: {
    flex: 1,
    gap: 2,
  },
  memoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  memorySubtitle: {
    color: colors.muted,
    fontSize: 13,
  },
  reviewButton: {
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reviewButtonDisabled: {
    opacity: 0.4,
  },
  reviewButtonText: {
    color: colors.buttonText,
    fontSize: 13,
    fontWeight: '600',
  },

  // Estados vazios
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
    lineHeight: 18,
  },

  // Cronograma
  schedule: {
    paddingTop: 4,
  },

  // Citação
  quote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
  },
  quoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
