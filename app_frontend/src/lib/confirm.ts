import { dialog } from '@/components/dialog';

/** Confirmação de ação destrutiva no modal do app (igual no nativo e na web). */
export function confirmDelete(title: string, message: string, onConfirm: () => void) {
  void dialog.confirm(title, message, { confirmLabel: 'Excluir', destructive: true }).then((ok) => {
    if (ok) onConfirm();
  });
}
