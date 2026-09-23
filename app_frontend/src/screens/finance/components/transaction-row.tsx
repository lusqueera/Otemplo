import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { formatBRL, formatDateShort } from '@/lib/format';
import { DeletingOverlay } from '@/components/deleting-overlay';
import { colors } from '@/theme/colors';
import type { Transaction } from '../data';

type TransactionRowProps = {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  /** Fundo mais escuro quando renderizada dentro de um sheet. */
  onCard?: boolean;
  /** Exclusão em andamento: linha fica coberta e inerte. */
  deleting?: boolean;
};

export function TransactionRow({ transaction, onPress, onCard, deleting }: TransactionRowProps) {
  // Investimento é aporte (fica no patrimônio), então aparece como entrada, não como gasto
  const isIncome = transaction.kind === 'income' || transaction.kind === 'investment';
  return (
    <Pressable
      style={[styles.row, onCard && styles.rowOnCard]}
      onPress={() => onPress(transaction)}
      accessibilityRole="button"
      disabled={deleting}
    >
      <View style={[styles.icon, onCard && styles.iconOnCard]}>
        <MaterialCommunityIcons name={transaction.icon} size={20} color={colors.text} />
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.title}
        </Text>
        <View style={styles.meta}>
          <View style={[styles.category, onCard && styles.iconOnCard]}>
            <Text style={styles.categoryText} numberOfLines={1}>
              {transaction.category}
            </Text>
          </View>
          <Text style={styles.date}>• {formatDateShort(transaction.date)}</Text>
        </View>
      </View>

      <Text style={[styles.amount, isIncome ? styles.amountIn : styles.amountOut]}>
        {isIncome ? '+' : '−'}
        {formatBRL(transaction.amount)}
      </Text>
      {deleting && <DeletingOverlay />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
  },
  rowOnCard: {
    backgroundColor: colors.tile,
    padding: 12,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnCard: {
    backgroundColor: colors.input,
  },
  text: {
    flex: 1,
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  category: {
    backgroundColor: colors.tile,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexShrink: 1,
  },
  categoryText: {
    color: colors.muted,
    fontSize: 11,
  },
  date: {
    color: colors.muted,
    fontSize: 11,
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  amountIn: {
    color: colors.text,
  },
  amountOut: {
    color: colors.muted,
  },
});
