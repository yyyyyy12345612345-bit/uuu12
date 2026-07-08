export interface DailyStats {
  emailCount: number;
  regCount: number;
  forgotCount: number;
  totalEmails: number;
  totalUniqueEmails: number;
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
  reason: string;
  duration: string;
}

export interface Quest {
  id: string;
  title: string;
  points: number;
  target: string;
  surahId?: number | null;
  createdAt?: any;
  active?: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'subscribers' | 'free';
  sentAt?: any;
  sender?: string;
  status?: string;
}
