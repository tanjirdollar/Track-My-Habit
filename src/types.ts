export type HabitType = 'number' | 'boolean';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  target: number;
  current: number;
  unit: string;
  frequency: HabitFrequency;
  emoji: string;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  inviteCode: string;
  partnerUid?: string | null;
  partnerName?: string | null;
  partnerEmail?: string | null;
  partnerPhoto?: string | null;
  updatedAt: number;
}

export interface UserTrackerData {
  userId: string;
  userName: string;
  userEmail: string;
  userPhoto?: string;
  partnerUid?: string | null;
  habits: Habit[];
  currentStreak: number;
  bestStreak: number;
  healthScore: number;
  todayCompletionRate: number;
  todayCompletedCount: number;
  todayTotalCount: number;
  lastAction?: {
    actionText: string;
    habitName?: string;
    timestamp: number;
  };
  history?: Record<string, { completedCount: number; totalCount: number; rate: number }>;
  lastUpdated: number;
}

export interface WeekDaySync {
  dateKey: string; // YYYY-MM-DD
  dayLabel: string;
  dateLabel: string;
  myDone: boolean;
  partnerDone: boolean;
  isToday: boolean;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export type ConnectionStatus = 'connected' | 'demo' | 'connecting' | 'error';
