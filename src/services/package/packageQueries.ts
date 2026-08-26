import { useQuery } from '@tanstack/react-query';
import { packageCatalogService } from '@/services/api/package/package.service';
import { queryKeys } from '@/services/query/queryKeys';

export function packageListQueryOptions() {
  return {
    queryKey: queryKeys.packageMarketplace,
    queryFn: () => packageCatalogService.getPackages(),
    staleTime: 60_000,
  } as const;
}

export function packageDetailQueryOptions(id: string) {
  return {
    queryKey: queryKeys.packageDetail(id),
    queryFn: () => packageCatalogService.getPackageById(id),
    staleTime: 60_000,
  } as const;
}

export function usePackageList() {
  return useQuery(packageListQueryOptions());
}

export function usePackageDetail(id: string) {
  return useQuery(packageDetailQueryOptions(id));
}
