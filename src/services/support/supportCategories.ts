import type { SupportCategory } from './models';

export const supportCategories: SupportCategory[] = [
  {
    id: 'internet',
    name: 'No internet',
    icon: 'cloud-offline-outline',
    priority: 1,
  },
  { id: 'speed', name: 'Slow speed', icon: 'speedometer-outline', priority: 2 },
  {
    id: 'router',
    name: 'Router issue',
    icon: 'hardware-chip-outline',
    priority: 3,
  },
  {
    id: 'billing',
    name: 'Billing issue',
    icon: 'receipt-outline',
    priority: 4,
  },
];

export function copySupportCategories(): SupportCategory[] {
  return supportCategories.map(category => ({ ...category }));
}
