import { create } from 'zustand';

import { BODY_PART_LABEL, type BodyPart, type LibraryExercise } from '@/api/exercise-library';

// Carrinho da Biblioteca: exercícios escolhidos que vão virar um treino. Só UI (memória).

type CartState = {
  items: LibraryExercise[];
  has: (id: string) => boolean;
  toggle: (exercise: LibraryExercise) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useLibraryCart = create<CartState>((set, get) => ({
  items: [],
  has: (id) => get().items.some((e) => e.id === id),
  toggle: (exercise) =>
    set((s) => ({
      items: s.items.some((e) => e.id === exercise.id) ? s.items.filter((e) => e.id !== exercise.id) : [...s.items, exercise],
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((e) => e.id !== id) })),
  clear: () => set({ items: [] }),
}));

/** Regiões do corpo presentes no carrinho, da mais frequente para a menos. */
export function bodyPartBreakdown(items: LibraryExercise[]): { part: BodyPart; count: number }[] {
  const counts = new Map<BodyPart, number>();
  for (const e of items) counts.set(e.bodyPart, (counts.get(e.bodyPart) ?? 0) + 1);
  return [...counts.entries()].map(([part, count]) => ({ part, count })).sort((a, b) => b.count - a.count);
}

/**
 * Nome sugerido a partir do que foi escolhido:
 * - só alongamento/cardio → "Cardio & Mobilidade"
 * - 1 região, ou uma região com ≥ 70% dos exercícios → "Treino de Costas"
 * - 2 regiões → "Treino de Peito e Braços"
 * - 3 regiões → "Treino de Pernas, Glúteos e Abdômen"
 * - 4+ regiões → "Treino Full Body"
 */
export function suggestWorkoutTitle(items: LibraryExercise[]): string {
  if (items.length === 0) return '';
  const mobility = items.every((e) => e.raw.category === 'stretching' || e.raw.category === 'cardio');
  if (mobility) return 'Cardio & Mobilidade';

  const parts = bodyPartBreakdown(items);
  const [main] = parts;
  if (parts.length === 1 || main.count / items.length >= 0.7) return `Treino de ${BODY_PART_LABEL[main.part]}`;
  if (parts.length >= 4) return 'Treino Full Body';
  const names = parts.map((p) => BODY_PART_LABEL[p.part]);
  const last = names.pop();
  return `Treino de ${names.join(', ')} e ${last}`;
}

/** Descrição curta: "6 exercícios · Costas (4), Bíceps (2)". */
export function describeCart(items: LibraryExercise[]): string {
  const parts = bodyPartBreakdown(items)
    .map((p) => `${BODY_PART_LABEL[p.part]} (${p.count})`)
    .join(', ');
  return `${items.length} ${items.length === 1 ? 'exercício' : 'exercícios'} · ${parts}`;
}
