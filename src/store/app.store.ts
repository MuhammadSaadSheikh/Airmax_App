import { create } from 'zustand';
import {
  complaintsSeed,
  notifications as notificationSeed,
} from '@/services/mockData';
import type { Complaint, NotificationItem } from '@/types';

type AppState = {
  complaints: Complaint[];
  notifications: NotificationItem[];
  addComplaint: (category: string, description: string) => Complaint;
  resolveComplaint: (id: string) => void;
  markAllRead: () => void;
};
export const useAppStore = create<AppState>(set => ({
  complaints: complaintsSeed,
  notifications: notificationSeed,
  addComplaint: (category, description) => {
    const item: Complaint = {
      id: `CMP-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      description,
      status: 'pending',
      createdAt: 'Today',
    };
    set(s => ({ complaints: [item, ...s.complaints] }));
    return item;
  },
  resolveComplaint: id =>
    set(s => ({
      complaints: s.complaints.map(c =>
        c.id === id ? { ...c, status: 'resolved' } : c,
      ),
    })),
  markAllRead: () =>
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
    })),
}));
