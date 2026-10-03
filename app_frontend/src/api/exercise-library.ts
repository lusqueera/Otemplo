import { useQuery } from '@tanstack/react-query';

import type { ExerciseGroup, ExerciseIcon } from '@/screens/training/data';
import NAMES_PT from './exercise-names-pt.json';
import type { ExerciseInput } from './training';

const namesPt: Record<string, string> = NAMES_PT;

/**
 * Biblioteca pública de exercícios.
 *
 * Fonte: free-exercise-db (yuhonas, licença pública/Unlicense) — 870+ exercícios com duas
 * fotos por exercício (posição inicial e final), que o app alterna para simular a execução.
 * O ExerciseDB pedido originalmente (JHeisecke/jh-exercisedb-api) está fora do ar: a instância
 * pública responde 402 DEPLOYMENT_DISABLED e o fork responde 500 sem banco — e o dataset
 * não vem no repositório.
 *
 * Tradução: a base é só em inglês. Os nomes vêm de `exercise-names-pt.json` (tradução fixa por
 * id, com o jargão de academia brasileiro); categorias, músculos, equipamento e nível são
 * mapeados aqui. As instruções traduzidas (~540 KB) ficam no Supabase Storage e só são baixadas
 * quando alguém abre o detalhe de um exercício (`useExerciseInstructionsPt`).
 */

const BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';

type RawExercise = {
  id: string;
  name: string;
  force: 'pull' | 'push' | 'static' | null;
  level: 'beginner' | 'intermediate' | 'expert';
  mechanic: 'compound' | 'isolation' | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
};

/** Agrupamento por região do corpo — é o filtro principal da aba. */
export type BodyPart = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core' | 'neck';

export const BODY_PART_LABEL: Record<BodyPart, string> = {
  chest: 'Peito',
  back: 'Costas',
  shoulders: 'Ombros',
  arms: 'Braços',
  legs: 'Pernas',
  glutes: 'Glúteos',
  core: 'Abdômen',
  neck: 'Pescoço',
};

export const BODY_PARTS = Object.keys(BODY_PART_LABEL) as BodyPart[];

const MUSCLE_BODY_PART: Record<string, BodyPart> = {
  chest: 'chest',
  lats: 'back',
  'middle back': 'back',
  'lower back': 'back',
  traps: 'back',
  shoulders: 'shoulders',
  biceps: 'arms',
  triceps: 'arms',
  forearms: 'arms',
  quadriceps: 'legs',
  hamstrings: 'legs',
  calves: 'legs',
  abductors: 'legs',
  adductors: 'legs',
  glutes: 'glutes',
  abdominals: 'core',
  neck: 'neck',
};

const MUSCLE_LABEL: Record<string, string> = {
  abdominals: 'Abdômen',
  abductors: 'Abdutores',
  adductors: 'Adutores',
  biceps: 'Bíceps',
  calves: 'Panturrilhas',
  chest: 'Peitoral',
  forearms: 'Antebraços',
  glutes: 'Glúteos',
  hamstrings: 'Posteriores de coxa',
  lats: 'Dorsais',
  'lower back': 'Lombar',
  'middle back': 'Meio das costas',
  neck: 'Pescoço',
  quadriceps: 'Quadríceps',
  shoulders: 'Ombros',
  traps: 'Trapézio',
  triceps: 'Tríceps',
};

const EQUIPMENT_LABEL: Record<string, string> = {
  'body only': 'Peso corporal',
  machine: 'Máquina',
  other: 'Outro',
  'foam roll': 'Rolo de espuma',
  kettlebells: 'Kettlebell',
  dumbbell: 'Halteres',
  cable: 'Cabo / polia',
  barbell: 'Barra',
  bands: 'Elásticos',
  'medicine ball': 'Medicine ball',
  'exercise ball': 'Bola suíça',
  'e-z curl bar': 'Barra W',
};

const LEVEL_LABEL: Record<RawExercise['level'], string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  expert: 'Avançado',
};

const CATEGORY_LABEL: Record<string, string> = {
  strength: 'Força',
  stretching: 'Alongamento',
  plyometrics: 'Pliometria',
  strongman: 'Strongman',
  powerlifting: 'Powerlifting',
  cardio: 'Cardio',
  'olympic weightlifting': 'LPO',
};

