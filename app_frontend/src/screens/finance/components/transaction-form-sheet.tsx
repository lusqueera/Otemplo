import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Field, OptionGroup } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { isoToInput, maskDate, parseAmount, parseDateInput, todayISO } from '@/lib/format';
import { useCreateTransaction, useUpdateTransaction } from '@/api/finance';
import { colors } from '@/theme/colors';
import { KIND_LABEL, TRANSACTION_ICONS, type Transaction, type TransactionIcon, type TransactionKind } from '../data';

type TransactionFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction;
  onDelete?: (transaction: Transaction) => void;
};

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as TransactionKind[]).map((value) => ({
  value,
  label: KIND_LABEL[value],
}));

const EMPTY = {
  title: '',
  category: '',
  kind: 'essential' as TransactionKind,
  amount: '',
  date: '',
  icon: TRANSACTION_ICONS[3] as TransactionIcon,
};

export function TransactionFormSheet({ visible, onClose, transaction, onDelete }: TransactionFormSheetProps) {
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const saving = createTransaction.isPending || updateTransaction.isPending;

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!visible) return;
    setForm(
      transaction
        ? {
            title: transaction.title,
            category: transaction.category,
            kind: transaction.kind,
            amount: transaction.amount.toFixed(2).replace('.', ','),
            date: isoToInput(transaction.date),
            icon: transaction.icon,
          }
        : { ...EMPTY, date: isoToInput(todayISO()) },
    );
  }, [visible, transaction]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const amount = parseAmount(form.amount);
  const date = parseDateInput(form.date);
  const validAmount = Number.isFinite(amount) && amount > 0;
  const canSave = form.title.trim().length > 0 && validAmount && !!date;

  function handleSave() {
    if (!date) return;
    const input = {
      title: form.title.trim(),
      category: form.category.trim() || KIND_LABEL[form.kind],
      kind: form.kind,
      amount: Math.round(amount * 100) / 100,
      date,
      icon: form.icon,
    };
    if (transaction) updateTransaction.mutate({ id: transaction.id, ...input }, { onSuccess: onClose });
    else createTransaction.mutate(input, { onSuccess: onClose });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={transaction ? 'Editar transação' : 'Novo aporte / transação'}
      footer={
        <>
          <SheetButton label={transaction ? 'Salvar alterações' : 'Registrar'} onPress={handleSave} disabled={!canSave} loading={saving} />
          {transaction && onDelete && (
            <SheetButton label="Excluir transação" variant="danger" onPress={() => onDelete(transaction)} />
          )}
        </>
      }
    >
      <OptionGroup label="Tipo" options={KIND_OPTIONS} value={form.kind} onChange={(v) => patch('kind', v)} />

      <Field
        label="Descrição"
        placeholder="Ex.: Aporte Tesouro Selic"
        value={form.title}
        onChangeText={(v) => patch('title', v)}
        autoFocus={!transaction}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field
            label="Valor (R$)"
            placeholder="0,00"
            value={form.amount}
            onChangeText={(v) => patch('amount', v)}
            keyboardType="decimal-pad"
            hint={form.amount && !validAmount ? 'Informe um valor maior que zero.' : undefined}
          />
        </View>
        <View style={styles.half}>
          <Field
            label="Data"
            placeholder="DD/MM/AAAA"
            value={form.date}
            onChangeText={(v) => patch('date', maskDate(v))}
            keyboardType="number-pad"
            maxLength={10}
            hint={form.date && !date ? 'Data inválida.' : undefined}
          />
        </View>
      </View>

      <Field
        label="Categoria"
        placeholder="Ex.: Moradia, Investimentos, Ferramentas"
        value={form.category}
        onChangeText={(v) => patch('category', v)}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Ícone</Text>
        <View style={styles.icons}>
          {TRANSACTION_ICONS.map((icon) => {
            const selected = icon === form.icon;
            return (
              <Pressable
                key={icon}
                style={[styles.iconOption, selected && styles.iconOptionSelected]}
                onPress={() => patch('icon', icon)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
              >
                <MaterialCommunityIcons name={icon} size={20} color={selected ? colors.buttonText : colors.text} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  icons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOptionSelected: {
    backgroundColor: colors.text,
  },
});
