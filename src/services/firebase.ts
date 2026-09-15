import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  onSnapshot,
  getDocFromServer,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import type { FirebaseConfig, PodData, Habit, ConnectionStatus } from '../types';
import { sound, showToast } from './notifications';
import { getTodayKey } from '../utils/bengali';

const CONFIG_STORAGE_KEY = 'duo_pod_firebase_config';
const LOCAL_POD_STORAGE_KEY = 'duo_pod_data';
const USER_PROFILE_KEY = 'duo_pod_user_profile';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firestoreUnsub: Unsubscribe | null = null;
let broadcastChannel: BroadcastChannel | null = null;

// Initial Default Habits matching the preset options
export function getDefaultHabits(): Habit[] {
  const now = Date.now();
  return [
    {
      id: 'habit-steps',
      name: 'হাঁটা',
      type: 'number',
      target: 10000,
      unit: 'কদম',
      frequency: 'daily',
      emoji: '👟',
      myProgress: 6500,
      partnerProgress: 8200,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'habit-sleep',
      name: 'পর্যাপ্ত ঘুম',
      type: 'number',
      target: 8,
      unit: 'ঘণ্টা',
      frequency: 'daily',
      emoji: '🌙',
      myProgress: 7.5,
      partnerProgress: 8,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'habit-water',
      name: 'পানি পান',
      type: 'number',
      target: 8,
      unit: 'গ্লাস',
      frequency: 'daily',
      emoji: '💧',
      myProgress: 5,
      partnerProgress: 6,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'habit-workout',
      name: 'ব্যায়াম',
      type: 'number',
      target: 45,
      unit: 'মিনিট',
      frequency: 'daily',
      emoji: '⚡',
      myProgress: 30,
      partnerProgress: 45,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'habit-reading',
      name: 'বই পড়া',
      type: 'number',
      target: 20,
      unit: 'পৃষ্ঠা',
      frequency: 'daily',
      emoji: '📖',
      myProgress: 15,
      partnerProgress: 20,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'habit-vitamins',
      name: 'ভিটামিন ও ওষুধ',
      type: 'boolean',
      target: 1,
      unit: 'বার',
      frequency: 'daily',
      emoji: '💊',
      myProgress: 1,
      partnerProgress: 1,
      completedByMe: true,
      completedByPartner: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function createInitialPod(podId: string, userName: string = 'আমি'): PodData {
  const now = Date.now();
  const today = getTodayKey();
  return {
    podId,
    createdAt: now,
    userA: {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: userName,
      role: 'userA',
      lastActive: now,
    },
    userB: null,
    habits: getDefaultHabits(),
    currentStreak: 12,
    bestStreak: 24,
    daysTogether: 42,
    healthScore: 86,
    history: {
      [today]: { userADone: false, userBDone: false },
    },
    lastSyncTime: now,
    lastAction: {
      userId: 'system',
      userName: 'একসাথে সিস্টেম',
      actionText: 'পড সক্রিয় হয়েছে',
      timestamp: now,
    },
  };
}

// User Identity management
export function getCurrentUserProfile(): { id: string; name: string; role: 'userA' | 'userB'; podId: string } {
  if (typeof window === 'undefined') {
    return { id: 'usr_me', name: 'আমি', role: 'userA', podId: 'D-74921' };
  }

  // Check URL params for quick partner testing ?role=userB&pod=D-74921
  const urlParams = new URLSearchParams(window.location.search);
  const paramRole = urlParams.get('role');
  const paramPod = urlParams.get('pod');

  const saved = localStorage.getItem(USER_PROFILE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (paramRole === 'userB' || paramRole === 'userA') {
        parsed.role = paramRole;
      }
      if (paramPod) {
        parsed.podId = paramPod;
      }
      return parsed;
    } catch {
      // Ignore
    }
  }

  const newProfile = {
    id: 'usr_' + Math.random().toString(36).substring(2, 8),
    name: paramRole === 'userB' ? 'পার্টনার' : 'আমি',
    role: (paramRole === 'userB' ? 'userB' : 'userA') as 'userA' | 'userB',
    podId: paramPod || 'D-74921',
  };
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile));
  return newProfile;
}

