import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import type { FirebaseConfig, Habit, ConnectionStatus, UserProfile, UserTrackerData } from '../types';
import { sound, showToast } from './notifications';
import { getTodayKey } from '../utils/bengali';

// The user's provided Firebase Configuration
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyAtXRuBiyVwXgTFqMfH6gVWrZyvrMox0ec",
  authDomain: "habit-tracker-931a6-ff2dc.firebaseapp.com",
  projectId: "habit-tracker-931a6-ff2dc",
  storageBucket: "habit-tracker-931a6-ff2dc.firebasestorage.app",
  messagingSenderId: "480443471496",
  appId: "1:480443471496:web:87fb7783d452875b18f13d",
};

const CONFIG_STORAGE_KEY = 'duo_pod_firebase_config';
const LOCAL_MY_TRACKER_KEY = 'duo_my_tracker_data';
const LOCAL_USER_PROFILE_KEY = 'duo_user_profile_data';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Initialize Firebase Core
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    const config = getSavedFirebaseConfig() || DEFAULT_FIREBASE_CONFIG;
    if (getApps().length > 0) {
      firebaseApp = getApp();
    } else {
      firebaseApp = initializeApp(config);
    }
  }
  return firebaseApp;
}

export function getFirestoreDb(): Firestore {
  if (!firestoreDb) {
    const app = getFirebaseApp();
    firestoreDb = getFirestore(app);
  }
  return firestoreDb;
}

export function getFirebaseAuthInstance(): Auth {
  if (!firebaseAuth) {
    const app = getFirebaseApp();
    firebaseAuth = getAuth(app);
  }
  return firebaseAuth;
}

// Config persistence
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig) {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  firebaseApp = null;
  firestoreDb = null;
  firebaseAuth = null;
}

