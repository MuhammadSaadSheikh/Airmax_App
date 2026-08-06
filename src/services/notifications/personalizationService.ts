import type { CustomerInsight, Recommendation } from './models';

export interface PersonalizationService {
  getRecommendations(connectionId: string): Promise<Recommendation[]>;
  getRecommendation(id: string): Promise<Recommendation | undefined>;
  getCustomerInsight(connectionId: string): Promise<CustomerInsight>;
}

const recommendations: Recommendation[] = [
  {
    id: 'REC-200-MBPS',
    title: 'Keep up with higher usage',
    description:
      'Your household used 40% more bandwidth this month, mostly during peak hours.',
    category: 'usage',
    action: 'upgrade_plan',
    actionLabel: 'View 200 Mbps plans',
    benefit: 'More capacity for simultaneous streaming, calls and gaming.',
  },
  {
    id: 'REC-AUTOPAY',
    title: 'Never miss a due date',
    description:
      'Enable a preferred payment method for a smoother monthly payment routine.',
    category: 'billing',
    action: 'pay_bill',
    actionLabel: 'Open payment center',
    benefit: 'Fewer reminders and uninterrupted service.',
  },
];

const wait = () => new Promise<void>(resolve => setTimeout(resolve, 240));

export const personalizationService: PersonalizationService = {
  async getRecommendations(connectionId) {
    // A future NestJS adapter can build this from Kafka usage/payment events.
    void connectionId;
    await wait();
    return recommendations.map(item => ({ ...item }));
  },
  async getRecommendation(id) {
    await wait();
    const item = recommendations.find(
      recommendation => recommendation.id === id,
    );
    return item ? { ...item } : undefined;
  },
  async getCustomerInsight(connectionId) {
    void connectionId;
    await wait();
    return {
      usagePattern: 'Bandwidth usage is 40% higher than last month.',
      packageSuggestion: 'Consider a 200 Mbps package for peak hours.',
      riskLevel: 'medium',
    };
  },
};

export const getRecommendations = (connectionId: string) =>
  personalizationService.getRecommendations(connectionId);
