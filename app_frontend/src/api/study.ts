import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { stale } from '@/lib/query-client';
import { api, apiList } from '@/lib/api';
import { weekKey } from '@/lib/week';
import type { Flashcard, ScheduleBlock, ScheduleStatus, Subject } from '@/screens/study/data';
import { keys } from './keys';
import { invalidate } from './invalidate';
import { compact, dec, hhmm, num } from './mappers';

// ---- Matérias

type ApiSubject = Omit<Subject, 'hoursDone' | 'hoursGoal'> & { hoursDone: string; hoursGoal: string };

const toSubject = (s: ApiSubject): Subject => ({ ...s, hoursDone: num(s.hoursDone), hoursGoal: num(s.hoursGoal) });

export type SubjectInput = Omit<Subject, 'id'>;

const fromSubject = (i: Partial<SubjectInput>) =>
  compact({
    title: i.title,
    module: i.module,
    description: i.description,
    priority: i.priority,
    hoursDone: i.hoursDone === undefined ? undefined : dec(i.hoursDone),
    hoursGoal: i.hoursGoal === undefined ? undefined : dec(i.hoursGoal),
  });

export function useSubjects() {
  return useQuery({
    queryKey: keys.study.subjects,
    staleTime: stale.catalog,
    queryFn: async () => (await apiList<ApiSubject>('/api/study/subjects/')).map(toSubject),
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubjectInput) => toSubject(await api<ApiSubject>('/api/study/subjects/', { method: 'POST', body: fromSubject(input) })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<SubjectInput>) =>
      toSubject(await api<ApiSubject>(`/api/study/subjects/${id}/`, { method: 'PATCH', body: fromSubject(input) })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/study/subjects/${id}/`, { method: 'DELETE' }),
    // Flashcards da matéria vão junto (cascata no servidor)
    onSuccess: () => invalidate(qc, 'study'),
  });
}

// ---- Cronograma (por semana)

type ApiBlock = ScheduleBlock;

const toBlock = (b: ApiBlock): ScheduleBlock => ({ ...b, start: hhmm(b.start), end: hhmm(b.end) });

export type ScheduleInput = Omit<ScheduleBlock, 'id'>;

export function useSchedule(week: string = weekKey(0)) {
  return useQuery({
    queryKey: keys.study.schedule(week),
    queryFn: async () => (await apiList<ApiBlock>('/api/study/schedule/', { week })).map(toBlock),
  });
}

export function useCreateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ScheduleInput) => toBlock(await api<ApiBlock>('/api/study/schedule/', { method: 'POST', body: input })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useUpdateBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<ScheduleInput>) =>
      toBlock(await api<ApiBlock>(`/api/study/schedule/${id}/`, { method: 'PATCH', body: compact(input) })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useSetBlockStatus() {
  const update = useUpdateBlock();
  return { ...update, mutate: (id: string, status: ScheduleStatus) => update.mutate({ id, status }) };
}

export function useDeleteBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/study/schedule/${id}/`, { method: 'DELETE' }),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

// ---- Flashcards

type ApiFlashcard = Omit<Flashcard, 'subjectId'> & { subject: string };

const toFlashcard = ({ subject, ...c }: ApiFlashcard): Flashcard => ({ ...c, subjectId: subject });

export type FlashcardInput = Pick<Flashcard, 'subjectId' | 'front' | 'back'>;

const fromFlashcard = (i: Partial<FlashcardInput>) => compact({ subject: i.subjectId, front: i.front, back: i.back });

export function useFlashcards() {
  return useQuery({
    queryKey: keys.study.flashcards,
    staleTime: stale.catalog,
    queryFn: async () => (await apiList<ApiFlashcard>('/api/study/flashcards/')).map(toFlashcard),
  });
}

export function useCreateFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FlashcardInput) =>
      toFlashcard(await api<ApiFlashcard>('/api/study/flashcards/', { method: 'POST', body: fromFlashcard(input) })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useUpdateFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<FlashcardInput>) =>
      toFlashcard(await api<ApiFlashcard>(`/api/study/flashcards/${id}/`, { method: 'PATCH', body: fromFlashcard(input) })),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

export function useDeleteFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/study/flashcards/${id}/`, { method: 'DELETE' }),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

/** Resultado da revisão; atualiza o cache na hora para o modal avançar sem esperar o refetch. */
export function useReviewFlashcard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, correct }: { id: string; correct: boolean }) =>
      toFlashcard(await api<ApiFlashcard>(`/api/study/flashcards/${id}/review/`, { method: 'POST', body: { correct } })),
    onSuccess: (card) => {
      qc.setQueryData<Flashcard[]>(keys.study.flashcards, (list) => list?.map((c) => (c.id === card.id ? card : c)));
      // A lista já está certa; só as métricas derivadas (retenção, fila) precisam revalidar
      void qc.invalidateQueries({ queryKey: ['study', 'stats'] });
    },
  });
}

export function useResetReviews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ reset: number }>('/api/study/flashcards/reset-due/', { method: 'POST' }),
    onSuccess: () => invalidate(qc, 'study'),
  });
}

// ---- Horas e sessões

export function useStudyHours(week: string = weekKey(0)) {
  return useQuery({
    queryKey: keys.study.hours(week),
    queryFn: async () => (await api<{ week: string; hours: string[] }>(`/api/study/hours/?week=${week}`)).hours.map(num),
  });
}

/** Soma o tempo de um ciclo do cronômetro ao dia de hoje e à matéria. */
export function useLogStudySession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { seconds: number; subjectId?: string }) =>
      api('/api/study/sessions/', { method: 'POST', body: { seconds: input.seconds, subject: input.subjectId ?? null } }),
    onSuccess: () => {
      invalidate(qc, 'study');
    },
  });
}
