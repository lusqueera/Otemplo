import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Field, OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { useAddExercise, useUpdateExercise } from '@/api/training';
import { colors } from '@/theme/colors';
import { EXERCISE_ICONS, GROUP_LABEL, type Exercise, type ExerciseGroup, type ExerciseIcon } from '../data';

type ExerciseFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  workoutId: string;
  exercise?: Exercise;
  onDelete?: (exercise: Exercise) => void;
};

const GROUP_OPTIONS = (Object.keys(GROUP_LABEL) as ExerciseGroup[]).map((value) => ({
  value,
  label: GROUP_LABEL[value],
}));

const EMPTY = {
  name: '',
  sets: 3,
  reps: '10 reps',
  load: 20,
  delta: 0,
  muscle: '',
  group: 'abc' as ExerciseGroup,
  icon: EXERCISE_ICONS[0] as ExerciseIcon,
};

export function ExerciseFormSheet({ visible, onClose, workoutId, exercise, onDelete }: ExerciseFormSheetProps) {
  const addExercise = useAddExercise();
  const updateExercise = useUpdateExercise();
  const saving = addExercise.isPending || updateExercise.isPending;

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!visible) return;
    setForm(
      exercise
        ? {
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            load: exercise.load,
            delta: exercise.delta ?? 0,
            muscle: exercise.muscle,
            group: exercise.group,
            icon: exercise.icon,
          }
        : EMPTY,
    );
  }, [visible, exercise]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSave = form.name.trim().length > 0 && form.sets > 0;

  function handleSave() {
    const input = {
      name: form.name.trim(),
      sets: form.sets,
      reps: form.reps.trim() || `${form.sets} reps`,
      load: form.load,
      delta: form.delta !== 0 ? form.delta : undefined,
      muscle: form.muscle.trim(),
      group: form.group,
      icon: form.icon,
    };
    if (exercise)
      updateExercise.mutate(workoutId, exercise.id, input, {
        onSuccess: onClose,
      });
    else addExercise.mutate(workoutId, input, { onSuccess: onClose });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={exercise ? 'Editar exercício' : 'Novo exercício'}
      footer={
        <>
          <SheetButton
            label={exercise ? 'Salvar alterações' : 'Adicionar à ficha'}
            onPress={handleSave}
            disabled={!canSave}
            loading={saving}
          />
          {exercise && onDelete && <SheetButton label="Remover da ficha" variant="danger" onPress={() => onDelete(exercise)} />}
        </>
      }
    >
      <Field
        label="Exercício"
        placeholder="Ex.: Supino Reto com Barra"
        value={form.name}
        onChangeText={(v) => patch('name', v)}
        autoFocus={!exercise}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Ícone</Text>
        <View style={styles.icons}>
          {EXERCISE_ICONS.map((icon) => {
            const selected = icon === form.icon;
            return (
              <Pressable
                key={icon}
                style={[styles.iconOption, selected && styles.iconOptionSelected]}
                onPress={() => patch('icon', icon)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <MaterialCommunityIcons name={icon} size={20} color={selected ? colors.buttonText : colors.text} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <OptionGroup label="Grupo" options={GROUP_OPTIONS} value={form.group} onChange={(v) => patch('group', v)} />

      <Field label="Músculo / foco" placeholder="Ex.: Peitoral & Tríceps" value={form.muscle} onChangeText={(v) => patch('muscle', v)} />

      <Stepper label="Séries" value={form.sets} min={1} max={10} onChange={(v) => patch('sets', v)} />

      <Field
        label="Repetições / duração"
        placeholder="Ex.: 8–10 reps, 60 seg, 15 min"
        value={form.reps}
        onChangeText={(v) => patch('reps', v)}
      />

      <Stepper
        label="Carga"
        value={form.load}
        min={0}
        max={500}
        step={form.load >= 50 ? 2.5 : 1}
        format={(v) => (v === 0 ? 'Corporal' : `${v} kg`)}
        onChange={(v) => patch('load', v)}
      />

      <Stepper
        label="Progressão vs. último"
        value={form.delta}
        min={-20}
        max={20}
        step={0.5}
        format={(v) => (v === 0 ? '—' : `${v > 0 ? '+' : ''}${v} kg`)}
        onChange={(v) => patch('delta', v)}
      />
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
});
