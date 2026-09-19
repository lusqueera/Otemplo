import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, Stepper } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { ToggleRow } from '@/components/toggle-row';
import { maskTime, TIME_RE } from '@/lib/format';
import { useProfile, useUpdateProfile } from '@/api/auth';
import { PROFILE_DEFAULTS } from '@/store/profile';

type CircadianSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function CircadianSheet({ visible, onClose }: CircadianSheetProps) {
  const { data: profile } = useProfile();
  const circadian = profile?.circadian ?? PROFILE_DEFAULTS.circadian;
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState(circadian);

  useEffect(() => {
    if (visible) setForm(circadian);
  }, [visible, circadian]);

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const validTimes = TIME_RE.test(form.wakeTime) && TIME_RE.test(form.bedTime);

  function handleSave() {
    updateProfile.mutate({ circadian: form });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Ritmo circadiano & lembretes"
      subtitle="Alertas sutis de luz e desaceleração."
      footer={<SheetButton label="Salvar ritmo" onPress={handleSave} disabled={!validTimes} />}
    >
      <View style={styles.times}>
        <View style={styles.time}>
          <Field
            label="Acordar"
            placeholder="06:00"
            value={form.wakeTime}
            onChangeText={(v) => patch('wakeTime', maskTime(v))}
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={styles.time}>
          <Field
            label="Dormir"
            placeholder="22:30"
            value={form.bedTime}
            onChangeText={(v) => patch('bedTime', maskTime(v))}
            keyboardType="number-pad"
            maxLength={5}
            hint={!validTimes ? 'Use o formato HH:MM.' : undefined}
          />
        </View>
      </View>

      <Stepper
        label="Desaceleração antes de dormir"
        value={form.windDownMinutes}
        min={0}
        max={120}
        step={15}
        format={(v) => (v === 0 ? 'Desligado' : `${v} min`)}
        onChange={(v) => patch('windDownMinutes', v)}
      />

      <ToggleRow
        label="Filtro de luz azul"
        description="Ativa o modo noturno no horário de desaceleração"
        value={form.blueLightFilter}
        onChange={(v) => patch('blueLightFilter', v)}
      />
      <ToggleRow
        label="Escurecer ao anoitecer"
        description="Reduz o brilho da interface após o pôr do sol"
        value={form.dimAtDusk}
        onChange={(v) => patch('dimAtDusk', v)}
      />
      <ToggleRow
        label="Lembretes de hábitos"
        description="Alertas sutis nos horários agendados"
        value={form.habitReminders}
        onChange={(v) => patch('habitReminders', v)}
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
