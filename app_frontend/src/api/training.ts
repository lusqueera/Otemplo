import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, apiList } from '@/lib/api';
import { weekKey } from '@/lib/week';
import type { Exercise, Workout } from '@/screens/training/data';
import { keys } from './keys';
import { compact, dec, hhmm, num, numOrUndefined } from './mappers';

type ApiExercise = Omit<Exercise, 'id' | 'load' | 'delta'> & { id: number; load: string; delta: string | null; order: number };
type ApiWorkout = Omit<Workout, 'time' | 'exercises'> & {
  time: string | null;
  exercises: ApiExercise[];
  estimatedDurationSeconds: number;
  estimatedVolumeKg: string;
};

const toExercise = (e: ApiExercise): Exercise => ({
  id: String(e.id),
  name: e.name,
  sets: e.sets,
  reps: e.reps,
  load: num(e.load),
  delta: numOrUndefined(e.delta),
  muscle: e.muscle,
  group: e.group,
  icon: e.icon,
  done: e.done,
});

const toWorkout = (w: ApiWorkout): Workout => ({
  id: w.id,
  title: w.title,
  description: w.description,
  time: hhmm(w.time),
  intensity: w.intensity,
  restSeconds: w.restSeconds,
  exercises: w.exercises.map(toExercise),
});

export type WorkoutInput = Omit<Workout, 'id' | 'exercises'>;
export type ExerciseInput = Omit<Exercise, 'id' | 'done'>;

const fromExercise = (e: Partial<Exercise>) =>
  compact({
    name: e.name,
    sets: e.sets,
    reps: e.reps,
    load: e.load === undefined ? undefined : dec(e.load),
    delta: e.delta === undefined ? null : dec(e.delta),
    muscle: e.muscle,
    group: e.group,
    icon: e.icon,
    done: e.done,
  });

const fromWorkout = (i: Partial<WorkoutInput>) =>
  compact({
    title: i.title,
    description: i.description,
    time: i.time === undefined ? undefined : i.time || null,
    intensity: i.intensity,
    restSeconds: i.restSeconds,
  });

export function useWorkouts() {
  return useQuery({
    queryKey: keys.training.workouts,
    queryFn: async () => (await apiList<ApiWorkout>('/api/training/workouts/')).map(toWorkout),
  });
}

function useWorkoutMutation<TVars>(fn: (vars: TVars) => Promise<Workout | void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (workout) => {
      if (workout) qc.setQueryData<Workout[]>(keys.training.workouts, (list) => list?.map((w) => (w.id === workout.id ? workout : w)));
      qc.invalidateQueries({ queryKey: keys.training.workouts });
    },
  });
}

export function useCreateWorkout() {
  return useWorkoutMutation(async (input: WorkoutInput) =>
    toWorkout(await api<ApiWorkout>('/api/training/workouts/', { method: 'POST', body: { ...fromWorkout(input), exercises: [] } })),
  );
}

export function useUpdateWorkout() {
  return useWorkoutMutation(async ({ id, ...input }: { id: string } & Partial<WorkoutInput>) =>
    toWorkout(await api<ApiWorkout>(`/api/training/workouts/${id}/`, { method: 'PATCH', body: fromWorkout(input) })),
  );
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/training/workouts/${id}/`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.training.all }),
  });
}

// Exercícios: a API substitui a lista inteira no PATCH; aqui a lista é reconstruída a partir do cache
function useReplaceExercises() {
  const qc = useQueryClient();
  return useWorkoutMutation(async ({ workoutId, build }: { workoutId: string; build: (current: Exercise[]) => Partial<Exercise>[] }) => {
    const current = qc.getQueryData<Workout[]>(keys.training.workouts)?.find((w) => w.id === workoutId)?.exercises ?? [];
    const exercises = build(current).map(fromExercise);
    return toWorkout(await api<ApiWorkout>(`/api/training/workouts/${workoutId}/`, { method: 'PATCH', body: { exercises } }));
  });
}

export function useAddExercise() {
  const replace = useReplaceExercises();
  return {
    ...replace,
    mutate: (workoutId: string, input: ExerciseInput) =>
      replace.mutate({ workoutId, build: (list) => [...list, { ...input, done: false }] }),
  };
}

export function useUpdateExercise() {
  const replace = useReplaceExercises();
  return {
    ...replace,
    mutate: (workoutId: string, id: string, input: Partial<ExerciseInput>) =>
      replace.mutate({ workoutId, build: (list) => list.map((e) => (e.id === id ? { ...e, ...input } : e)) }),
  };
}

export function useRemoveExercise() {
  const replace = useReplaceExercises();
  return {
    ...replace,
    mutate: (workoutId: string, id: string) => replace.mutate({ workoutId, build: (list) => list.filter((e) => e.id !== id) }),
  };
}

export function useToggleExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, id }: { workoutId: string; id: string }) =>
      toExercise(await api<ApiExercise>(`/api/training/workouts/${workoutId}/exercises/${id}/toggle/`, { method: 'POST' })),
    onSuccess: (exercise, { workoutId }) =>
      qc.setQueryData<Workout[]>(keys.training.workouts, (list) =>
        list?.map((w) => (w.id === workoutId ? { ...w, exercises: w.exercises.map((e) => (e.id === exercise.id ? exercise : e)) } : w)),
      ),
  });
}

// ---- Semana e sessões

export function useTrainingWeek(week: string = weekKey(0)) {
  return useQuery({
    queryKey: keys.training.week(week),
    queryFn: async () => (await api<{ week: string; done: boolean[] }>(`/api/training/week/?week=${week}`)).done,
  });
}

export type TonnagePoint = { week: string; volumeKg: number };

export function useTonnage(weeks = 6) {
  return useQuery({
    queryKey: [...keys.training.tonnage, weeks],
    queryFn: async () =>
      (await api<{ week: string; volumeKg: string }[]>(`/api/training/tonnage/?weeks=${weeks}`)).map((p) => ({ week: p.week, volumeKg: num(p.volumeKg) })),
  });
}

/** Fecha a sessão: grava o log do dia e o servidor limpa os `done`. */
export function useFinishTrainingSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { workoutId: string | null; durationSeconds: number; date?: string }) =>
      api('/api/training/sessions/finish/', {
        method: 'POST',
        body: { workout: input.workoutId, durationSeconds: input.durationSeconds, date: input.date },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.training.all }),
  });
}
