import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { useCreateSubject, useUpdateSubject } from '@/api/study';
import { PRIORITY_LABEL, type Priority, type Subject } from '../data';

type SubjectFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Matéria em edição; `undefined` cria uma nova. */
  subject?: Subject;
  onDelete?: (subject: Subject) => void;
};

const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABEL) as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABEL[value],
}));

const EMPTY = {
  title: '',
  module: '',
  description: '',
  priority: 'normal' as Priority,
  hoursDone: 0,
  hoursGoal: 10,
};

export function SubjectFormSheet({ visible, onClose, subject, onDelete }: SubjectFormSheetProps) {
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const saving = createSubject.isPending || updateSubject.isPending;

  const [form, setForm] = useState(EMPTY);

  // Preenche com a matéria em edição (ou limpa) a cada abertura
  useEffect(() => {
    if (!visible) return;
    setForm(
      subject
        ? {
            title: subject.title,
            module: subject.module,
            description: subject.description,
            priority: subject.priority,
            hoursDone: subject.hoursDone,
            hoursGoal: subject.hoursGoal,
          }
        : EMPTY,
    );
  }, [visible, subject]);

  const canSave = form.title.trim().length > 0 && form.hoursGoal > 0;

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const input = {
      ...form,
      title: form.title.trim(),
      module: form.module.trim(),
      description: form.description.trim(),
      hoursDone: Math.min(form.hoursDone, form.hoursGoal),
    };
    if (subject) updateSubject.mutate({ id: subject.id, ...input }, { onSuccess: onClose });
    else createSubject.mutate(input, { onSuccess: onClose });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={subject ? 'Editar matéria' : 'Nova matéria'}
      footer={
        <>
          <SheetButton label={subject ? 'Salvar alterações' : 'Adicionar matéria'} onPress={handleSave} disabled={!canSave} loading={saving} />
          {subject && onDelete && (
            <SheetButton label="Excluir matéria" variant="danger" onPress={() => onDelete(subject)} />
          )}
        </>
      }
    >
      <Field
        label="Nome"
        placeholder="Ex.: Teoria da Arquitetura"
        value={form.title}
        onChangeText={(v) => patch('title', v)}
        autoFocus={!subject}
      />
      <Field
        label="Módulo / disciplina"
        placeholder="Ex.: Módulo 03"
        value={form.module}
        onChangeText={(v) => patch('module', v)}
      />
      <Field
        label="Descrição"
        placeholder="O que está em andamento nesta matéria"
        value={form.description}
        onChangeText={(v) => patch('description', v)}
        multiline
      />
      <OptionGroup
        label="Status"
        options={PRIORITY_OPTIONS}
        value={form.priority}
        onChange={(v) => patch('priority', v)}
      />
      <View style={styles.steppers}>
        <Stepper
          label="Meta de horas"
          value={form.hoursGoal}
          min={1}
          max={200}
          format={(v) => `${v}h`}
          onChange={(v) => patch('hoursGoal', v)}
        />
        <Stepper
          label="Horas estudadas"
          value={form.hoursDone}
          min={0}
          max={form.hoursGoal}
          format={(v) => `${v}h`}
          onChange={(v) => patch('hoursDone', v)}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  steppers: {
    gap: 12,
  },
});
