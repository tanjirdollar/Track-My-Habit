export type HabitType = 'number' | 'boolean';
export type HabitFrequency = 'daily' | 'weekdays' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  type: HabitType;
  target: number;
  unit: string;
  frequency: HabitFrequency;
  emoji: string;
  myProgress: number;
  partnerProgress: number;
  completedByMe?: boolean;
  completedByPartner?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PodUser {
  id: string;
  name: string;
  email?: string;
  role: 'userA' | 'userB';
  lastActive: number;
}

export interface AuthUserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'userA' | 'userB';
  podId: string;
  partnerUid?: string;
  partnerEmail?: string;
}

export interface WeekDaySync {
  dateKey: string; // YYYY-MM-DD
  dayLabel: string;
  dateLabel: string;
  myDone: boolean;
  partnerDone: boolean;
  isToday: boolean;
}

export interface PodData {
  podId: string;
  createdAt: number;
  userA: PodUser;
  userB: PodUser | null;
  habits: Habit[];
  currentStreak: number;
  bestStreak: number;
  daysTogether: number;
  healthScore: number;
  history: Record<string, { userADone: boolean; userBDone: boolean }>;
  lastSyncTime: number;
  lastAction?: {
    userId: string;
    userName: string;
    actionText: string;
    habitName?: string;
    timestamp: number;
  };
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
