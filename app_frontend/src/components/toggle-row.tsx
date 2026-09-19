import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

/** Linha de configuração com interruptor, no estilo dos tiles. */
export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <Pressable style={styles.row} onPress={() => onChange(!value)} accessibilityRole="switch" accessibilityState={{ checked: value }}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.track, true: colors.text }}
        thumbColor={value ? colors.buttonText : colors.muted}
        ios_backgroundColor={colors.track}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.input,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
});
