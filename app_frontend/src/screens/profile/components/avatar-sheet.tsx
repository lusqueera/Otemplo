import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { ActionSheet, type Action } from '@/components/action-sheet';
import { useRemoveAvatar, useUploadAvatar } from '@/api/auth';
import { errorMessage, notify } from '@/lib/notify';
import { useAuthStore } from '@/store/auth';

type AvatarSheetProps = {
  visible: boolean;
  onClose: () => void;
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 1,
};

/** Lado máximo da foto enviada: o avatar é exibido em até 80 px, 512 sobra e cabe no limite da API. */
const AVATAR_SIZE = 512;

/** Opções para trocar a foto de perfil: câmera, galeria ou remover. */
export function AvatarSheet({ visible, onClose }: AvatarSheetProps) {
  const hasPhoto = useAuthStore((s) => !!s.user?.avatarUri);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();

  // Foto de câmera recortada ainda tem ~3000 px; reduz antes de virar base64 (limite de 5 MB na API)
  async function send(asset: ImagePicker.ImagePickerAsset) {
    try {
      const image = await ImageManipulator.manipulate(asset.uri)
        .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
        .renderAsync();
      const { base64 } = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
      image.release();
      if (!base64) throw new Error('sem base64');
      upload.mutate(`data:image/jpeg;base64,${base64}`, {
        onError: (error) => notify('Foto não enviada', errorMessage(error)),
      });
    } catch {
      notify('Foto não carregada', 'Não foi possível processar a imagem selecionada.');
    }
  }

  async function pickFromLibrary() {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      notify('Permissão necessária', 'Autorize o acesso às fotos nas configurações do aparelho.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) await send(result.assets[0]);
  }

  async function takePhoto() {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      notify('Permissão necessária', 'Autorize o uso da câmera nas configurações do aparelho.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) await send(result.assets[0]);
  }

  const actions: Action[] = [
    // Câmera não existe na web; o picker abre o seletor de arquivos
    ...(Platform.OS !== 'web'
      ? [{ id: 'camera', label: 'Tirar foto', icon: 'camera' as const, onPress: () => void takePhoto() }]
      : []),
    { id: 'library', label: Platform.OS === 'web' ? 'Escolher arquivo' : 'Escolher da galeria', icon: 'image', onPress: () => void pickFromLibrary() },
    ...(hasPhoto
      ? [{ id: 'remove', label: 'Remover foto', icon: 'trash-2' as const, destructive: true, onPress: () => remove.mutate(undefined, { onError: (error) => notify('Foto não removida', errorMessage(error)) }) }]
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
