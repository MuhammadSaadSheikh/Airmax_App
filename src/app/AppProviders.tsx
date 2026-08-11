import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryClient } from '@/services/query';
import { initializeAuthRuntime } from '@/services/auth/authRuntime';
import { useAuthStore } from '@/store/auth.store';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    initializeAuthRuntime();
    void useAuthStore.getState().bootstrap();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
