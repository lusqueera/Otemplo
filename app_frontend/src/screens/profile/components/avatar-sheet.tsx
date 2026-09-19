import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { useRemoveAvatar, useUploadAvatar } from '@/api/auth';
import { useAuthStore } from '@/store/auth';

type AvatarSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  base64: true,
};

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

/** Opções para trocar a foto de perfil: câmera, galeria ou remover. */
export function AvatarSheet({ visible, onClose }: AvatarSheetProps) {
  const hasPhoto = useAuthStore((s) => !!s.user?.avatarUri);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();

  // O picker devolve base64; o servidor grava o arquivo e responde com a URL
  function send(asset: ImagePicker.ImagePickerAsset) {
    if (!asset.base64) {
      notify('Foto não carregada', 'Não foi possível ler a imagem selecionada.');
      return;
    }
    upload.mutate(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`, {
      onError: () => notify('Foto não enviada', 'Verifique a conexão e tente novamente.'),
    });
  }

  async function pickFromLibrary() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      notify('Permissão necessária', 'Autorize o acesso às fotos nas configurações do aparelho.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) send(result.assets[0]);
  }

  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      notify('Permissão necessária', 'Autorize o uso da câmera nas configurações do aparelho.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) send(result.assets[0]);
  }

  const actions: Action[] = [
    // Câmera não existe na web; o picker abre o seletor de arquivos
    ...(Platform.OS !== 'web'
      ? [{ id: 'camera', label: 'Tirar foto', icon: 'camera' as const, onPress: () => void takePhoto() }]
      : []),
    { id: 'library', label: Platform.OS === 'web' ? 'Escolher arquivo' : 'Escolher da galeria', icon: 'image', onPress: () => void pickFromLibrary() },
    ...(hasPhoto
      ? [{ id: 'remove', label: 'Remover foto', icon: 'trash-2' as const, destructive: true, onPress: () => remove.mutate() }]
      : []),
  ];

  return (
    <ActionSheet
      visible={visible}
      onClose={onClose}
      title="Foto de perfil"
      subtitle="A imagem é recortada em formato quadrado."
      actions={actions}
    />
  );
}
