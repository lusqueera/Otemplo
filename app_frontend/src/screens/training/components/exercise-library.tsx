import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { BODY_PART_LABEL, BODY_PARTS, useExerciseLibrary, type BodyPart, type LibraryExercise } from '@/api/exercise-library';
import { ChipRow } from '@/components/chip-row';
import { SectionHeader } from '@/components/section-header';
import { describeCart, useLibraryCart } from '@/store/library-cart';
import { colors } from '@/theme/colors';
import { LibraryCartSheet } from './library-cart-sheet';
import { LibraryExerciseSheet } from './library-exercise-sheet';

const PAGE = 30;

type ExerciseLibraryProps = {
  /** Padding lateral da tela, para os chips sangrarem até a borda. */
  inset: number;
  /** Depois de criar o treino a partir do carrinho. */
  onWorkoutCreated: () => void;
};

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Aba "Biblioteca": exercícios prontos por região do corpo, com busca e demonstração. */
export function ExerciseLibrary({ inset, onWorkoutCreated }: ExerciseLibraryProps) {
  const { data: library = [], isPending, isError, refetch } = useExerciseLibrary();
  const [bodyPart, setBodyPart] = useState<'all' | BodyPart>('all');
  const [search, setSearch] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<LibraryExercise | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useLibraryCart((s) => s.items);
  const toggleCart = useLibraryCart((s) => s.toggle);
  const inCart = useMemo(() => new Set(cart.map((e) => e.id)), [cart]);

  const counts = useMemo(() => {
    const c = {} as Record<BodyPart, number>;
    for (const e of library) c[e.bodyPart] = (c[e.bodyPart] ?? 0) + 1;
    return c;
  }, [library]);

  const chips = useMemo(
    () => [
      { id: 'all', label: `Todos (${library.length})` },
      ...BODY_PARTS.map((p) => ({
        id: p,
        label: `${BODY_PART_LABEL[p]} (${counts[p] ?? 0})`,
      })),
    ],
    [library.length, counts],
  );

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return library.filter((e) => (bodyPart === 'all' || e.bodyPart === bodyPart) && (!q || e.searchText.includes(q)));
  }, [library, bodyPart, search]);
  const visible = filtered.slice(0, limit);

  const select = (id: string) => {
    setBodyPart(id as 'all' | BodyPart);
    setLimit(PAGE);
  };

  return (
    <View style={styles.root}>
      <View style={styles.search}>
        <Feather name="search" size={16} color={colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exercício, músculo ou equipamento"
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={(v) => {
            setSearch(v);
            setLimit(PAGE);
          }}
          autoCorrect={false}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8} accessibilityLabel="Limpar busca">
            <Feather name="x" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      <ChipRow chips={chips} selectedId={bodyPart} onSelect={select} inset={inset} />

      <SectionHeader
        title={bodyPart === 'all' ? 'Exercícios' : BODY_PART_LABEL[bodyPart]}
        count={filtered.length}
        right="Toque para ver a execução"
      />

      {isPending ? (
        <View style={styles.state}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.stateText}>Carregando biblioteca…</Text>
        </View>
      ) : isError ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>Não foi possível carregar a biblioteca.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()} accessibilityRole="button">
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>Nenhum exercício encontrado.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((e) => (
            <LibraryRow key={e.id} exercise={e} inCart={inCart.has(e.id)} onPress={setSelected} onToggleCart={toggleCart} />
          ))}
          {filtered.length > limit && (
            <Pressable style={styles.more} onPress={() => setLimit((l) => l + PAGE)} accessibilityRole="button">
              <Text style={styles.moreText}>Mostrar mais ({filtered.length - limit} restantes)</Text>
            </Pressable>
          )}
        </View>
      )}

      <Text style={styles.credit}>Fonte: free-exercise-db (domínio público). Instruções em inglês.</Text>

      {cart.length > 0 && (
        <Pressable style={styles.cartBar} onPress={() => setCartOpen(true)} accessibilityRole="button">
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
          <View style={styles.cartText}>
            <Text style={styles.cartTitle}>Montar treino</Text>
            <Text style={styles.cartMeta} numberOfLines={1}>
              {describeCart(cart)}
            </Text>
          </View>
          <Feather name="arrow-right" size={18} color={colors.buttonText} />
        </Pressable>
      )}

      <LibraryExerciseSheet exercise={selected} onClose={() => setSelected(null)} />
      <LibraryCartSheet visible={cartOpen} onClose={() => setCartOpen(false)} onCreated={onWorkoutCreated} />
    </View>
  );
}

type LibraryRowProps = {
  exercise: LibraryExercise;
  inCart: boolean;
  onPress: (e: LibraryExercise) => void;
  onToggleCart: (e: LibraryExercise) => void;
};

function LibraryRow({ exercise, inCart, onPress, onToggleCart }: LibraryRowProps) {
  return (
    // View por fora: o botão do carrinho é irmão do Pressable (botão aninhado quebra na web)
    <View style={[styles.row, inCart && styles.rowInCart]}>
      <Pressable style={styles.rowBody} onPress={() => onPress(exercise)} accessibilityRole="button">
        <Image source={{ uri: exercise.images[0] }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {exercise.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {exercise.primaryMuscles.join(', ')} • {exercise.equipment}
          </Text>
          <Text style={styles.level}>{exercise.level}</Text>
        </View>
      </Pressable>
      <Pressable
        style={[styles.cartButton, inCart && styles.cartButtonOn]}
        onPress={() => onToggleCart(exercise)}
        hitSlop={6}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: inCart }}
        accessibilityLabel={inCart ? 'Remover do treino' : 'Adicionar ao treino'}
      >
        <Feather name={inCart ? 'check' : 'plus'} size={16} color={inCart ? colors.buttonText : colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.input,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  list: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.card,
  },
  rowInCart: {
    borderColor: colors.border,
    backgroundColor: colors.tile,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartButtonOn: {
    backgroundColor: colors.text,
  },
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.text,
    borderRadius: 16,
    padding: 12,
    paddingRight: 16,
  },
  cartBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cartText: {
    flex: 1,
    gap: 2,
  },
  cartTitle: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: '600',
  },
  cartMeta: {
    color: 'rgba(19, 19, 19, 0.65)',
    fontSize: 12,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.tile,
  },
  text: {
    flex: 1,
    gap: 3,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    color: colors.muted,
    fontSize: 12,
  },
  level: {
    color: colors.placeholder,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  more: {
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  state: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    color: colors.muted,
    fontSize: 14,
  },
  retry: {
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.tile,
    justifyContent: 'center',
  },
  retryText: {
    color: colors.text,
    fontSize: 14,
  },
  credit: {
    color: colors.placeholder,
    fontSize: 11,
    textAlign: 'center',
  },
});
