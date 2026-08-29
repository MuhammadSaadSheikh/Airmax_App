import { environment } from '@/config/environment';
import type { CustomerInsight, Recommendation } from './models';

export interface PersonalizationService {
  getRecommendations(connectionId: string): Promise<Recommendation[]>;
  getRecommendation(id: string): Promise<Recommendation | undefined>;
  getCustomerInsight(connectionId: string): Promise<CustomerInsight>;
}

function loadPersonalizationService(): PersonalizationService {
  if (environment.useMockApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('./personalization.mock.service')
      .mockPersonalizationService as PersonalizationService;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('./personalization.live.service')
    .livePersonalizationService as PersonalizationService;
}

export const personalizationService = loadPersonalizationService();

export const getRecommendations = (connectionId: string) =>
  personalizationService.getRecommendations(connectionId);