export type LibraryExercise = {
  id: string;
  /** Nome em português (cai no original se o id ainda não tiver tradução). */
  name: string;
  /** Nome original em inglês. */
  nameEn: string;
  bodyPart: BodyPart;
  /** Rótulos já traduzidos. */
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  level: string;
  category: string;
  /** Inglês (fonte não traduzida). */
  instructions: string[];
  /** URLs absolutas: [posição inicial, posição final]. */
  images: string[];
  /** Para busca sem acento/caixa. */
  searchText: string;
  raw: Pick<RawExercise, 'category' | 'equipment' | 'primaryMuscles'>;
};

const label = (map: Record<string, string>, key: string | null | undefined, fallback = '—') =>
  key ? (map[key] ?? key) : fallback;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function toLibraryExercise(e: RawExercise): LibraryExercise {
  const primary = e.primaryMuscles.map((m) => label(MUSCLE_LABEL, m));
  const secondary = e.secondaryMuscles.map((m) => label(MUSCLE_LABEL, m));
  const name = namesPt[e.id] ?? e.name;
  return {
    id: e.id,
    name,
    nameEn: e.name,
    bodyPart: MUSCLE_BODY_PART[e.primaryMuscles[0]] ?? 'core',
    primaryMuscles: primary,
    secondaryMuscles: secondary,
    equipment: label(EQUIPMENT_LABEL, e.equipment, 'Sem equipamento'),
    level: LEVEL_LABEL[e.level] ?? e.level,
    category: label(CATEGORY_LABEL, e.category),
    instructions: e.instructions,
    images: e.images.map((path) => `${BASE}/exercises/${path}`),
    // Busca pelo nome em português e pelo original (quem conhece o exercício em inglês também acha)
    searchText: normalize([name, e.name, ...primary, ...secondary, e.equipment ?? ''].join(' ')),
    raw: { category: e.category, equipment: e.equipment, primaryMuscles: e.primaryMuscles },
  };
}

/** Catálogo completo (≈1 MB). Muda raramente: fica 24 h fresco e persiste em disco. */
export function useExerciseLibrary() {
  return useQuery({
    // Versão na chave: o catálogo transformado fica persistido; mudar a tradução exige descartar o antigo
    queryKey: ['exercise-library', 'pt-1'],
    staleTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      const res = await fetch(`${BASE}/dist/exercises.json`);
      if (!res.ok) throw new Error(`Biblioteca indisponível (${res.status})`);
      const data = (await res.json()) as RawExercise[];
      return data.filter((e) => e.images.length > 0).map(toLibraryExercise);
    },
  });
}

// Arquivo imutável: uma tradução nova sobe com outro sufixo (-v2) e a chave abaixo muda junto
const INSTRUCTIONS_PT_URL =
  'https://wugegyteypumgjjihjmt.supabase.co/storage/v1/object/public/media/library/exercise-instructions-pt-v1.json';

/** Instruções em português por id do exercício. Baixadas uma vez e mantidas em cache. */
export function useExerciseInstructionsPt(enabled = true) {
  return useQuery({
    queryKey: ['exercise-library', 'instructions-pt-v1'],
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch(INSTRUCTIONS_PT_URL);
      if (!res.ok) throw new Error(`Instruções indisponíveis (${res.status})`);
      return (await res.json()) as Record<string, string[]>;
    },
  });
}

/** Converte um item da biblioteca no exercício de uma ficha do app (séries/carga padrão). */
export function toExerciseInput(e: LibraryExercise): ExerciseInput {
  const cardioLike = e.raw.category === 'cardio' || e.raw.category === 'stretching' || e.raw.category === 'plyometrics';
  const group: ExerciseGroup = cardioLike ? 'cardio' : 'abc';
  const icon: ExerciseIcon =
    e.raw.category === 'stretching'
      ? 'yoga'
      : e.raw.category === 'cardio'
        ? 'run'
        : e.raw.equipment === 'dumbbell' || e.raw.equipment === 'kettlebells'
          ? 'dumbbell'
          : e.raw.equipment === 'body only' || e.raw.equipment == null
            ? 'human-handsup'
            : 'weight-lifter';
  return {
    name: e.name,
    sets: 3,
    reps: e.raw.category === 'stretching' ? '30 seg' : '10 reps',
    load: 0,
    muscle: e.primaryMuscles[0] ?? '',
    group,
    icon,
  };
}
