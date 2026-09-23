import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { BODY_PART_LABEL, toExerciseInput } from '@/api/exercise-library';
import { useCreateWorkout } from '@/api/training';
import { Field, OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { maskTime, normalizeTime, TIME_KEYBOARD } from '@/lib/format';
import { notify } from '@/lib/notify';
import { bodyPartBreakdown, describeCart, suggestWorkoutTitle, useLibraryCart } from '@/store/library-cart';
import { useTrainingStore } from '@/store/training';
import { colors } from '@/theme/colors';
import { INTENSITY_LABEL, type Intensity } from '../data';

const INTENSITY_OPTIONS = (Object.keys(INTENSITY_LABEL) as Intensity[]).map((value) => ({
  value,
  label: INTENSITY_LABEL[value],
}));

type LibraryCartSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Chamado após criar o treino (a tela troca para "Meus treinos"). */
  onCreated: () => void;
};

/** Revisão do carrinho e criação do treino a partir dos exercícios escolhidos. */
export function LibraryCartSheet({ visible, onClose, onCreated }: LibraryCartSheetProps) {
  const items = useLibraryCart((s) => s.items);
  const remove = useLibraryCart((s) => s.remove);
  const clear = useLibraryCart((s) => s.clear);
  const createWorkout = useCreateWorkout();

  const suggested = suggestWorkoutTitle(items);
  // `null` = ainda não editado: o nome acompanha o carrinho sem precisar de efeito
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [time, setTime] = useState('18:30');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [restSeconds, setRestSeconds] = useState(90);

  const title = customTitle ?? suggested;
  const touched = customTitle !== null;

  const scheduledAt = normalizeTime(time);
  const canCreate = items.length > 0 && title.trim().length > 0 && scheduledAt !== null;
  const breakdown = bodyPartBreakdown(items);

  function handleCreate() {
    if (!canCreate) return;
    createWorkout.mutate(
      {
        title: title.trim(),
        description: describeCart(items),
        time: scheduledAt || '',
        intensity,
        restSeconds,
        exercises: items.map(toExerciseInput),
      },
      {
        onSuccess: (created) => {
          if (created) useTrainingStore.getState().selectWorkout(created.id);
          clear();
          setCustomTitle(null);
          onClose();
          onCreated();
          notify(
            'Treino criado',
            `"${title.trim()}" com ${items.length} exercícios já é o seu treino de hoje. Ajuste séries e cargas em Meus treinos.`,
          );
        },
      },
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Montar treino"
      subtitle={items.length ? describeCart(items) : 'Nenhum exercício no carrinho.'}
      footer={
        <>
          <SheetButton
            label={`Criar treino (${items.length})`}
            onPress={handleCreate}
            disabled={!canCreate}
            loading={createWorkout.isPending}
          />
          {items.length > 0 && <SheetButton label="Esvaziar carrinho" variant="secondary" onPress={clear} />}
        </>
      }
    >
      {breakdown.length > 0 && (
        <View style={styles.breakdown}>
          {breakdown.map((p) => (
            <View key={p.part} style={styles.part}>
              <Text style={styles.partText}>
                {BODY_PART_LABEL[p.part]} <Text style={styles.partCount}>{p.count}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.list}>
        {items.map((e) => (
          <View key={e.id} style={styles.row}>
            <Image source={{ uri: e.images[0] }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {e.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {BODY_PART_LABEL[e.bodyPart]} • {e.primaryMuscles[0]} • {e.equipment}
              </Text>
            </View>
            <Pressable onPress={() => remove(e.id)} hitSlop={8} accessibilityLabel={`Remover ${e.name}`} style={styles.remove}>
              <Feather name="x" size={16} color={colors.muted} />
            </Pressable>
          </View>
        ))}
      </View>

      {items.length > 0 && (
        <>
          <Field
            label="Nome do treino"
            placeholder={suggested}
            value={title}
            onChangeText={setCustomTitle}
            hint={!touched ? 'Sugerido pelos grupos musculares escolhidos.' : undefined}
          />
          <Field
            label="Horário previsto"
            placeholder="18:30"
            value={time}
            onChangeText={(v) => setTime(maskTime(v))}
            keyboardType={TIME_KEYBOARD}
            maxLength={5}
            hint={scheduledAt === null ? 'Use o formato HH:MM.' : undefined}
          />
          <OptionGroup label="Intensidade" options={INTENSITY_OPTIONS} value={intensity} onChange={setIntensity} />
          <Stepper
            label="Descanso entre séries"
            value={restSeconds}
            min={15}
            max={300}
            step={15}
            format={(v) => `${v} seg`}
            onChange={setRestSeconds}
          />
          <Text style={styles.note}>Cada exercício entra com 3 séries e carga zero — ajuste depois na ficha.</Text>
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  breakdown: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  part: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.tile,
    justifyContent: 'center',
  },
  partText: {
    color: colors.text,
    fontSize: 13,
  },
  partCount: {
    color: colors.muted,
  },
  list: {
    gap: 8,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.tile,
    borderRadius: 14,
    padding: 10,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.input,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  remove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    color: colors.placeholder,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
});
