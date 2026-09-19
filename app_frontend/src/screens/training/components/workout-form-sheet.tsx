import { useEffect, useState } from 'react';

import { Field, OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { maskTime, TIME_KEYBOARD, TIME_RE } from '@/lib/format';
import { useCreateWorkout, useUpdateWorkout } from '@/api/training';
import { useTrainingStore } from '@/store/training';
import { INTENSITY_LABEL, type Intensity, type Workout } from '../data';

type WorkoutFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  workout?: Workout;
  onDelete?: (workout: Workout) => void;
};

const INTENSITY_OPTIONS = (Object.keys(INTENSITY_LABEL) as Intensity[]).map((value) => ({
  value,
  label: INTENSITY_LABEL[value],
}));

const EMPTY = {
  title: '',
  description: '',
  time: '18:30',
  intensity: 'moderate' as Intensity,
  restSeconds: 90,
};

export function WorkoutFormSheet({ visible, onClose, workout, onDelete }: WorkoutFormSheetProps) {
  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();
  const saving = createWorkout.isPending || updateWorkout.isPending;

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!visible) return;
    setForm(
      workout
        ? {
            title: workout.title,
            description: workout.description,
            time: workout.time,
            intensity: workout.intensity,
            restSeconds: workout.restSeconds,
          }
        : EMPTY,
    );
  }, [visible, workout]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const validTime = TIME_RE.test(form.time);
  const canSave = form.title.trim().length > 0 && validTime;

  function handleSave() {
    const input = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
    };
    if (workout) updateWorkout.mutate({ id: workout.id, ...input }, { onSuccess: onClose });
    // Treino novo vira o treino de hoje
    else
      createWorkout.mutate(input, {
        onSuccess: (created) => {
          if (created) useTrainingStore.getState().selectWorkout(created.id);
          onClose();
        },
      });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={workout ? 'Editar treino' : 'Novo treino'}
      subtitle={workout ? undefined : 'O novo treino passa a ser o treino de hoje.'}
      footer={
        <>
          <SheetButton label={workout ? 'Salvar alterações' : 'Criar treino'} onPress={handleSave} disabled={!canSave} loading={saving} />
          {workout && onDelete && <SheetButton label="Excluir treino" variant="danger" onPress={() => onDelete(workout)} />}
        </>
      }
    >
      <Field
        label="Nome"
        placeholder="Ex.: Treino B • Superiores, Ombros & Core"
        value={form.title}
        onChangeText={(v) => patch('title', v)}
        autoFocus={!workout}
      />
      <Field
        label="Descrição"
        placeholder="Foco e objetivo da sessão"
        value={form.description}
        onChangeText={(v) => patch('description', v)}
        multiline
      />
      <Field
        label="Horário"
        placeholder="18:30"
        value={form.time}
        onChangeText={(v) => patch('time', maskTime(v))}
        keyboardType={TIME_KEYBOARD}
        maxLength={5}
        hint={!validTime ? 'Use o formato HH:MM.' : undefined}
      />
      <OptionGroup label="Intensidade" options={INTENSITY_OPTIONS} value={form.intensity} onChange={(v) => patch('intensity', v)} />
      <Stepper
        label="Descanso entre séries"
        value={form.restSeconds}
        min={15}
        max={300}
        step={15}
        format={(v) => `${v}s`}
        onChange={(v) => patch('restSeconds', v)}
      />
    </Sheet>
  );
}
