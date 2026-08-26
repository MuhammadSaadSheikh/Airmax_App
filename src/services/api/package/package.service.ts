import { environment } from '@/config/environment';
import type { PackageCatalogService } from './package.models';

function loadPackageCatalogService(): PackageCatalogService {
  if (environment.useMockApi) {
    // Mock catalogue data is initialized only for explicit mock builds.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./package.mock.service')
      .mockPackageCatalogService as PackageCatalogService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./package.live.service')
    .livePackageCatalogService as PackageCatalogService;
}

export const packageCatalogService = loadPackageCatalogService();
