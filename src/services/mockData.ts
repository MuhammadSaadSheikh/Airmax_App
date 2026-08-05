import type { Bill, Complaint, NotificationItem, Package, User } from '@/types';

export const packages: Package[] = [
  {
    id: 'basic',
    name: 'Basic',
    speed: 20,
    price: 1500,
    duration: 'Monthly',
    features: ['Unlimited browsing', 'HD streaming', '2–3 devices'],
    status: 'active',
  },
  {
    id: 'plus',
    name: 'Air Plus',
    speed: 50,
    price: 2500,
    duration: 'Monthly',
    features: ['Full HD streaming', 'Low-latency gaming', 'Up to 6 devices'],
    popular: true,
    status: 'active',
  },
  {
    id: 'premium',
    name: 'Premium',
    speed: 100,
    price: 3500,
    duration: 'Monthly',
    features: [
      '4K streaming',
      'Gaming priority',
      'Multiple devices',
      'Priority support',
    ],
    status: 'active',
  },
  {
    id: 'ultra',
    name: 'Ultra Fiber',
    speed: 200,
    price: 5500,
    duration: 'Monthly',
    features: [
      'Symmetric fiber',
      '4K multi-stream',
      'Static IP option',
      'Premium support',
    ],
    status: 'active',
  },
];

export const bills: Bill[] = [
  {
    id: 'b1',
    month: 'July 2026',
    invoice: 'AMX-2607-1042',
    amount: 3500,
    status: 'paid',
    date: '05 Jul 2026',
  },
  {
    id: 'b2',
    month: 'June 2026',
    invoice: 'AMX-2606-1042',
    amount: 3500,
    status: 'paid',
    date: '04 Jun 2026',
  },
  {
    id: 'b3',
    month: 'August 2026',
    invoice: 'AMX-2608-1042',
    amount: 3500,
    status: 'unpaid',
    date: 'Due 10 Aug 2026',
  },
];

export const complaintsSeed: Complaint[] = [
  {
    id: 'CMP-2048',
    category: 'Slow Speed',
    description: 'Speed drops during evening hours.',
    status: 'in_progress',
    createdAt: '28 Jul 2026',
    technician: 'Ali Raza',
  },
  {
    id: 'CMP-1971',
    category: 'Router Problem',
    description: 'Router restarted repeatedly.',
    status: 'resolved',
    createdAt: '14 Jul 2026',
    technician: 'Usman Tariq',
  },
];

export const notifications: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Bill generated',
    message: 'Your August invoice is ready to pay.',
    time: '10 min ago',
    read: false,
    icon: 'receipt-outline',
  },
  {
    id: 'n2',
    title: 'Technician assigned',
    message: 'Ali Raza is working on complaint CMP-2048.',
    time: 'Yesterday',
    read: false,
    icon: 'construct-outline',
  },
  {
    id: 'n3',
    title: 'Payment received',
    message: 'Your July payment of Rs. 3,500 was received.',
    time: '5 Jul',
    read: true,
    icon: 'checkmark-circle-outline',
  },
];

export const customers: User[] = [
  {
    id: 'u1',
    name: 'Ahmed Khan',
    phone: '+92 300 1234567',
    email: 'ahmed@example.com',
    role: 'customer',
    address: 'DHA Phase 6, Karachi',
    connectionId: 'AMX-1042',
  },
  {
    id: 'u2',
    name: 'Sara Ali',
    phone: '+92 321 9876543',
    email: 'sara@example.com',
    role: 'customer',
    address: 'Clifton, Karachi',
    connectionId: 'AMX-1188',
  },
  {
    id: 'u3',
    name: 'Hamza Noor',
    phone: '+92 333 4567890',
    email: 'hamza@example.com',
    role: 'customer',
    address: 'Gulshan, Karachi',
    connectionId: 'AMX-1204',
  },
];