// Default habits template for any new user
export function getDefaultHabits(): Habit[] {
  const now = Date.now();
  return [
    {
      id: 'h_water',
      name: 'পর্যাপ্ত পানি পান',
      type: 'number',
      target: 8,
      current: 4,
      unit: 'গ্লাস',
      frequency: 'daily',
      emoji: '💧',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'h_walk',
      name: 'মর্নিং ওয়াক বা শরীরচর্চা',
      type: 'number',
      target: 30,
      current: 30,
      unit: 'মিনিট',
      frequency: 'daily',
      emoji: '🏃‍♂️',
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'h_read',
      name: 'বই বা আর্টিকেল পাঠ',
      type: 'number',
      target: 15,
      current: 10,
      unit: 'পৃষ্ঠা',
      frequency: 'daily',
      emoji: '📚',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'h_meditate',
      name: 'ধ্যান ও মাইন্ডফুলনেস',
      type: 'boolean',
      target: 1,
      current: 1,
      unit: 'বার',
      frequency: 'daily',
      emoji: '🧘‍♂️',
      completed: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'h_sleep',
      name: 'রাত ১১টার মধ্যে ঘুম',
      type: 'boolean',
      target: 1,
      current: 0,
      unit: 'বার',
      frequency: 'daily',
      emoji: '😴',
      completed: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// Generate a memorable 6-character invite code
export function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = 'POD-';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calculate tracker statistics
export function calculateTrackerStats(habits: Habit[]) {
  if (!habits || habits.length === 0) {
    return { completionRate: 0, completedCount: 0, totalCount: 0, healthScore: 0 };
  }

  const totalCount = habits.length;
  let completedCount = 0;
  let totalPercentSum = 0;

  for (const h of habits) {
    const isDone = h.completed || (h.target > 0 && h.current >= h.target);
    if (isDone) completedCount++;

    const percent = h.target > 0 ? Math.min(100, Math.round((h.current / h.target) * 100)) : (h.completed ? 100 : 0);
    totalPercentSum += percent;
  }

  const completionRate = Math.round((completedCount / totalCount) * 100);
  const healthScore = Math.round(totalPercentSum / totalCount);

  return { completionRate, completedCount, totalCount, healthScore };
}

// Ensure tracker data is always valid, resilient, and non-empty
export function normalizeTrackerData(
  data: any,
  fallbackUserId: string = 'demo_user_me',
  fallbackName: string = 'ইউজার',
  fallbackEmail: string = ''
): UserTrackerData {
  if (!data || typeof data !== 'object') {
    return createInitialTracker(fallbackUserId, fallbackName, fallbackEmail);
  }

  const rawHabits = Array.isArray(data.habits) ? data.habits : [];
  const habits: Habit[] = rawHabits.length > 0
    ? rawHabits.map((h: any, idx: number) => ({
        id: String(h?.id || `habit_${idx}_${Date.now()}`),
        name: String(h?.name || 'দৈনিক লক্ষ্য'),
        type: h?.type === 'boolean' ? 'boolean' : 'number',
        target: typeof h?.target === 'number' && !isNaN(h.target) && h.target > 0 ? h.target : 1,
        current: typeof h?.current === 'number' && !isNaN(h.current) ? Math.max(0, h.current) : 0,
        unit: String(h?.unit || 'বার'),
        frequency: h?.frequency || 'daily',
        emoji: String(h?.emoji || '🎯'),
        completed: Boolean(h?.completed || (h?.target > 0 && (h?.current || 0) >= h.target)),
        createdAt: typeof h?.createdAt === 'number' ? h.createdAt : Date.now(),
        updatedAt: typeof h?.updatedAt === 'number' ? h.updatedAt : Date.now(),
      }))
    : getDefaultHabits();

  const stats = calculateTrackerStats(habits);
  const safeStreak = typeof data.currentStreak === 'number' && !isNaN(data.currentStreak) ? data.currentStreak : 7;
  const safeBestStreak = typeof data.bestStreak === 'number' && !isNaN(data.bestStreak) ? data.bestStreak : Math.max(14, safeStreak);

  return {
    userId: String(data.userId || fallbackUserId),
    userName: String(data.userName || fallbackName),
    userEmail: String(data.userEmail || fallbackEmail),
    partnerUid: data.partnerUid ? String(data.partnerUid) : null,
    habits,
    currentStreak: safeStreak,
    bestStreak: safeBestStreak,
    healthScore: typeof data.healthScore === 'number' && !isNaN(data.healthScore) ? data.healthScore : stats.healthScore,
    todayCompletionRate: typeof data.todayCompletionRate === 'number' && !isNaN(data.todayCompletionRate) ? data.todayCompletionRate : stats.completionRate,
    todayCompletedCount: typeof data.todayCompletedCount === 'number' && !isNaN(data.todayCompletedCount) ? data.todayCompletedCount : stats.completedCount,
    todayTotalCount: typeof data.todayTotalCount === 'number' && !isNaN(data.todayTotalCount) ? data.todayTotalCount : stats.totalCount,
    lastAction: data.lastAction && typeof data.lastAction === 'object' ? {
      actionText: String(data.lastAction.actionText || 'অগ্রগতি আপডেট করা হয়েছে'),
      timestamp: typeof data.lastAction.timestamp === 'number' ? data.lastAction.timestamp : Date.now(),
    } : {
      actionText: 'ট্র্যাকার চালু আছে',
      timestamp: Date.now(),
    },
    history: data.history && typeof data.history === 'object' ? data.history : {
      [getTodayKey()]: {
        completedCount: stats.completedCount,
        totalCount: stats.totalCount,
        rate: stats.completionRate,
      },
    },
    lastUpdated: typeof data.lastUpdated === 'number' ? data.lastUpdated : Date.now(),
  };
}

// Ensure user profile is always fully populated and safe
export function normalizeUserProfile(
  profile: any,
  fallbackUid: string = 'demo_user_me',
  fallbackName: string = 'ইউজার'
): UserProfile {
  if (!profile || typeof profile !== 'object') {
    return getDemoUserProfile();
  }
  const uid = String(profile.uid || fallbackUid);
  const name = String(profile.name || fallbackName || 'ইউজার');
  const inviteCode = String(profile.inviteCode || ('POD-' + uid.substring(0, 4).toUpperCase()));

  return {
    uid,
    name,
    email: String(profile.email || ''),
    photoURL: profile.photoURL ? String(profile.photoURL) : '',
    inviteCode,
    partnerUid: profile.partnerUid ? String(profile.partnerUid) : null,
    partnerName: profile.partnerName ? String(profile.partnerName) : null,
    partnerEmail: profile.partnerEmail ? String(profile.partnerEmail) : null,
    partnerPhoto: profile.partnerPhoto ? String(profile.partnerPhoto) : null,
    updatedAt: typeof profile.updatedAt === 'number' ? profile.updatedAt : Date.now(),
  };
}

// Initial tracker object
export function createInitialTracker(userId: string, userName: string, userEmail: string): UserTrackerData {
  const habits = getDefaultHabits();
  const stats = calculateTrackerStats(habits);

  return {
    userId,
    userName: userName || 'আমি',
    userEmail: userEmail || '',
    partnerUid: null,
    habits,
    currentStreak: 7,
    bestStreak: 14,
    healthScore: stats.healthScore,
    todayCompletionRate: stats.completionRate,
    todayCompletedCount: stats.completedCount,
    todayTotalCount: stats.totalCount,
    lastAction: {
      actionText: 'নতুন ট্র্যাকার শুরু করেছেন',
      timestamp: Date.now(),
    },
    history: {
      [getTodayKey()]: {
        completedCount: stats.completedCount,
        totalCount: stats.totalCount,
        rate: stats.completionRate,
      },
    },
    lastUpdated: Date.now(),
  };
}

// ----------------------------------------------------
// AUTHENTICATION FUNCTIONS
// ----------------------------------------------------

export function getSavedUserProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LOCAL_USER_PROFILE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    return normalizeUserProfile(parsed);
  } catch {
    return null;
  }
}

export function saveUserProfileLocal(profile: UserProfile | null) {
  if (!profile) {
    localStorage.removeItem(LOCAL_USER_PROFILE_KEY);
  } else {
    localStorage.setItem(LOCAL_USER_PROFILE_KEY, JSON.stringify(profile));
  }
}

// Default Demo User for instant local viewing
export function getDemoUserProfile(): UserProfile {
  const saved = getSavedUserProfile();
  if (saved) return saved;

  const demoUser: UserProfile = {
    uid: 'demo_user_me',
    name: 'আমি (Demo)',
    email: 'demo.user@mail.com',
    inviteCode: 'POD-7788',
    partnerUid: 'demo_user_partner',
    partnerName: 'পার্টনার (Demo)',
    partnerEmail: 'partner.demo@mail.com',
    updatedAt: Date.now(),
  };
  saveUserProfileLocal(demoUser);
  return demoUser;
}

// Sync or fetch profile from Firestore upon login
export async function syncUserProfileOnLogin(user: FirebaseUser): Promise<UserProfile> {
  const db = getFirestoreDb();
  const userRef = doc(db, 'users', user.uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      const updated = normalizeUserProfile({
        ...data,
        uid: user.uid,
        name: user.displayName || data?.name || user.email?.split('@')[0] || 'ইউজার',
        email: user.email || data?.email || '',
        photoURL: user.photoURL || data?.photoURL || '',
        updatedAt: Date.now(),
      });
      saveUserProfileLocal(updated);

      try {
        await setDoc(userRef, updated, { merge: true });
      } catch (saveErr) {
        console.warn('Could not persist updated profile to Firestore:', saveErr);
      }
      return updated;
    } else {
      // New user
      const inviteCode = generateInviteCode();
      const newProfile = normalizeUserProfile({
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'ইউজার',
        email: user.email || '',
        photoURL: user.photoURL || '',
        inviteCode,
        partnerUid: null,
        partnerName: null,
        partnerEmail: null,
        partnerPhoto: null,
        updatedAt: Date.now(),
      });

      saveUserProfileLocal(newProfile);

      try {
        await setDoc(userRef, newProfile);
      } catch (createErr) {
        console.warn('Could not write new profile to Firestore:', createErr);
      }

      // Create initial tracker document for this user
      try {
        const trackerRef = doc(db, 'user_trackers', user.uid);
        const trackerSnap = await getDoc(trackerRef);
        if (!trackerSnap.exists()) {
          const initialTracker = createInitialTracker(user.uid, newProfile.name, newProfile.email);
          await setDoc(trackerRef, initialTracker);
        }
      } catch (trackerErr) {
        console.warn('Could not initialize tracker document in Firestore:', trackerErr);
      }

      return newProfile;
    }
  } catch (err) {
    console.error('Error syncing user profile in Firestore:', err);
    // Return fallback profile if offline/permission issue
    const fallback = normalizeUserProfile({
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'ইউজার',
      email: user.email || '',
      photoURL: user.photoURL || '',
      inviteCode: 'POD-' + user.uid.substring(0, 4).toUpperCase(),
      partnerUid: null,
      updatedAt: Date.now(),
    });
    saveUserProfileLocal(fallback);
    return fallback;
  }
}

