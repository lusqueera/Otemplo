import { useEffect, useState } from 'react';

import { Field } from '@/components/field';
import { Sheet, SheetButton } from '@/components/sheet';
import { useUpdateMe } from '@/api/auth';
import { useAuthStore } from '@/store/auth';

type EditProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditProfileSheet({ visible, onClose }: EditProfileSheetProps) {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();

  const [form, setForm] = useState({ name: '', email: '', title: '' });

  useEffect(() => {
    if (visible) setForm({ name: user?.name ?? '', email: user?.email ?? '', title: user?.title ?? '' });
  }, [visible, user]);

  const validEmail = EMAIL_RE.test(form.email.trim());
  const canSave = form.name.trim().length > 0 && validEmail;

  function handleSave() {
    updateMe.mutate({ name: form.name.trim(), title: form.title.trim() });
    onClose();
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Editar perfil"
      footer={<SheetButton label="Salvar alterações" onPress={handleSave} disabled={!canSave} />}
    >
      <Field
        label="Nome completo"
        placeholder="Seu nome"
        value={form.name}
        onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
        autoCapitalize="words"
        autoFocus
      />
      <Field
        label="E-mail"
        placeholder="exemplo@email.com"
        value={form.email}
        onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={false}
        hint="O e-mail de acesso não pode ser alterado por aqui."
      />
      <Field
        label="Título (opcional)"
        placeholder="Ex.: Arquiteto & Pesquisador"
        value={form.title}
        onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
      />
    </Sheet>
  );
}
