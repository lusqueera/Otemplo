import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Sheet } from '@/components/sheet';
import { colors } from '@/theme/colors';

export type Action = {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  actions: Action[];
};

/** Lista de ações contextuais (editar, excluir, ...) num bottom sheet. */
export function ActionSheet({ visible, onClose, title, subtitle, actions }: ActionSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <View style={styles.list}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            style={styles.row}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            accessibilityRole="button"
          >
            <View style={[styles.icon, action.destructive && styles.iconDestructive]}>
              <Feather
                name={action.icon}
                size={16}
                color={action.destructive ? colors.danger : colors.text}
              />
            </View>
            <Text style={[styles.label, action.destructive && styles.labelDestructive]}>
              {action.label}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.placeholder} />
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.tile,
    borderRadius: 12,
    padding: 12,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDestructive: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  labelDestructive: {
    color: colors.danger,
  },
});