// Google Sign-In with Popup
export async function loginWithGoogle(): Promise<UserProfile> {
  const auth = getFirebaseAuthInstance();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(auth, provider);
    const profile = await syncUserProfileOnLogin(cred.user);
    sound.playCompletion();
    showToast('গুগল লগইন সফল হয়েছে! 🎉', `${profile.name}, স্বাগতম!`, 'success');
    return profile;
  } catch (err: any) {
    console.error('Google Sign-In Error:', err);
    let msg = 'গুগল লগইন সম্পন্ন করা যায়নি।';
    if (err?.code === 'auth/popup-closed-by-user') {
      msg = 'লগইন উইন্ডো বন্ধ করা হয়েছে।';
    } else if (err?.code === 'auth/unauthorized-domain') {
      msg = 'এই ডোমেনটি Firebase Console-এ Authorized Domains-এ যুক্ত করা নেই। অনুগ্রহ করে Firebase Console থেকে ডোমেনটি যুক্ত করুন।';
    } else if (err?.code === 'auth/operation-not-allowed') {
      msg = 'Firebase Console-এ Google Sign-In সক্রিয় করা নেই। Authentication > Sign-in method থেকে Google চালু করুন।';
    } else if (err?.message) {
      msg = err.message;
    }
    throw new Error(msg);
  }
}

