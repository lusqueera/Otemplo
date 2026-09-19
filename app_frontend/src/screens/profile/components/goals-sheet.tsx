import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Feather } from '@expo/vector-icons';

import { Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { formatBRL } from '@/lib/format';
import { useProfile, useUpdateProfile } from '@/api/auth';
import { PROFILE_DEFAULTS, type WeeklyGoals } from '@/store/profile';
import { colors } from '@/theme/colors';

type GoalsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const PILLARS: { key: keyof WeeklyGoals; icon: keyof typeof Feather.glyphMap; title: string; label: string; min: number; max: number; step: number; format: (v: number) => string }[] = [
  { key: 'studyHours', icon: 'book-open', title: 'Estudo', label: 'Horas por semana', min: 1, max: 80, step: 1, format: (v) => `${v}h` },
  { key: 'workouts', icon: 'activity', title: 'Treino', label: 'Sessões por semana', min: 1, max: 7, step: 1, format: (v) => `${v}x` },
  { key: 'habitsConsistency', icon: 'check-circle', title: 'Hábitos', label: 'Consistência mínima', min: 10, max: 100, step: 5, format: (v) => `${v}%` },
  { key: 'monthlySavings', icon: 'credit-card', title: 'Capital', label: 'Aporte mensal', min: 0, max: 100000, step: 500, format: (v) => formatBRL(v, { compact: true }) },
  { key: 'expenseCeiling', icon: 'shield', title: 'Despesas', label: 'Teto mensal', min: 0, max: 200000, step: 500, format: (v) => formatBRL(v, { compact: true }) },
];

export function GoalsSheet({ visible, onClose }: GoalsSheetProps) {
  const { data: profile } = useProfile();
  const goals = profile?.goals ?? PROFILE_DEFAULTS.goals;
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState(goals);

  useEffect(() => {
    if (visible) setForm(goals);
  }, [visible, goals]);

  function handleSave() {
    updateProfile.mutate({ goals: form });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Metas e foco semanal"
      subtitle="Os quatro pilares que orientam sua semana."
      footer={<SheetButton label="Salvar metas" onPress={handleSave} />}
    >
      {PILLARS.map((p) => (
        <View key={p.key} style={styles.pillar}>
          <View style={styles.pillarHeader}>
            <View style={styles.pillarIcon}>
              <Feather name={p.icon} size={14} color={colors.text} />
            </View>
            <Text style={styles.pillarTitle}>{p.title}</Text>
          </View>
          <Stepper
            label={p.label}
            value={form[p.key]}
            min={p.min}
            max={p.max}
            step={p.step}
            format={p.format}
            onChange={(v) => setForm((f) => ({ ...f, [p.key]: v }))}
          />
        </View>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  pillar: {
    backgroundColor: colors.input,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillarIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