export function saveUserProfile(profile: { id: string; name: string; role: 'userA' | 'userB'; podId: string }) {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (!config) {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
}

// Subscribe to Pod state with both Firestore AND BroadcastChannel (hybrid multi-tab/cross-device)
export function initPodSync(
  podId: string,
  onPodUpdate: (data: PodData) => void,
  onStatusChange: (status: ConnectionStatus) => void
): () => void {
  // Initialize BroadcastChannel for instant local cross-tab sync
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(`duo_pod_${podId}`);
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.podId === podId) {
          onPodUpdate(event.data);
          handleRemoteActionNotice(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available', e);
    }
  }

  // Cross-tab storage fallback
  const onStorageEvent = (e: StorageEvent) => {
    if (e.key === `${LOCAL_POD_STORAGE_KEY}_${podId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onPodUpdate(parsed);
        handleRemoteActionNotice(parsed);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', onStorageEvent);

  // Load existing local data first
  const localRaw = localStorage.getItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`);
  let currentPod: PodData;
  if (localRaw) {
    try {
      currentPod = JSON.parse(localRaw);
    } catch {
      currentPod = createInitialPod(podId);
    }
  } else {
    currentPod = createInitialPod(podId);
    localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`, JSON.stringify(currentPod));
  }
  onPodUpdate(currentPod);

  // Check if Firebase Config exists
  const config = getSavedFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    onStatusChange('connecting');
    try {
      if (!getApps().length) {
        firebaseApp = initializeApp(config);
      } else {
        firebaseApp = getApp();
      }
      firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);

      // Verify connection
      const podDocRef = doc(firestoreDb, 'pods', podId);

      testFirestoreConnection(firestoreDb).catch(() => {});

      // Set up real-time listener
      firestoreUnsub = onSnapshot(
        podDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as PodData;
            onPodUpdate(data);
            localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`, JSON.stringify(data));
            handleRemoteActionNotice(data);
            onStatusChange('connected');
          } else {
            // Create the document if it doesn't exist in Firestore
            setDoc(podDocRef, currentPod).catch((err) => {
              console.warn('Could not init Firestore pod document:', err);
            });
            onStatusChange('connected');
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error, falling back to local sync:', error.message);
          onStatusChange('demo');
        }
      );
    } catch (err) {
      console.warn('Firebase init error:', err);
      onStatusChange('demo');
    }
  } else {
    onStatusChange('demo');
  }

  // Cleanup handler
  return () => {
    if (firestoreUnsub) {
      firestoreUnsub();
      firestoreUnsub = null;
    }
    if (broadcastChannel) {
      broadcastChannel.close();
      broadcastChannel = null;
    }
    window.removeEventListener('storage', onStorageEvent);
  };
}

let lastNotifiedActionTime = Date.now();

function handleRemoteActionNotice(podData: PodData) {
  if (!podData.lastAction) return;
  const currentProfile = getCurrentUserProfile();

  // If action was done by someone else and is fresh
  if (
    podData.lastAction.userId !== currentProfile.id &&
    podData.lastAction.timestamp > lastNotifiedActionTime
  ) {
    lastNotifiedActionTime = podData.lastAction.timestamp;
    sound.playPartnerUpdate();
    showToast(
      `পার্টনারের আপডেট: ${podData.lastAction.userName}`,
      podData.lastAction.actionText,
      'info'
    );
  }
}

async function testFirestoreConnection(db: Firestore) {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration or internet connection.');
    }
  }
}

// Push an updated PodData object to both local storage, broadcast channel, and Firestore
export async function syncPodData(data: PodData): Promise<void> {
  const updated: PodData = {
    ...data,
    lastSyncTime: Date.now(),
  };

  // 1. Local storage
  localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${data.podId}`, JSON.stringify(updated));

  // 2. BroadcastChannel for active browser tabs
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(updated);
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }
  }

  // 3. Firestore update
  if (firestoreDb) {
    try {
      const podDocRef = doc(firestoreDb, 'pods', data.podId);
      await setDoc(podDocRef, updated, { merge: true });
    } catch (err) {
      console.warn('Firestore sync failed:', err);
    }
  }
}

// Pair a partner
export async function pairPartner(
  pod: PodData,
  partnerCode: string,
  myProfile: { id: string; name: string; role: 'userA' | 'userB'; podId: string }
): Promise<PodData> {
  const now = Date.now();
  let updatedPod: PodData;

  if (myProfile.role === 'userA') {
    // I am userA adding partner as userB
    updatedPod = {
      ...pod,
      userB: {
        id: 'usr_partner_' + Math.random().toString(36).substring(2, 7),
        name: 'পার্টনার (' + partnerCode + ')',
        role: 'userB',
        lastActive: now,
      },
      lastAction: {
        userId: myProfile.id,
        userName: myProfile.name,
        actionText: 'পার্টনারের সাথে পড কানেক্ট করা হয়েছে! 🤝',
        timestamp: now,
      },
    };
  } else {
    // I am userB joining userA's pod
    updatedPod = {
      ...pod,
      podId: partnerCode,
      userB: {
        id: myProfile.id,
        name: myProfile.name,
        role: 'userB',
        lastActive: now,
      },
      lastAction: {
        userId: myProfile.id,
        userName: myProfile.name,
        actionText: 'পডে যুক্ত হয়েছেন! 🤝',
        timestamp: now,
      },
    };
  }

  await syncPodData(updatedPod);
  showToast('পার্টনার সফলভাবে সংযুক্ত হয়েছেন! 🎉', 'এখন যেকোনো অগ্রগতি দুজনের স্ক্রিনেই রিয়েল টাইমে আপডেট হবে।', 'celebrate');
  sound.playCompletion();
  return updatedPod;
}

// Unpair / disconnect partner
export async function unpairPartner(
  pod: PodData,
  myProfile: { id: string; name: string; role: 'userA' | 'userB'; podId: string }
): Promise<PodData> {
  const now = Date.now();
  const updatedPod: PodData = {
    ...pod,
    userB: null,
    lastAction: {
      userId: myProfile.id,
      userName: myProfile.name,
      actionText: 'পার্টনার পড থেকে বিচ্ছিন্ন হয়েছেন।',
      timestamp: now,
    },
  };

  await syncPodData(updatedPod);
  showToast('পার্টনার বিচ্ছিন্ন করা হয়েছে', 'আপনি যেকোনো সময় নতুন কোড দিয়ে পার্টনারকে পুনরায় যুক্ত করতে পারবেন।', 'warning');
  return updatedPod;
}
