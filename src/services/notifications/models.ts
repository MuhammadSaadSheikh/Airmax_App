export type NotificationType = 'billing' | 'network' | 'support' | 'offers';
export type NotificationPriority = 'normal' | 'high' | 'critical';
export type NotificationActionType =
  | 'pay_bill'
  | 'check_issue'
  | 'view_support'
  | 'renew_plan'
  | 'upgrade_plan'
  | 'view_details'
  | 'none';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionType: NotificationActionType;
  actionLabel?: string;
  priority: NotificationPriority;
  targetId?: string;
}

export interface NotificationPreference {
  billingEnabled: boolean;
  networkEnabled: boolean;
  supportEnabled: boolean;
  offersEnabled: boolean;
  packageRecommendationsEnabled: boolean;
  pushEnabled: boolean;
}

export type RecommendationCategory =
  'usage' | 'package' | 'billing' | 'network';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  action: NotificationActionType;
  actionLabel: string;
  benefit: string;
}

export interface CustomerInsight {
  usagePattern: string;
  packageSuggestion: string;
  riskLevel: 'low' | 'medium' | 'high';
}
