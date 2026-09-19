import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Field } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { confirmDelete } from '@/lib/confirm';
import { formatBRL, parseAmount } from '@/lib/format';
import { useAllocation, useCreateAssetClass, useDeleteAssetClass, useUpdateAssetClass } from '@/api/finance';
import { colors } from '@/theme/colors';
import type { AssetClass } from '../data';

type AllocationSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type Mode = { kind: 'list' } | { kind: 'form'; asset?: AssetClass };

/** Gerencia as classes de ativos: lista, cria, edita e exclui. */
export function AllocationSheet({ visible, onClose }: AllocationSheetProps) {
  const { data: allocation = [] } = useAllocation();
  const createAssetClass = useCreateAssetClass();
  const updateAssetClass = useUpdateAssetClass();
  const deleteAssetClass = useDeleteAssetClass();

  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [form, setForm] = useState({ name: '', amount: '' });

  useEffect(() => {
    if (visible) setMode({ kind: 'list' });
  }, [visible]);

  const total = allocation.reduce((acc, a) => acc + a.amount, 0);

  function openForm(asset?: AssetClass) {
    setForm(asset ? { name: asset.name, amount: asset.amount.toFixed(2).replace('.', ',') } : { name: '', amount: '' });
    setMode({ kind: 'form', asset });
  }

  const amount = parseAmount(form.amount);
  const canSave = form.name.trim().length > 0 && Number.isFinite(amount) && amount >= 0;

  function handleSave() {
    if (mode.kind !== 'form') return;
    const input = { name: form.name.trim(), amount: Math.round(amount * 100) / 100 };
    if (mode.asset) updateAssetClass.mutate({ id: mode.asset.id, ...input });
    else createAssetClass.mutate(input);
    setMode({ kind: 'list' });
  }

  function handleDelete() {
    if (mode.kind !== 'form' || !mode.asset) return;
    const asset = mode.asset;
    confirmDelete('Excluir classe', `"${asset.name}" será removida da alocação.`, () => {
      deleteAssetClass.mutate(asset.id);
      setMode({ kind: 'list' });
    });
  }

  if (mode.kind === 'form') {
    return (
      <Sheet
        visible={visible}
        onClose={onClose}
        title={mode.asset ? 'Editar classe' : 'Nova classe de ativo'}
        footer={
          <>
            <SheetButton label={mode.asset ? 'Salvar alterações' : 'Adicionar classe'} onPress={handleSave} disabled={!canSave} />
            {mode.asset ? (
              <SheetButton label="Excluir classe" variant="danger" onPress={handleDelete} />
            ) : (
              <SheetButton label="Voltar" variant="secondary" onPress={() => setMode({ kind: 'list' })} />
            )}
          </>
        }
      >
        <Field
          label="Nome"
          placeholder="Ex.: Renda Fixa & Reserva"
          value={form.name}
          onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
          autoFocus={!mode.asset}
        />
        <Field
          label="Valor alocado (R$)"
          placeholder="0,00"
          value={form.amount}
          onChangeText={(v) => setForm((f) => ({ ...f, amount: v }))}
          keyboardType="decimal-pad"
          hint={form.amount && !Number.isFinite(amount) ? 'Informe um valor válido.' : undefined}
        />
      </Sheet>
    );
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Alocação de ativos"
      subtitle={`${allocation.length} classes • ${formatBRL(total, { compact: true })} no total`}
      footer={<SheetButton label="Nova classe" onPress={() => openForm()} />}
    >
      {allocation.length === 0 ? (
        <Text style={styles.empty}>Nenhuma classe cadastrada.</Text>
      ) : (
        <View style={styles.list}>
          {allocation.map((asset) => {
            const share = total ? Math.round((asset.amount / total) * 100) : 0;
            return (
              <Pressable key={asset.id} style={styles.row} onPress={() => openForm(asset)} accessibilityRole="button">
                <View style={[styles.dot, { backgroundColor: asset.tone }]} />
                <View style={styles.rowText}>
                  <Text style={styles.rowName}>{asset.name}</Text>
                  <Text style={styles.rowMeta}>
                    {share}% • {formatBRL(asset.amount, { compact: true })}
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
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
  },
});
