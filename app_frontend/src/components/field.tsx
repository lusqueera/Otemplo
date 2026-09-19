import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Text } from 'react-native-paper';

import { colors } from '@/theme/colors';

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
};

/** Campo de texto com rótulo, no mesmo estilo dos inputs de login/registro. */
export function Field({ label, hint, style, multiline, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, style]}
        placeholderTextColor={colors.placeholder}
        multiline={multiline}
        {...props}
      />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

type Option<T extends string> = { value: T; label: string };

type OptionGroupProps<T extends string> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Grupo de opções mutuamente exclusivas (chips). */
export function OptionGroup<T extends string>({ label, options, value, onChange }: OptionGroupProps<T>) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.options}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onChange(opt.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type StepperProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** Seletor numérico com botões − / +. */
export function Stepper({ label, value, min = 0, max = 99, step = 1, format, onChange }: StepperProps) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          accessibilityLabel="Diminuir"
        >
          <Text style={styles.stepperSign}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{format ? format(value) : value}</Text>
        <Pressable
          style={styles.stepperButton}
          onPress={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          accessibilityLabel="Aumentar"
        >
          <Text style={styles.stepperSign}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 12,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    backgroundColor: colors.input,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: colors.text,
  },
  optionLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.buttonText,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.input,
    borderRadius: 999,
    padding: 4,
  },
  stepperButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperSign: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 22,
  },
  stepperValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'center',
  },
});
