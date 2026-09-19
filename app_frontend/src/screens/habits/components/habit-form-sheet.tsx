import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Field, OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { maskTime, TIME_RE } from '@/lib/format';
import { useCreateHabit, useUpdateHabit } from '@/api/habits';
import { colors } from '@/theme/colors';
import { GROUP_LABEL, HABIT_ICONS, type Habit, type HabitGroup, type HabitIcon } from '../data';

type HabitFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  habit?: Habit;
  onDelete?: (habit: Habit) => void;
};

type Kind = 'simple' | 'quantity';

const GROUP_OPTIONS = (Object.keys(GROUP_LABEL) as HabitGroup[]).map((value) => ({
  value,
  label: GROUP_LABEL[value],
}));

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: 'simple', label: 'Feito / não feito' },
  { value: 'quantity', label: 'Por quantidade' },
];

const EMPTY = {
  title: '',
  category: '',
  group: 'morning' as HabitGroup,
  goal: '',
  icon: HABIT_ICONS[0] as HabitIcon,
  scheduledAt: '',
  kind: 'simple' as Kind,
  target: 3000,
  step: 250,
  unit: 'ml',
};

export function HabitFormSheet({ visible, onClose, habit, onDelete }: HabitFormSheetProps) {
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!visible) return;
    setForm(
      habit
        ? {
            title: habit.title,
            category: habit.category,
            group: habit.group,
            goal: habit.goal,
            icon: habit.icon,
            scheduledAt: habit.scheduledAt ?? '',
            kind: habit.quantity ? 'quantity' : 'simple',
            target: habit.quantity?.target ?? EMPTY.target,
            step: habit.quantity?.step ?? EMPTY.step,
            unit: habit.quantity?.unit ?? EMPTY.unit,
          }
        : EMPTY,
    );
  }, [visible, habit]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const validTime = !form.scheduledAt || TIME_RE.test(form.scheduledAt);
  const canSave = form.title.trim().length > 0 && validTime && (form.kind === 'simple' || form.target > 0);

  function handleSave() {
    const input = {
      title: form.title.trim(),
      category: form.category.trim() || GROUP_LABEL[form.group],
      group: form.group,
      goal: form.goal.trim(),
      icon: form.icon,
      scheduledAt: form.scheduledAt || undefined,
      quantity:
        form.kind === 'quantity'
          ? {
              current: Math.min(habit?.quantity?.current ?? 0, form.target),
              target: form.target,
              step: Math.min(form.step, form.target),
              unit: form.unit.trim() || 'un',
            }
          : undefined,
    };
    // Trocar de quantitativo para simples limpa a meta no servidor
    if (habit) updateHabit.mutate({ id: habit.id, clearQuantity: !!habit.quantity && !input.quantity, ...input });
    else createHabit.mutate(input);
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={habit ? 'Editar hábito' : 'Novo hábito'}
      footer={
        <>
          <SheetButton label={habit ? 'Salvar alterações' : 'Criar hábito'} onPress={handleSave} disabled={!canSave} />
          {habit && onDelete && (
            <SheetButton label="Excluir hábito" variant="danger" onPress={() => onDelete(habit)} />
          )}
        </>
      }
    >
      <Field
        label="Nome"
        placeholder="Ex.: Leitura Profunda"
        value={form.title}
        onChangeText={(v) => patch('title', v)}
        autoFocus={!habit}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Ícone</Text>
        <View style={styles.icons}>
          {HABIT_ICONS.map((icon) => {
            const selected = icon === form.icon;
            return (
              <Pressable
                key={icon}
                style={[styles.iconOption, selected && styles.iconOptionSelected]}
                onPress={() => patch('icon', icon)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <MaterialCommunityIcons
                  name={icon}
                  size={20}
                  color={selected ? colors.buttonText : colors.text}
                />
              </Pressable>
            );
          })}
        </View>
      </View>

      <OptionGroup label="Período" options={GROUP_OPTIONS} value={form.group} onChange={(v) => patch('group', v)} />

      <Field
        label="Categoria"
        placeholder="Ex.: Intelecto & Estudo"
        value={form.category}
        onChangeText={(v) => patch('category', v)}
      />
      <Field
        label="Meta / descrição"
        placeholder="Ex.: Meta: 45 min/dia • Filosofia e Estratégia"
        value={form.goal}
        onChangeText={(v) => patch('goal', v)}
        multiline
      />
      <Field
        label="Horário (opcional)"
        placeholder="22:00"
        value={form.scheduledAt}
        onChangeText={(v) => patch('scheduledAt', maskTime(v))}
        keyboardType="number-pad"
        maxLength={5}
        hint={!validTime ? 'Use o formato HH:MM.' : undefined}
      />

      <OptionGroup label="Acompanhamento" options={KIND_OPTIONS} value={form.kind} onChange={(v) => patch('kind', v)} />

      {form.kind === 'quantity' && (
        <View style={styles.quantity}>
          <Field
            label="Unidade"
            placeholder="ml, páginas, min..."
            value={form.unit}
            onChangeText={(v) => patch('unit', v)}
          />
          <Stepper
            label="Meta diária"
            value={form.target}
            min={1}
            max={100000}
            step={form.step || 1}
            format={(v) => `${v} ${form.unit || 'un'}`}
            onChange={(v) => patch('target', v)}
          />
          <Stepper
            label="Incremento do botão"
            value={form.step}
            min={1}
            max={form.target}
            step={form.step >= 100 ? 50 : form.step >= 10 ? 5 : 1}
            format={(v) => `+${v} ${form.unit || 'un'}`}
            onChange={(v) => patch('step', v)}
          />
        </View>
      )}
    </Sheet>
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
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: colors.text,
  },
  quantity: {
    gap: 12,
  },
});
