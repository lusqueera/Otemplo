import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { Avatar } from '@/components/avatar';
import { colors } from '@/theme/colors';

type ScreenHeaderProps = {
  title: string;
  subtitle: string;
  action?: {
    label: string;
    icon?: keyof typeof Feather.glyphMap;
    onPress?: () => void;
  };
  /** Botão abaixo do subtítulo (padrão) ou ao lado do texto. */
  actionPlacement?: 'below' | 'right';
};

export function ScreenHeader({
  title,
  subtitle,
  action,
  actionPlacement = 'below',
}: ScreenHeaderProps) {
  const router = useRouter();
  const right = actionPlacement === 'right';

  const button = action && (
    <Pressable
      style={[styles.action, right && styles.actionRight]}
      onPress={action.onPress}
      accessibilityRole="button"
    >
      <Feather name={action.icon ?? 'plus'} size={16} color={colors.buttonText} />
      <Text style={styles.actionLabel}>{action.label}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.push('/screens/profile')} accessibilityRole="button" accessibilityLabel="Perfil">
          <Avatar />
        </Pressable>
      </View>

      <View style={[styles.header, right && styles.headerRow]}>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {button}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  header: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  action: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.text,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  actionRight: {
    alignSelf: 'center',
    maxWidth: 120,
  },
  actionLabel: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
});
