import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ProgressBar } from '@/components/progress-bar';
import { useFlashcards, useReviewFlashcard, useSubjects } from '@/api/study';
import { colors } from '@/theme/colors';

type FlashcardReviewModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function FlashcardReviewModal({ visible, onClose }: FlashcardReviewModalProps) {
  const { data: flashcards = [] } = useFlashcards();
  const due = useMemo(() => flashcards.filter((c) => c.due), [flashcards]);
  const { data: subjects = [] } = useSubjects();
  const reviewFlashcard = useReviewFlashcard();

  // Fila congelada na abertura: revisar um card o tira de `due`, mas o total da sessão não muda
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hits, setHits] = useState(0);

  useEffect(() => {
    if (!visible) return;
    setQueue(due.map((c) => c.id));
    setIndex(0);
    setRevealed(false);
    setHits(0);
    // `due` só importa no momento da abertura
  }, [visible]);

  const total = queue.length;
  const finished = index >= total;
  const card = flashcards.find((c) => c.id === queue[index]);
  const subject = subjects.find((s) => s.id === card?.subjectId);

  function answer(correct: boolean) {
    if (!card) return;
    reviewFlashcard.mutate({ id: card.id, correct });
    if (correct) setHits((h) => h + 1);
    setRevealed(false);
    setIndex((i) => i + 1);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Pressable style={styles.close} onPress={onClose} hitSlop={8} accessibilityLabel="Fechar">
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.overline}>Banco de memorização</Text>
            <Text style={styles.counter}>
              {finished ? total : index + 1} / {total}
            </Text>
          </View>
          <View style={styles.close} />
        </View>

        <ProgressBar value={total ? (finished ? 1 : index / total) : 0} height={4} />

        {finished || !card ? (
          <View style={styles.summary}>
            <View style={styles.summaryIcon}>
              <Feather name="check" size={28} color={colors.buttonText} />
            </View>
            <Text style={styles.summaryTitle}>
              {total === 0 ? 'Nada pendente por hoje' : 'Revisão concluída'}
            </Text>
            <Text style={styles.summaryText}>
              {total === 0
                ? 'Todos os flashcards já foram revisados. Volte amanhã ou adicione novos cards.'
                : `Você acertou ${hits} de ${total} cards. Os erros voltam para a fila na próxima revisão.`}
            </Text>
            <Pressable style={styles.primary} onPress={onClose} accessibilityRole="button">
              <Text style={styles.primaryLabel}>Voltar aos estudos</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.body}>
            <Pressable style={styles.card} onPress={() => setRevealed(true)} accessibilityRole="button">
              <Text style={styles.cardSubject}>{subject?.title ?? 'Sem matéria'}</Text>
              <Text style={styles.cardSide}>{revealed ? 'Resposta' : 'Pergunta'}</Text>
              <Text style={styles.cardText}>{revealed ? card.back : card.front}</Text>
              {!revealed && <Text style={styles.cardHint}>Toque para revelar a resposta</Text>}
            </Pressable>

            {revealed ? (
              <View style={styles.answers}>
                <Pressable style={[styles.answer, styles.answerMiss]} onPress={() => answer(false)}>
                  <Feather name="x" size={18} color={colors.danger} />
                  <Text style={[styles.answerLabel, { color: colors.danger }]}>Errei</Text>
                </Pressable>
                <Pressable style={[styles.answer, styles.answerHit]} onPress={() => answer(true)}>
                  <Feather name="check" size={18} color={colors.buttonText} />
                  <Text style={[styles.answerLabel, { color: colors.buttonText }]}>Acertei</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.primary} onPress={() => setRevealed(true)} accessibilityRole="button">
                <Text style={styles.primaryLabel}>Mostrar resposta</Text>
              </Pressable>
            )}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    alignItems: 'center',
    gap: 2,
  },
  overline: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  counter: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 28,
    minHeight: 300,
    justifyContent: 'center',
    gap: 12,
  },
  cardSubject: {
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardSide: {
    color: colors.placeholder,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardText: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 31,
    fontWeight: '500',
  },
  cardHint: {
    color: colors.placeholder,
    fontSize: 12,
    marginTop: 12,
  },
  primary: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: '600',
  },
  answers: {
    flexDirection: 'row',
    gap: 12,
  },
  answer: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  answerMiss: {
    borderWidth: 1,
    borderColor: colors.danger,
  },
  answerHit: {
    backgroundColor: colors.text,
  },
  answerLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  summary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  summaryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  summaryText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 12,
  },
});
