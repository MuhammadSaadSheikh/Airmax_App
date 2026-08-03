import { Platform } from 'react-native';

const developmentApiUrl = Platform.select({
  android: 'http://10.0.2.2:4000/api/v1',
  default: 'http://localhost:4000/api/v1',
});

export const environment = {
  apiUrl: __DEV__ ? developmentApiUrl! : 'https://api.airmax.pk/api/v1',
  useMockApi: __DEV__,
} as const;
