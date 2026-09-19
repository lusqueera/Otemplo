import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';

import { useAuthStore } from '@/store/auth';
import { colors } from '@/theme/colors';

type AvatarProps = {
  size?: number;
  style?: ViewStyle;
};

/** Foto do usuário logado, ou a inicial do nome quando não há foto. */
export function Avatar({ size = 44, style }: AvatarProps) {
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name ?? 'Fulano').charAt(0).toUpperCase();
  const radius = size / 2;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: radius }, style]}>
      {user?.avatarUri ? (
        <Image
          source={{ uri: user.avatarUri }}
          style={{ width: size, height: size, borderRadius: radius }}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    color: colors.text,
    fontWeight: '600',
  },
});
