import './global.css';
import { StatusBar } from 'react-native';
import { AppProviders } from '@/app/AppProviders';
import { AppNavigator } from '@/navigation';
import { colors } from '@/theme';

export default function App() {
  return (
    <AppProviders>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppNavigator />
    </AppProviders>
  );
}
