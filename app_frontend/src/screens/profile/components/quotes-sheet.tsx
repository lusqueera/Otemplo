import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Field } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { ToggleRow } from '@/components/toggle-row';
import { maskTime, TIME_RE } from '@/lib/format';
import { useProfile, useUpdateProfile } from '@/api/auth';
import { CURATOR_LABEL, PROFILE_DEFAULTS, type QuoteCurator } from '@/store/profile';
import { colors } from '@/theme/colors';

type QuotesSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const CURATORS = Object.keys(CURATOR_LABEL) as QuoteCurator[];

export function QuotesSheet({ visible, onClose }: QuotesSheetProps) {
  const { data: profile } = useProfile();
  const quotes = profile?.quotes ?? PROFILE_DEFAULTS.quotes;
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState(quotes);

  useEffect(() => {
    if (visible) setForm(quotes);
  }, [visible, quotes]);

  const validTime = TIME_RE.test(form.time);

  function toggleCurator(c: QuoteCurator) {
    setForm((f) => {
      const has = f.curators.includes(c);
      if (has && f.curators.length === 1) return f; // mantém ao menos uma
      return { ...f, curators: has ? f.curators.filter((x) => x !== c) : [...f.curators, c] };
    });
  }

  function handleSave() {
    updateProfile.mutate({ quotes: form });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Filosofia e citações diárias"
      subtitle="Curadoria que aparece no rodapé das telas."
      footer={<SheetButton label="Salvar preferências" onPress={handleSave} disabled={!validTime} />}
    >
      <ToggleRow
        label="Citação diária"
        description="Exibir uma citação nova a cada dia"
        value={form.enabled}
        onChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
      />

      <View style={styles.field}>
        <Text style={styles.label}>Curadoria</Text>
        <View style={styles.list}>
          {CURATORS.map((c) => {
            const selected = form.curators.includes(c);
            return (
              <Pressable
                key={c}
                style={[styles.row, selected && styles.rowSelected]}
                onPress={() => toggleCurator(c)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
              >
                <Text style={styles.rowLabel}>{CURATOR_LABEL[c]}</Text>
                <View style={[styles.check, selected && styles.checkSelected]}>
                  {selected && <Feather name="check" size={12} color={colors.buttonText} />}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field
        label="Horário da citação"
        placeholder="07:00"
        value={form.time}
        onChangeText={(v) => setForm((f) => ({ ...f, time: maskTime(v) }))}
        keyboardType="number-pad"
        maxLength={5}
        hint={!validTime ? 'Use o formato HH:MM.' : undefined}
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
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowSelected: {
    borderColor: colors.text,
  },
  rowLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.track,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
});