// Email/Password login fallback
export async function loginWithEmail(email: string, pass: string): Promise<UserProfile> {
  const auth = getFirebaseAuthInstance();
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return await syncUserProfileOnLogin(cred.user);
}

// Email/Password registration
export async function registerWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
  const auth = getFirebaseAuthInstance();
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  const profile = await syncUserProfileOnLogin(cred.user);
  // Update name if available
  if (name.trim()) {
    profile.name = name.trim();
    saveUserProfileLocal(profile);
    const db = getFirestoreDb();
    await setDoc(doc(db, 'users', profile.uid), { name: name.trim() }, { merge: true });
  }
  return profile;
}

// Logout
export async function logoutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuthInstance();
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out error:', err);
  }
  saveUserProfileLocal(null);
  localStorage.removeItem(LOCAL_MY_TRACKER_KEY);
}

// Subscribe to auth changes
export function subscribeToAuth(callback: (user: UserProfile | null) => void): Unsubscribe {
  const auth = getFirebaseAuthInstance();
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const profile = await syncUserProfileOnLogin(firebaseUser);
        callback(profile);
      } catch {
        const fallback = getSavedUserProfile();
        callback(fallback);
      }
    } else {
      callback(null);
    }
  });
}

// ----------------------------------------------------
// REAL-TIME TRACKER SYNC (MY SPACE & PARTNER SPACE)
// ----------------------------------------------------

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel('duo_pod_channel_v2');
    }
    return broadcastChannel;
  }
  return null;
}

