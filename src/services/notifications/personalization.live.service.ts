import type { PersonalizationService } from './personalizationService';

const unavailable = () =>
  Promise.reject(
    new Error(
      'Personalized recommendations are unavailable until a backend contract exists.',
    ),
  );

export const livePersonalizationService: PersonalizationService = {
  getRecommendations: unavailable,
  getRecommendation: unavailable,
  getCustomerInsight: unavailable,
};
