import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/api/auth.service';
import { queryKeys } from '@/services/query/queryKeys';

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => authService.getCurrentUser(),
  });
}
