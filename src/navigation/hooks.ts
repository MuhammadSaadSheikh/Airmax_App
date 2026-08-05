import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type {
  AdminStackParamList,
  AuthStackParamList,
  CustomerStackParamList,
  RootStackParamList,
} from './types';

export const useRootNavigation = () =>
  useNavigation<NativeStackNavigationProp<RootStackParamList>>();
export const useAuthNavigation = () =>
  useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
export const useCustomerNavigation = () =>
  useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
export const useAdminNavigation = () =>
  useNavigation<NativeStackNavigationProp<AdminStackParamList>>();
