import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Field, OptionGroup } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { useCreateFlashcard, useDeleteFlashcard, useFlashcards, useResetReviews, useSubjects, useUpdateFlashcard } from '@/api/study';
import { colors } from '@/theme/colors';
import type { Flashcard } from '../data';

type FlashcardsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type Mode = { kind: 'list' } | { kind: 'form'; card?: Flashcard };

const EMPTY = { subjectId: '', front: '', back: '' };

/** Gerencia o banco de flashcards: lista, cria, edita e exclui. */
export function FlashcardsSheet({ visible, onClose }: FlashcardsSheetProps) {
  const { data: flashcards = [] } = useFlashcards();
  const { data: subjects = [] } = useSubjects();
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const resetReviews = useResetReviews();

  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (visible) setMode({ kind: 'list' });
  }, [visible]);

  function openForm(card?: Flashcard) {
    setForm(
      card
        ? { subjectId: card.subjectId, front: card.front, back: card.back }
        : { ...EMPTY, subjectId: subjects[0]?.id ?? '' },
    );
    setMode({ kind: 'form', card });
  }

  function handleSave() {
    if (mode.kind !== 'form') return;
    const input = { subjectId: form.subjectId, front: form.front.trim(), back: form.back.trim() };
    const backToList = () => setMode({ kind: 'list' });
    if (mode.card) updateFlashcard.mutate({ id: mode.card.id, ...input }, { onSuccess: backToList });
    else createFlashcard.mutate(input, { onSuccess: backToList });
  }

  function handleDelete() {
    if (mode.kind !== 'form' || !mode.card) return;
    deleteFlashcard.mutate(mode.card.id, { onSuccess: () => setMode({ kind: 'list' }) });
  }

  const dueCount = flashcards.filter((c) => c.due).length;
  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.title }));
  const canSave = form.subjectId && form.front.trim() && form.back.trim();

  if (mode.kind === 'form') {
    return (
      <Sheet
        visible={visible}
        onClose={onClose}
        title={mode.card ? 'Editar flashcard' : 'Novo flashcard'}
        footer={
          <>
            <SheetButton label={mode.card ? 'Salvar alterações' : 'Adicionar ao banco'} onPress={handleSave} disabled={!canSave} loading={createFlashcard.isPending || updateFlashcard.isPending} />
            {mode.card ? (
              <SheetButton label="Excluir flashcard" variant="danger" onPress={handleDelete} loading={deleteFlashcard.isPending} />
            ) : (
              <SheetButton label="Voltar" variant="secondary" onPress={() => setMode({ kind: 'list' })} />
            )}
          </>
        }
      >
        {subjectOptions.length === 0 ? (
          <Text style={styles.empty}>Cadastre uma matéria antes de criar flashcards.</Text>
        ) : (
          <OptionGroup
            label="Matéria"
            options={subjectOptions}
            value={form.subjectId}
            onChange={(v) => setForm((f) => ({ ...f, subjectId: v }))}
          />
        )}
        <Field
          label="Pergunta (frente)"
          placeholder="O que você quer memorizar?"
          value={form.front}
          onChangeText={(v) => setForm((f) => ({ ...f, front: v }))}
          multiline
          autoFocus={!mode.card}
        />
        <Field
          label="Resposta (verso)"
          placeholder="A resposta que deve vir à mente"
          value={form.back}
          onChangeText={(v) => setForm((f) => ({ ...f, back: v }))}
          multiline
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Banco de memorização"
      subtitle={`${flashcards.length} cards • ${dueCount} pendentes hoje`}
      footer={
        <>
          <SheetButton label="Novo flashcard" onPress={() => openForm()} disabled={subjects.length === 0} />
          {dueCount < flashcards.length && (
            <SheetButton label="Recolocar todos na fila" variant="secondary" onPress={() => resetReviews.mutate()} loading={resetReviews.isPending} />
          )}
        </>
      }
    >
      {flashcards.length === 0 ? (
        <Text style={styles.empty}>Nenhum flashcard ainda. Crie o primeiro para começar a revisar.</Text>
      ) : (
        <View style={styles.list}>
          {flashcards.map((card) => {
            const subject = subjects.find((s) => s.id === card.subjectId);
            return (
              <Pressable key={card.id} style={styles.row} onPress={() => openForm(card)} accessibilityRole="button">
                <View style={[styles.dueDot, card.due && styles.dueDotActive]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowFront} numberOfLines={2}>
                    {card.front}
                  </Text>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {subject?.title ?? 'Sem matéria'} • {card.hits}✓ {card.misses}✗
                  </Text>
                </View>
                <Feather name="edit-2" size={14} color={colors.muted} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.tile,
    borderRadius: 12,
    padding: 12,
  },
  dueDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.track,
  },
  dueDotActive: {
    backgroundColor: colors.text,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowFront: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 19,
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
  },
});
