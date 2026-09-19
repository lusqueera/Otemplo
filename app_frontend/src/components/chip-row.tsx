import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

export type Chip = { id: string; label: string };

type ChipRowProps = {
  chips: Chip[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Usa o tom dos tiles quando renderizado dentro de um card. */
  onCard?: boolean;
  /** Padding lateral para os chips "sangrarem" até a borda da tela. */
  inset?: number;
};

export function ChipRow({ chips, selectedId, onSelect, onCard, inset = 0 }: ChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -inset }}
      contentContainerStyle={[styles.row, { paddingHorizontal: inset }]}
    >
      {chips.map((chip) => {
        const selected = chip.id === selectedId;
        return (
          <Pressable
            key={chip.id}
            style={[styles.chip, onCard && styles.chipOnCard, selected && styles.chipSelected]}
            onPress={() => onSelect(chip.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{chip.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOnCard: {
    backgroundColor: colors.tile,
  },
  chipSelected: {
    backgroundColor: colors.text,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  labelSelected: {
    color: colors.buttonText,
    fontWeight: '600',
  },
});
