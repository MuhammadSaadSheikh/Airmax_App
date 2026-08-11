import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function reset(name: 'Auth' | 'Customer' | 'Admin') {
  if (!navigationRef.isReady()) return;
  navigationRef.resetRoot({ index: 0, routes: [{ name }] });
}

export const navigationActions = {
  showAuth: () => reset('Auth'),
};