// Subscribe to MY OWN tracker (Owner: Read & Write)
export function subscribeToMyTracker(
  userId: string,
  userProfile: UserProfile,
  onData: (data: UserTrackerData) => void,
  onStatusChange?: (status: ConnectionStatus) => void
): Unsubscribe {
  // If demo mode
  if (userId.startsWith('demo_')) {
    onStatusChange?.('demo');
    const stored = localStorage.getItem(LOCAL_MY_TRACKER_KEY);
    let tracker: UserTrackerData;
    if (stored) {
      try {
        tracker = JSON.parse(stored);
      } catch {
        tracker = createInitialTracker(userId, userProfile.name, userProfile.email);
      }
    } else {
      tracker = createInitialTracker(userId, userProfile.name, userProfile.email);
      localStorage.setItem(LOCAL_MY_TRACKER_KEY, JSON.stringify(tracker));
    }
    onData(tracker);

    const channel = getBroadcastChannel();
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_MY_TRACKER' && e.data.userId === userId) {
        onData(e.data.tracker);
      }
    };
    channel?.addEventListener('message', handleMessage);

    return () => {
      channel?.removeEventListener('message', handleMessage);
    };
  }

  // Real Cloud Firestore sync
  onStatusChange?.('connecting');
  const db = getFirestoreDb();
  const trackerRef = doc(db, 'user_trackers', userId);

  let initialLoad = true;

  const unsub = onSnapshot(
    trackerRef,
    async (snap) => {
      onStatusChange?.('connected');
      if (snap.exists()) {
        const raw = snap.data();
        const data = normalizeTrackerData(raw, userId, userProfile.name, userProfile.email);
        localStorage.setItem(LOCAL_MY_TRACKER_KEY, JSON.stringify(data));
        onData(data);
      } else {
        // Document does not exist yet; bootstrap it!
        const initial = createInitialTracker(userId, userProfile.name, userProfile.email);
        initial.partnerUid = userProfile.partnerUid || null;
        localStorage.setItem(LOCAL_MY_TRACKER_KEY, JSON.stringify(initial));
        onData(initial);

        try {
          await setDoc(trackerRef, initial);
        } catch (writeErr) {
          console.warn('Could not write initial tracker to Firestore (using local):', writeErr);
        }
      }
      initialLoad = false;
    },
    (err) => {
      console.warn('Firestore subscription error (My Tracker):', err);
      onStatusChange?.('error');
      // Fallback to local storage or clean initial tracker
      const stored = localStorage.getItem(LOCAL_MY_TRACKER_KEY);
      let fallbackData: UserTrackerData;
      if (stored) {
        try {
          fallbackData = normalizeTrackerData(JSON.parse(stored), userId, userProfile.name, userProfile.email);
        } catch {
          fallbackData = createInitialTracker(userId, userProfile.name, userProfile.email);
        }
      } else {
        fallbackData = createInitialTracker(userId, userProfile.name, userProfile.email);
      }
      onData(fallbackData);
    }
  );

  return unsub;
}

// Update MY OWN tracker (Owner write)
export async function updateMyTracker(
  userId: string,
  updatedData: UserTrackerData
): Promise<void> {
  const stats = calculateTrackerStats(updatedData.habits);
  const now = Date.now();
  const todayKey = getTodayKey();

  const finalData: UserTrackerData = normalizeTrackerData({
    ...updatedData,
    healthScore: stats.healthScore,
    todayCompletionRate: stats.completionRate,
    todayCompletedCount: stats.completedCount,
    todayTotalCount: stats.totalCount,
    lastUpdated: now,
    history: {
      ...(updatedData.history || {}),
      [todayKey]: {
        completedCount: stats.completedCount,
        totalCount: stats.totalCount,
        rate: stats.completionRate,
      },
    },
  }, userId, updatedData.userName, updatedData.userEmail);

  // Local storage save
  localStorage.setItem(LOCAL_MY_TRACKER_KEY, JSON.stringify(finalData));

  // Broadcast to other tabs
  const channel = getBroadcastChannel();
  channel?.postMessage({
    type: 'UPDATE_MY_TRACKER',
    userId,
    tracker: finalData,
  });

  // Cloud Firestore save
  if (!userId.startsWith('demo_')) {
    try {
      const db = getFirestoreDb();
      const trackerRef = doc(db, 'user_trackers', userId);
      await setDoc(trackerRef, finalData, { merge: true });
    } catch (err) {
      console.error('Failed to sync My Tracker to Cloud Firestore:', err);
    }
  }
}

