import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, OptionGroup } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { maskTime, TIME_RE } from '@/lib/format';
import { useCreateBlock, useUpdateBlock } from '@/api/study';
import type { ScheduleBlock, ScheduleStatus } from '../data';

type ScheduleFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Dia (ISO) para novos blocos. */
  date: string;
  /** Bloco em edição; `undefined` cria um novo. */
  block?: ScheduleBlock;
  onDelete?: (block: ScheduleBlock) => void;
};

const STATUS_OPTIONS: { value: ScheduleStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'next', label: 'Próximo' },
  { value: 'done', label: 'Concluído' },
];

const EMPTY = {
  title: '',
  description: '',
  start: '',
  end: '',
  status: 'pending' as ScheduleStatus,
};

export function ScheduleFormSheet({ visible, onClose, date, block, onDelete }: ScheduleFormSheetProps) {
  const createBlock = useCreateBlock();
  const updateBlock = useUpdateBlock();

  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!visible) return;
    setForm(
      block
        ? {
            title: block.title,
            description: block.description,
            start: block.start,
            end: block.end,
            status: block.status,
          }
        : EMPTY,
    );
  }, [visible, block]);

  const validTimes = TIME_RE.test(form.start) && TIME_RE.test(form.end) && form.start < form.end;
  const canSave = form.title.trim().length > 0 && validTimes;

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const input = { ...form, title: form.title.trim(), description: form.description.trim() };
    if (block) updateBlock.mutate({ id: block.id, ...input });
    else createBlock.mutate({ ...input, date });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={block ? 'Editar bloco' : 'Novo bloco de estudo'}
      footer={
        <>
          <SheetButton label={block ? 'Salvar alterações' : 'Adicionar ao cronograma'} onPress={handleSave} disabled={!canSave} />
          {block && onDelete && (
            <SheetButton label="Remover bloco" variant="danger" onPress={() => onDelete(block)} />
          )}
        </>
      }
    >
      <Field
        label="Atividade"
        placeholder="Ex.: Leitura Crítica e Fichamento"
        value={form.title}
        onChangeText={(v) => patch('title', v)}
        autoFocus={!block}
      />
      <Field
        label="Descrição"
        placeholder="Capítulo, tema ou objetivo do bloco"
        value={form.description}
        onChangeText={(v) => patch('description', v)}
        multiline
      />
      <View style={styles.times}>
        <View style={styles.time}>
          <Field
            label="Início"
            placeholder="14:00"
            value={form.start}
            onChangeText={(v) => patch('start', maskTime(v))}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={styles.time}>
          <Field
            label="Fim"
            placeholder="15:30"
            value={form.end}
            onChangeText={(v) => patch('end', maskTime(v))}
            keyboardType="number-pad"
            maxLength={5}
            hint={form.start && form.end && !validTimes ? 'Informe horários válidos (fim após o início).' : undefined}
          />
        </View>
      </View>
      <OptionGroup
        label="Status"
        options={STATUS_OPTIONS}
        value={form.status}
        onChange={(v) => patch('status', v)}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  times: {
    flexDirection: 'row',
    gap: 12,
  },
  time: {
    flex: 1,
  },
});
