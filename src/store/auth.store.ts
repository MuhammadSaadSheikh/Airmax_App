import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Role, User } from '@/types';

type AuthState = {
  user: User | null;
  hydrated: boolean;
  signIn: (role: Role, identifier?: string) => void;
  signOut: () => void;
  setHydrated: (value: boolean) => void;
  updateProfile: (values: Partial<User>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      hydrated: false,
      signIn: (role, identifier) =>
        set({
          user:
            role === 'admin'
              ? {
                  id: 'admin-1',
                  name: 'Danish Admin',
                  phone: '+92 300 0000000',
                  email: identifier?.includes('@')
                    ? identifier
                    : 'admin@airmax.pk',
                  role,
                  address: 'AIRMAX HQ, Karachi',
                }
              : {
                  id: 'u1',
                  name: 'Ahmed Khan',
                  phone: identifier?.includes('@')
                    ? '+92 300 1234567'
                    : identifier || '+92 300 1234567',
                  email: identifier?.includes('@')
                    ? identifier
                    : 'ahmed@example.com',
                  role,
                  address: 'DHA Phase 6, Karachi',
                  connectionId: 'AMX-1042',
                  cnic: '42101-1234567-1',
                  installationDate: '15 Jan 2025',
                  router: 'Huawei HG8145V5',
                },
        }),
      signOut: () => set({ user: null }),
      setHydrated: hydrated => set({ hydrated }),
      updateProfile: values =>
        set(state => ({
          user: state.user ? { ...state.user, ...values } : null,
        })),
    }),
    {
      name: 'airmax-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: s => ({ user: s.user }),
      onRehydrateStorage: () => state => state?.setHydrated(true),
    },
  ),
);