// Subscribe to PARTNER'S tracker (Strict Read-Only)
export function subscribeToPartnerTracker(
  partnerUid: string | null | undefined,
  onData: (data: UserTrackerData | null) => void,
  onNotification?: (text: string) => void
): Unsubscribe {
  if (!partnerUid) {
    onData(null);
    return () => {};
  }

  // If demo partner
  if (partnerUid.startsWith('demo_')) {
    const demoPartnerTracker = createInitialTracker(partnerUid, 'পার্টনার (Demo)', 'partner.demo@mail.com');
    // Set some sample progress for demonstration
    if (demoPartnerTracker.habits[0]) demoPartnerTracker.habits[0].current = 6;
    if (demoPartnerTracker.habits[2]) demoPartnerTracker.habits[2].current = 15;
    if (demoPartnerTracker.habits[2]) demoPartnerTracker.habits[2].completed = true;
    const stats = calculateTrackerStats(demoPartnerTracker.habits);
    demoPartnerTracker.todayCompletionRate = stats.completionRate;
    demoPartnerTracker.todayCompletedCount = stats.completedCount;
    demoPartnerTracker.healthScore = stats.healthScore;
    onData(demoPartnerTracker);

    const channel = getBroadcastChannel();
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'UPDATE_MY_TRACKER' && e.data.userId === partnerUid) {
        onData(e.data.tracker);
        if (e.data.tracker?.lastAction?.actionText) {
          onNotification?.(e.data.tracker.lastAction.actionText);
        }
      }
    };
    channel?.addEventListener('message', handleMessage);

    return () => {
      channel?.removeEventListener('message', handleMessage);
    };
  }

  const db = getFirestoreDb();
  const partnerRef = doc(db, 'user_trackers', partnerUid);

  let prevActionTime = 0;

  const unsub = onSnapshot(
    partnerRef,
    (snap) => {
      if (snap.exists()) {
        const raw = snap.data();
        const data = normalizeTrackerData(raw, partnerUid, 'পার্টনার');
        onData(data);

        // If partner completed an action, trigger real-time sound/toast alert
        if (data.lastAction && data.lastAction.timestamp > prevActionTime) {
          if (prevActionTime > 0) {
            sound.playBell();
            showToast(
              `${data.userName || 'পার্টনার'} লক্ষ্য পূরণ করেছেন! 🌟`,
              data.lastAction.actionText || 'পার্টনার তার অগ্রগতির তথ্য আপডেট করেছেন।',
              'celebrate'
            );
            onNotification?.(data.lastAction.actionText);
          }
          prevActionTime = data.lastAction.timestamp;
        }
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('Partner tracker read-only subscription error:', err);
      onData(null);
    }
  );

  return unsub;
}

// ----------------------------------------------------
// PARTNER PAIRING / CONNECTION (INVITE CODE OR EMAIL)
// ----------------------------------------------------

export interface PairPartnerResult {
  success: boolean;
  message: string;
  partner?: UserProfile;
}

// Normalize invite code inputs: strip extra spaces, uppercase, ensure POD- prefix
export function normalizeInviteCode(input: string): string {
  if (!input) return '';
  let clean = input.trim().replace(/\s+/g, '').toUpperCase();
  // If user only typed 4-character suffix like "SH7W", add "POD-"
  if (!clean.includes('-') && !clean.startsWith('POD') && clean.length === 4) {
    clean = 'POD-' + clean;
  } else if (clean.startsWith('POD') && !clean.startsWith('POD-')) {
    clean = 'POD-' + clean.slice(3);
  }
  return clean;
}

