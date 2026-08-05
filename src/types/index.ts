export type Role = 'admin' | 'customer';
export type Status =
  'active' | 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'suspended';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: Role;
  address: string;
  connectionId?: string;
  cnic?: string;
  installationDate?: string;
  router?: string;
}
export interface Package {
  id: string;
  name: string;
  speed: number;
  price: number;
  duration: string;
  features: string[];
  popular?: boolean;
  status: 'active' | 'inactive';
}
export interface Bill {
  id: string;
  month: string;
  invoice: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
  date: string;
}
export interface Complaint {
  id: string;
  category: string;
  description: string;
  status: Status;
  createdAt: string;
  technician?: string;
}
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: string;
}
