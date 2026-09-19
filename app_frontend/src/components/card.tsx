import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type CardProps = {
  overline: string;
  title: string;
  /** Conteúdo do canto superior direito (badge, botão de ação, etc.). */
  action?: ReactNode;
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ overline, title, action, children, style }: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.overline}>{overline}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

type BadgeProps = {
  icon?: ReactNode;
  label: string;
};

export function Badge({ icon, label }: BadgeProps) {
  return (
    <View style={styles.badge}>
      {icon}
      <Text style={styles.badgeLabel}>{label}</Text>
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
  overline: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.tile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
});