// Auto-link current user with an incoming partner (called reactively when partner links to currentUser)
export async function syncMyProfileWithPartner(currentUser: UserProfile, partnerData: UserProfile): Promise<UserProfile> {
  const updated: UserProfile = {
    ...currentUser,
    partnerUid: partnerData.uid,
    partnerName: partnerData.name,
    partnerEmail: partnerData.email,
    partnerPhoto: partnerData.photoURL || null,
    updatedAt: Date.now(),
  };

  saveUserProfileLocal(updated);

  if (!currentUser.uid.startsWith('demo_')) {
    try {
      const db = getFirestoreDb();
      const myUserRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        myUserRef,
        {
          partnerUid: partnerData.uid,
          partnerName: partnerData.name,
          partnerEmail: partnerData.email,
          partnerPhoto: partnerData.photoURL || null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      const myTrackerRef = doc(db, 'user_trackers', currentUser.uid);
      await setDoc(myTrackerRef, { partnerUid: partnerData.uid }, { merge: true });
    } catch (err) {
      console.warn('Could not persist auto-linked partner to Firestore:', err);
    }
  }

  sound.playCompletion();
  showToast(
    'পার্টনার আপনার সাথে যুক্ত হয়েছেন! 🤝',
    `${partnerData.name}-এর সাথে লাইভ সিঙ্ক শুরু হয়েছে।`,
    'celebrate'
  );

  return updated;
}

export async function connectPartnerByCodeOrEmail(
  currentUser: UserProfile,
  codeOrEmailInput: string
): Promise<PairPartnerResult> {
  const rawInput = codeOrEmailInput.trim();
  if (!rawInput) {
    return { success: false, message: 'অনুগ্রহ করে পার্টনারের কোড বা ইমেইল লিখুন।' };
  }

  const isEmail = rawInput.includes('@');
  const normalizedQuery = isEmail ? rawInput.toLowerCase() : normalizeInviteCode(rawInput);
  const normalizedMyCode = normalizeInviteCode(currentUser.inviteCode);

  // Cannot connect to self
  if (
    (!isEmail && (normalizedQuery === normalizedMyCode || normalizedQuery === currentUser.inviteCode.toUpperCase())) ||
    (isEmail && currentUser.email && normalizedQuery === currentUser.email.toLowerCase())
  ) {
    return {
      success: false,
      message: 'আপনি নিজের কোড বা ইমেইল দিয়ে নিজের সাথে যুক্ত হতে পারবেন না। আপনার পার্টনারের কোড দিন।',
    };
  }

  // In demo mode: simulate instant connection
  if (currentUser.uid.startsWith('demo_')) {
    const demoPartner: UserProfile = {
      uid: 'demo_user_partner',
      name: isEmail ? rawInput.split('@')[0] : 'পার্টনার (Duo)',
      email: isEmail ? rawInput : 'partner@mail.com',
      inviteCode: normalizedQuery,
      partnerUid: currentUser.uid,
      partnerName: currentUser.name,
      partnerEmail: currentUser.email,
      updatedAt: Date.now(),
    };

    currentUser.partnerUid = demoPartner.uid;
    currentUser.partnerName = demoPartner.name;
    currentUser.partnerEmail = demoPartner.email;
    saveUserProfileLocal(currentUser);

    sound.playCompletion();
    showToast('পার্টনার সফলভাবে যুক্ত হয়েছে! 🤝', `${demoPartner.name}-এর সাথে কানেক্ট সম্পন্ন।`, 'celebrate');
    return { success: true, message: 'পার্টনার যুক্ত হয়েছে', partner: demoPartner };
  }

  try {
    const db = getFirestoreDb();
    const usersCol = collection(db, 'users');

    let partnerDocSnap: any = null;

    if (isEmail) {
      // Query by email
      const qEmail = query(usersCol, where('email', '==', normalizedQuery));
      const snap = await getDocs(qEmail);
      if (!snap.empty) {
        partnerDocSnap = snap.docs[0];
      }
    } else {
      // Query by normalized invite code (e.g. POD-SH7W)
      const qCode = query(usersCol, where('inviteCode', '==', normalizedQuery));
      let snap = await getDocs(qCode);
      if (!snap.empty) {
        partnerDocSnap = snap.docs[0];
      } else {
        // Fallback: search with raw input trimmed and uppercase
        const rawUpper = rawInput.replace(/\s*-\s*/g, '-').toUpperCase();
        if (rawUpper !== normalizedQuery) {
          const qFallback = query(usersCol, where('inviteCode', '==', rawUpper));
          snap = await getDocs(qFallback);
          if (!snap.empty) {
            partnerDocSnap = snap.docs[0];
          }
        }
      }
    }

    if (!partnerDocSnap) {
      return {
        success: false,
        message: `"${isEmail ? rawInput : normalizedQuery}" দিয়ে কোনো অ্যাকাউন্ট পাওয়া যায়নি। আপনার পার্টনারকে এই অ্যাপে গুগল দিয়ে লগইন করতে বলুন এবং তার স্ক্রিনে থাকা কোডটি সংগ্রহ করুন।`,
      };
    }

    const partnerData = partnerDocSnap.data() as UserProfile;

    if (partnerData.uid === currentUser.uid) {
      return { success: false, message: 'আপনি নিজের সাথে কানেক্ট করতে পারবেন না।' };
    }

    // 1. Update current user's profile in Firestore (OWNER WRITE - ALWAYS SUCCEEDS)
    const myUserRef = doc(db, 'users', currentUser.uid);
    await setDoc(
      myUserRef,
      {
        partnerUid: partnerData.uid,
        partnerName: partnerData.name,
        partnerEmail: partnerData.email,
        partnerPhoto: partnerData.photoURL || null,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // 2. Update current user's tracker in Firestore (OWNER WRITE - ALWAYS SUCCEEDS)
    const myTrackerRef = doc(db, 'user_trackers', currentUser.uid);
    await setDoc(myTrackerRef, { partnerUid: partnerData.uid }, { merge: true });

    // 3. Attempt to also update partner's doc (safely catch if security rules restrict to owner only)
    try {
      const partnerUserRef = doc(db, 'users', partnerData.uid);
      await setDoc(
        partnerUserRef,
        {
          partnerUid: currentUser.uid,
          partnerName: currentUser.name,
          partnerEmail: currentUser.email,
          partnerPhoto: currentUser.photoURL || null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (e) {
      console.log('Cross-user profile write skipped (partner device will auto-link reactively):', e);
    }

    try {
      const partnerTrackerRef = doc(db, 'user_trackers', partnerData.uid);
      await setDoc(partnerTrackerRef, { partnerUid: currentUser.uid }, { merge: true });
    } catch (e) {
      console.log('Cross-user tracker write skipped (partner device will auto-link reactively):', e);
    }

    // 4. Update local profile state
    currentUser.partnerUid = partnerData.uid;
    currentUser.partnerName = partnerData.name;
    currentUser.partnerEmail = partnerData.email;
    currentUser.partnerPhoto = partnerData.photoURL;
    saveUserProfileLocal(currentUser);

    sound.playCompletion();
    showToast('পার্টনার সফলভাবে যুক্ত হয়েছে! 🤝', `${partnerData.name}-এর সাথে কানেক্ট সম্পন্ন।`, 'celebrate');

    return {
      success: true,
      message: `${partnerData.name}-এর সাথে সফলভাবে কানেক্ট হয়েছে!`,
      partner: partnerData,
    };
  } catch (err: any) {
    console.error('Error connecting partner:', err);
    let errorMsg = err?.message || String(err);
    if (errorMsg.includes('permission') || errorMsg.includes('Missing or insufficient permissions')) {
      errorMsg = 'Firestore নিরাপত্তা নিয়মের কারণে পার্টনার খোঁজা যায়নি। অনুগ্রহ করে Firebase Console থেকে Rules আপডেট করুন (Settings-এ নির্দেশিকা দেওয়া আছে)।';
    }
    return {
      success: false,
      message: 'পার্টনার কানেক্ট করার সময় ত্রুটি ঘটেছে: ' + errorMsg,
    };
  }
}

// Disconnect/Unpair Partner
export async function disconnectPartner(currentUser: UserProfile): Promise<void> {
  const partnerUid = currentUser.partnerUid;

  currentUser.partnerUid = null;
  currentUser.partnerName = null;
  currentUser.partnerEmail = null;
  currentUser.partnerPhoto = null;
  saveUserProfileLocal(currentUser);

  if (!currentUser.uid.startsWith('demo_')) {
    try {
      const db = getFirestoreDb();
      // Reset own user profile
      const myUserRef = doc(db, 'users', currentUser.uid);
      await setDoc(
        myUserRef,
        {
          partnerUid: null,
          partnerName: null,
          partnerEmail: null,
          partnerPhoto: null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      // Reset own tracker
      const myTrackerRef = doc(db, 'user_trackers', currentUser.uid);
      await setDoc(myTrackerRef, { partnerUid: null }, { merge: true });

      // Safely attempt to reset partner's doc without throwing if rules restrict cross-user writes
      if (partnerUid && !partnerUid.startsWith('demo_')) {
        try {
          const partnerUserRef = doc(db, 'users', partnerUid);
          await setDoc(
            partnerUserRef,
            {
              partnerUid: null,
              partnerName: null,
              partnerEmail: null,
              partnerPhoto: null,
              updatedAt: Date.now(),
            },
            { merge: true }
          );
        } catch (e) {
          console.log('Cross-user unlink profile skipped:', e);
        }

        try {
          const partnerTrackerRef = doc(db, 'user_trackers', partnerUid);
          await setDoc(partnerTrackerRef, { partnerUid: null }, { merge: true });
        } catch (e) {
          console.log('Cross-user unlink tracker skipped:', e);
        }
      }
    } catch (err) {
      console.error('Error disconnecting partner:', err);
    }
  }

  sound.playTick();
  showToast('পার্টনারের সংযোগ বিচ্ছিন্ন করা হয়েছে', 'আপনি যেকোনো সময় আবার নতুন কোড দিয়ে কানেক্ট করতে পারবেন।', 'info');
}
