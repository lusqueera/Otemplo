import { Platform } from 'react-native';

export const colors = {
  background: '#131313',
  card: '#1B1B1B',
  tile: '#232323',
  input: '#262626',
  track: '#2E2E2E',
  border: '#2A2A2A',
  text: '#FFFFFF',
  muted: '#A3A3A3',
  placeholder: '#7A7A7A',
  buttonText: '#131313',
  success: '#4ADE80',
  danger: '#F87171',
  tabBar: '#0E0E0E',
};

export const fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};
