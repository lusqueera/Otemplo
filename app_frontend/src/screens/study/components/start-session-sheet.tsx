import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { OptionGroup, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { useSubjects } from '@/api/study';
import { useStudyStore } from '@/store/study';
import { colors } from '@/theme/colors';
import { CYCLE_OPTIONS, DEFAULT_CYCLE_MINUTES, DEFAULT_TOTAL_CYCLES, PRIORITY_LABEL } from '../data';

type StartSessionSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Matéria pré-selecionada (ex.: vinda do botão ▶ do card). */
  initialSubjectId?: string;
};

type CycleOption = `${(typeof CYCLE_OPTIONS)[number]}`;

const CYCLE_CHOICES = CYCLE_OPTIONS.map((m) => ({ value: `${m}` as CycleOption, label: `${m} min` }));

export function StartSessionSheet({ visible, onClose, initialSubjectId }: StartSessionSheetProps) {
  const { data: subjects = [] } = useSubjects();
  const startSession = useStudyStore((s) => s.startSession);

  const [subjectId, setSubjectId] = useState<string | undefined>(initialSubjectId);
  const [cycle, setCycle] = useState<CycleOption>(`${DEFAULT_CYCLE_MINUTES}`);
  const [totalCycles, setTotalCycles] = useState(DEFAULT_TOTAL_CYCLES);

  // Reaplica a pré-seleção sempre que o sheet abre
  useEffect(() => {
    if (visible) setSubjectId(initialSubjectId ?? subjects[0]?.id);
  }, [visible, initialSubjectId, subjects]);

  function handleStart() {
    if (!subjectId) return;
    startSession(subjectId, { cycleMinutes: Number(cycle), totalCycles });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Iniciar sessão de foco"
      subtitle="O cronômetro começa pausado — dê play quando estiver pronto."
      footer={
        <SheetButton label="Criar sessão" onPress={handleStart} disabled={!subjectId} />
      }
    >
      <View style={styles.field}>
        <Text style={styles.label}>Matéria</Text>
        {subjects.length === 0 ? (
          <Text style={styles.emptyText}>Cadastre uma matéria antes de iniciar uma sessão.</Text>
        ) : (
          <View style={styles.list}>
            {subjects.map((subject) => {
              const selected = subject.id === subjectId;
              return (
                <Pressable
                  key={subject.id}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => setSubjectId(subject.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>{subject.title}</Text>
                    <Text style={styles.rowMeta}>
                      {subject.module} • {PRIORITY_LABEL[subject.priority]}
                    </Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <Feather name="check" size={12} color={colors.buttonText} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <OptionGroup label="Duração do ciclo" options={CYCLE_CHOICES} value={cycle} onChange={setCycle} />

      <Stepper
        label="Ciclos"
        value={totalCycles}
        min={1}
        max={8}
        format={(v) => `${v} ${v === 1 ? 'ciclo' : 'ciclos'}`}
        onChange={setTotalCycles}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderColor: colors.text,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  rowMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
});
