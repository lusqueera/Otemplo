import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { toExerciseInput, type LibraryExercise } from '@/api/exercise-library';
import { useAddExercise, useWorkouts } from '@/api/training';
import { Sheet, SheetButton } from '@/components/sheet';
import { Tag } from '@/components/tag';
import { notify } from '@/lib/notify';
import { useLibraryCart } from '@/store/library-cart';
import { useTrainingStore } from '@/store/training';
import { colors } from '@/theme/colors';

type LibraryExerciseSheetProps = {
  exercise: LibraryExercise | null;
  onClose: () => void;
};

/** Alterna as fotos de posição inicial/final, simulando a execução. */
const FRAME_MS = 900;

export function LibraryExerciseSheet({ exercise, onClose }: LibraryExerciseSheetProps) {
  const { data: workouts = [] } = useWorkouts();
  const todayWorkoutId = useTrainingStore((s) => s.todayWorkoutId);
  const add = useAddExercise();
  const inCart = useLibraryCart((s) => (exercise ? s.has(exercise.id) : false));
  const toggleCart = useLibraryCart((s) => s.toggle);

  const [frame, setFrame] = useState(0);
  const [workoutId, setWorkoutId] = useState<string | null>(null);

  const visible = !!exercise;
  const frames = exercise?.images.length ?? 0;

  useEffect(() => {
    if (!visible || frames < 2) return;
    setFrame(0);
    const id = setInterval(() => setFrame((f) => (f + 1) % frames), FRAME_MS);
    return () => clearInterval(id);
  }, [visible, frames, exercise?.id]);

  // Ficha alvo: a selecionada para hoje, senão a primeira
  const targetId = workoutId ?? todayWorkoutId ?? workouts[0]?.id ?? null;
  const target = workouts.find((w) => w.id === targetId);

  function handleAdd() {
    if (!exercise || !targetId) return;
    add.mutate(targetId, toExerciseInput(exercise), {
      onSuccess: () => {
        notify(
          'Adicionado à ficha',
          `"${exercise.name}" entrou em ${target?.title ?? 'sua ficha'} com 3 séries. Ajuste carga e repetições na aba Meus treinos.`,
        );
        onClose();
      },
    });
  }

  if (!exercise) return null;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={exercise.name}
      subtitle={`${exercise.primaryMuscles.join(', ')} • ${exercise.equipment}`}
      footer={
        <>
          <SheetButton
            label={inCart ? 'Remover do treino em montagem' : 'Adicionar ao treino em montagem'}
            variant={inCart ? 'secondary' : 'primary'}
            onPress={() => {
              toggleCart(exercise);
              onClose();
            }}
          />
          {workouts.length > 0 && (
            <SheetButton
              label={target ? `Incluir direto em "${target.title}"` : 'Incluir numa ficha existente'}
              variant="secondary"
              onPress={handleAdd}
              loading={add.isPending}
            />
          )}
        </>
      }
    >
      <View style={styles.demo}>
        {exercise.images.map((uri, i) => (
          // As duas fotos ficam montadas e só a opacidade muda: sem piscar ao trocar
          <Image key={uri} source={{ uri }} style={[styles.image, { opacity: i === frame ? 1 : 0 }]} resizeMode="contain" />
        ))}
        {frames > 1 && (
          <View style={styles.dots}>
            {exercise.images.map((_, i) => (
              <View key={i} style={[styles.dot, i === frame && styles.dotOn]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.tags}>
        <Tag label={exercise.level} variant="filled" />
        <Tag label={exercise.category} />
        {exercise.secondaryMuscles.map((m) => (
          <Tag key={m} label={m} />
        ))}
      </View>

      {workouts.length > 1 && (
        <View style={styles.block}>
          <Text style={styles.blockTitle}>Ficha existente</Text>
          <View style={styles.workouts}>
            {workouts.map((w) => {
              const on = w.id === targetId;
              return (
                <Pressable
                  key={w.id}
                  style={[styles.workout, on && styles.workoutOn]}
                  onPress={() => setWorkoutId(w.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.workoutText, on && styles.workoutTextOn]}>{w.title}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.block}>
        <View style={styles.blockHeader}>
          <Text style={styles.blockTitle}>Execução</Text>
          <View style={styles.lang}>
            <Feather name="globe" size={11} color={colors.placeholder} />
            <Text style={styles.langText}>EN</Text>
          </View>
        </View>
        {exercise.instructions.map((step, i) => (
          <View key={i} style={styles.step}>
            <Text style={styles.stepNumber}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  demo: {
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(19, 19, 19, 0.25)',
  },
  dotOn: {
    backgroundColor: colors.background,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  block: {
    gap: 10,
    marginBottom: 20,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  blockTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  lang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  langText: {
    color: colors.placeholder,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.tile,
    color: colors.text,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepText: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
  },
  workouts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  workout: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 999,
    backgroundColor: colors.tile,
    justifyContent: 'center',
  },
  workoutOn: {
    backgroundColor: colors.text,
  },
  workoutText: {
    color: colors.text,
    fontSize: 13,
  },
  workoutTextOn: {
    color: colors.buttonText,
    fontWeight: '600',
  },
});
