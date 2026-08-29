import type { CustomerInsight, Recommendation } from './models';
import type { PersonalizationService } from './personalizationService';

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

export const mockPersonalizationService: PersonalizationService = {
  async getRecommendations() {
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
  async getCustomerInsight() {
    await wait();
    const insight: CustomerInsight = {
      usagePattern: 'Bandwidth usage is 40% higher than last month.',
      packageSuggestion: 'Consider a 200 Mbps package for peak hours.',
      riskLevel: 'medium',
    };
    return insight;
  },
};
