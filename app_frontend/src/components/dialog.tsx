import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { create } from 'zustand';

import { colors } from '@/theme/colors';

type DialogButton = {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onPress: () => void;
};

type DialogState = {
  visible: boolean;
  title: string;
  message?: string;
  buttons: DialogButton[];
  open: (dialog: Omit<DialogState, 'visible' | 'open' | 'close'>) => void;
  close: () => void;
};

const useDialogStore = create<DialogState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  open: (dialog) => set({ ...dialog, visible: true }),
  close: () => set({ visible: false }),
}));

/**
 * Substitui `Alert.alert` / `window.confirm` por um modal no estilo do app,
 * igual no nativo e na web. `DialogHost` é montado uma vez no layout raiz.
 */
export const dialog = {
  alert(title: string, message?: string) {
    return new Promise<void>((resolve) => {
      const { open, close } = useDialogStore.getState();
      open({
        title,
        message,
        buttons: [{ label: 'OK', onPress: () => (close(), resolve()) }],
      });
    });
  },
  confirm(title: string, message: string, options: { confirmLabel?: string; destructive?: boolean } = {}) {
    return new Promise<boolean>((resolve) => {
      const { open, close } = useDialogStore.getState();
      open({
        title,
        message,
        buttons: [
          { label: 'Cancelar', variant: 'secondary', onPress: () => (close(), resolve(false)) },
          {
            label: options.confirmLabel ?? 'Confirmar',
            variant: options.destructive ? 'danger' : 'primary',
            onPress: () => (close(), resolve(true)),
          },
        ],
      });
    });
  },
};

export function DialogHost() {
  const { visible, title, message, buttons } = useDialogStore();
  // Fechar pelo backdrop/back equivale a cancelar (primeiro botão secundário) ou a OK
  const dismiss = () => (buttons.find((b) => b.variant === 'secondary') ?? buttons[0])?.onPress();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
      <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Fechar">
        <Pressable style={styles.card} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            {buttons.map((b) => (
              <Pressable
                key={b.label}
                style={[
                  styles.button,
                  b.variant === 'secondary' && styles.buttonSecondary,
                  b.variant === 'danger' && styles.buttonDanger,
                ]}
                onPress={b.onPress}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.buttonLabel,
                    b.variant === 'secondary' && styles.buttonLabelSecondary,
                    b.variant === 'danger' && styles.buttonLabelDanger,
                  ]}
                >
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: colors.tile,
  },
  buttonDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
  },
  buttonLabel: {
    color: colors.buttonText,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonLabelSecondary: {
    color: colors.text,
  },
  buttonLabelDanger: {
    color: colors.danger,
  },
});
