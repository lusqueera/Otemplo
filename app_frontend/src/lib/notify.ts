import { dialog } from '@/components/dialog';
import { ApiError } from '@/lib/api';

/** Aviso simples no modal do app (igual no nativo e na web). */
export function notify(title: string, message: string) {
  void dialog.alert(title, message);
}

/** Mensagem legível para qualquer erro vindo de uma mutation. */
export function errorMessage(error: unknown, fallback = 'Verifique a conexão e tente novamente.') {
  if (error instanceof ApiError) return error.userMessage;
  if (error instanceof TypeError) return 'Sem conexão com o servidor.';
  return fallback;
}
