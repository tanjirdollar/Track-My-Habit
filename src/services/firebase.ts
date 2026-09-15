import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  getDocFromServer,
  collection,
  query,
  where,
  getDocs,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';
import type { FirebaseConfig, PodData, Habit, ConnectionStatus, AuthUserProfile, PodUser } from '../types';
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
const LOCAL_POD_STORAGE_KEY = 'duo_pod_data';
const USER_PROFILE_KEY = 'duo_pod_auth_user_profile';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let firestoreUnsub: Unsubscribe | null = null;
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

// Initial Default Habits
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

export function createInitialPod(
  podId: string,
  userAInfo?: { id: string; name: string; email?: string }
): PodData {
  const now = Date.now();
  const today = getTodayKey();
  return {
    podId,
    createdAt: now,
    userA: {
      id: userAInfo?.id || 'usr_' + Math.random().toString(36).substring(2, 8),
      name: userAInfo?.name || 'আমি',
      email: userAInfo?.email || '',
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

// Config helpers
export function getSavedFirebaseConfig(): FirebaseConfig | null {
  if (typeof window === 'undefined') return DEFAULT_FIREBASE_CONFIG;
  const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!raw) return DEFAULT_FIREBASE_CONFIG;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_FIREBASE_CONFIG;
  }
}

export function saveFirebaseConfig(config: FirebaseConfig | null) {
  if (!config) {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
  // Reset cached instances to use new config
  firebaseApp = null;
  firestoreDb = null;
  firebaseAuth = null;
}

// ==================== AUTHENTICATION SERVICES ====================

// Get saved user profile from localStorage
export function getSavedUserProfile(): AuthUserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Get current active user profile or default demo profile
export function getCurrentUserProfile(): AuthUserProfile {
  const saved = getSavedUserProfile();
  if (saved) return saved;

  let initialPodId = 'POD-DUO88';
  let initialRole: 'userA' | 'userB' = 'userA';
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('pod');
    if (p) initialPodId = p;
    const r = params.get('role');
    if (r === 'userB' || r === 'userA') initialRole = r;
  }

  const demoUser: AuthUserProfile = {
    uid: 'demo_userA_' + Math.random().toString(36).substring(2, 7),
    name: initialRole === 'userA' ? 'আমি' : 'পার্টনার',
    email: '',
    role: initialRole,
    podId: initialPodId,
  };
  saveUserProfile(demoUser);
  return demoUser;
}

export function saveUserProfile(profile: AuthUserProfile | null) {
  if (!profile) {
    localStorage.removeItem(USER_PROFILE_KEY);
  } else {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  }
}

// Subscribe to Firebase Auth state
export function subscribeToAuth(
  onUserChanged: (user: AuthUserProfile | null) => void
): () => void {
  try {
    const auth = getFirebaseAuthInstance();
    return onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        // Fetch or create profile in Firestore
        const profile = await syncUserProfileFromFirestore(fbUser);
        saveUserProfile(profile);
        onUserChanged(profile);
      } else {
        const local = getSavedUserProfile();
        // If not a demo user, clear profile
        if (local && !local.uid.startsWith('demo_')) {
          saveUserProfile(null);
          onUserChanged(null);
        } else {
          onUserChanged(local);
        }
      }
    });
  } catch (err) {
    console.warn('Auth listener init error:', err);
    onUserChanged(getSavedUserProfile());
    return () => {};
  }
}

// Fetch or create user record in Firestore `users/{uid}`
async function syncUserProfileFromFirestore(
  fbUser: FirebaseUser,
  customName?: string
): Promise<AuthUserProfile> {
  const db = getFirestoreDb();
  const userDocRef = doc(db, 'users', fbUser.uid);

  // Check URL params for quick partner code/invite: ?pod=D-74921
  let invitePodId: string | null = null;
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    invitePodId = params.get('pod');
  }

  try {
    const snapshot = await getDoc(userDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data() as AuthUserProfile;
      return {
        uid: fbUser.uid,
        email: fbUser.email || data.email || '',
        name: fbUser.displayName || data.name || customName || 'ইউজার',
        role: data.role || 'userA',
        podId: data.podId || (invitePodId ? invitePodId : `POD-${fbUser.uid.substring(0, 5).toUpperCase()}`),
        partnerUid: data.partnerUid,
        partnerEmail: data.partnerEmail,
      };
    }
  } catch (err) {
    console.warn('Error fetching user document from Firestore:', err);
  }

  // Create new user record
  const defaultPodId = invitePodId ? invitePodId : `POD-${fbUser.uid.substring(0, 5).toUpperCase()}`;
  const newProfile: AuthUserProfile = {
    uid: fbUser.uid,
    email: fbUser.email || '',
    name: fbUser.displayName || customName || (fbUser.email ? fbUser.email.split('@')[0] : 'ইউজার'),
    role: invitePodId ? 'userB' : 'userA',
    podId: defaultPodId,
  };

  try {
    await setDoc(userDocRef, newProfile, { merge: true });
  } catch (err) {
    console.warn('Could not save user profile to Firestore:', err);
  }

  return newProfile;
}

// Register with Email & Password
export async function registerWithEmail(
  name: string,
  email: string,
  pass: string
): Promise<AuthUserProfile> {
  const auth = getFirebaseAuthInstance();
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (name.trim()) {
    try {
      await updateProfile(userCredential.user, { displayName: name.trim() });
    } catch {
      // ignore
    }
  }
  const profile = await syncUserProfileFromFirestore(userCredential.user, name.trim());
  saveUserProfile(profile);
  return profile;
}

// Login with Email & Password
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<AuthUserProfile> {
  const auth = getFirebaseAuthInstance();
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  const profile = await syncUserProfileFromFirestore(userCredential.user);
  saveUserProfile(profile);
  return profile;
}

// Logout
export async function logoutUser(): Promise<void> {
  try {
    const auth = getFirebaseAuthInstance();
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase sign out error:', err);
  }
  saveUserProfile(null);
}

// Quick Demo Login (for instant testing or offline demo)
export function loginAsDemo(role: 'userA' | 'userB', customName?: string): AuthUserProfile {
  const profile: AuthUserProfile = {
    uid: role === 'userA' ? 'demo_user_a_101' : 'demo_user_b_202',
    email: role === 'userA' ? 'user_a@duopod.app' : 'partner_b@duopod.app',
    name: customName || (role === 'userA' ? 'আমি (User A)' : 'পার্টনার (User B)'),
    role,
    podId: 'POD-74921',
  };
  saveUserProfile(profile);
  return profile;
}

// ==================== POD SYNCHRONIZATION ====================

export function initPodSync(
  podId: string,
  currentUser: AuthUserProfile,
  onPodUpdate: (data: PodData) => void,
  onStatusChange: (status: ConnectionStatus) => void
): () => void {
  // 1. BroadcastChannel for instant local cross-tab sync
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(`duo_pod_${podId}`);
      broadcastChannel.onmessage = (event) => {
        if (event.data && event.data.podId === podId) {
          onPodUpdate(event.data);
          handleRemoteActionNotice(event.data, currentUser.uid);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not available', e);
    }
  }

  // 2. Storage event fallback
  const onStorageEvent = (e: StorageEvent) => {
    if (e.key === `${LOCAL_POD_STORAGE_KEY}_${podId}` && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        onPodUpdate(parsed);
        handleRemoteActionNotice(parsed, currentUser.uid);
      } catch {
        // ignore
      }
    }
  };
  window.addEventListener('storage', onStorageEvent);

  // 3. Load local cache first for instant UI response
  const localRaw = localStorage.getItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`);
  let currentPod: PodData;
  if (localRaw) {
    try {
      currentPod = JSON.parse(localRaw);
    } catch {
      currentPod = createInitialPod(podId, {
        id: currentUser.uid,
        name: currentUser.name,
        email: currentUser.email,
      });
    }
  } else {
    currentPod = createInitialPod(podId, {
      id: currentUser.uid,
      name: currentUser.name,
      email: currentUser.email,
    });
    localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`, JSON.stringify(currentPod));
  }
  onPodUpdate(currentPod);

  // 4. Firestore Live Sync
  onStatusChange('connecting');
  try {
    const db = getFirestoreDb();
    const podDocRef = doc(db, 'pods', podId);

    firestoreUnsub = onSnapshot(
      podDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const cloudData = snapshot.data() as PodData;
          onPodUpdate(cloudData);
          localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${podId}`, JSON.stringify(cloudData));
          handleRemoteActionNotice(cloudData, currentUser.uid);
          onStatusChange('connected');
        } else {
          // Document does not exist in Firestore yet: upload initial pod
          setDoc(podDocRef, currentPod, { merge: true })
            .then(() => onStatusChange('connected'))
            .catch((err) => {
              console.warn('Could not initialize Firestore pod document:', err);
              onStatusChange('demo');
            });
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot error:', error.message);
        onStatusChange('demo');
      }
    );
  } catch (err) {
    console.warn('Firebase init error:', err);
    onStatusChange('demo');
  }

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

function handleRemoteActionNotice(podData: PodData, myUserId: string) {
  if (!podData.lastAction) return;

  // If action was executed by the other user and is fresh
  if (
    podData.lastAction.userId !== myUserId &&
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

// Push updated PodData to Firestore and Local Storage
export async function syncPodData(data: PodData): Promise<void> {
  const updated: PodData = {
    ...data,
    lastSyncTime: Date.now(),
  };

  // 1. Local Storage
  localStorage.setItem(`${LOCAL_POD_STORAGE_KEY}_${data.podId}`, JSON.stringify(updated));

  // 2. BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(updated);
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }
  }

  // 3. Firestore
  try {
    const db = getFirestoreDb();
    const podDocRef = doc(db, 'pods', data.podId);
    await setDoc(podDocRef, updated, { merge: true });
  } catch (err) {
    console.warn('Firestore sync failed:', err);
  }
}

// Connect / Pair with a partner via Pod Code or Partner Email
export async function pairPartnerByCodeOrEmail(
  pod: PodData,
  partnerCodeOrEmail: string,
  myProfile: AuthUserProfile
): Promise<{ success: boolean; message: string; updatedPod?: PodData }> {
  const queryText = partnerCodeOrEmail.trim();
  if (!queryText) {
    return { success: false, message: 'অনুগ্রহ করে পার্টনারের পড কোড বা ইমেইল লিখুন।' };
  }

  const now = Date.now();
  const db = getFirestoreDb();

  // If query is an email, search in 'users' collection
  if (queryText.includes('@')) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', queryText.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const partnerDoc = querySnapshot.docs[0];
        const partnerData = partnerDoc.data() as AuthUserProfile;

        if (partnerData.uid === myProfile.uid) {
          return { success: false, message: 'নিজের ইমেইল দিয়ে পার্টনার হিসেবে যুক্ত হওয়া যাবে না।' };
        }

        const partnerUser: PodUser = {
          id: partnerData.uid,
          name: partnerData.name || partnerData.email.split('@')[0],
          email: partnerData.email,
          role: 'userB',
          lastActive: now,
        };

        const updatedPod: PodData = {
          ...pod,
          userB: partnerUser,
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: `${partnerUser.name}-এর সাথে পড কানেক্ট করা হয়েছে! 🤝`,
            timestamp: now,
          },
        };

        // Update partner's user doc with this podId
        await setDoc(
          doc(db, 'users', partnerData.uid),
          { podId: pod.podId, partnerUid: myProfile.uid, partnerEmail: myProfile.email, role: 'userB' },
          { merge: true }
        );

        // Update my user doc
        await setDoc(
          doc(db, 'users', myProfile.uid),
          { partnerUid: partnerData.uid, partnerEmail: partnerData.email, role: 'userA' },
          { merge: true }
        );

        await syncPodData(updatedPod);
        sound.playCompletion();
        showToast('পার্টনার সফলভাবে সংযুক্ত হয়েছেন! 🎉', `${partnerUser.name} আপনার পডে যুক্ত হয়েছেন।`, 'celebrate');
        return { success: true, message: 'পার্টনার সংযুক্ত হয়েছে!', updatedPod };
      }
    } catch (err) {
      console.warn('Error finding user by email in Firestore:', err);
    }
  }

  // Treat as Pod Code (e.g. POD-12345 or D-74921)
  const targetPodId = queryText.toUpperCase();

  // If joining another existing pod
  if (targetPodId !== pod.podId) {
    try {
      const targetDoc = await getDoc(doc(db, 'pods', targetPodId));
      if (targetDoc.exists()) {
        const targetData = targetDoc.data() as PodData;
        const updatedTargetPod: PodData = {
          ...targetData,
          userB: {
            id: myProfile.uid,
            name: myProfile.name,
            email: myProfile.email,
            role: 'userB',
            lastActive: now,
          },
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: 'পডে নতুন পার্টনার যুক্ত হয়েছেন! 🤝',
            timestamp: now,
          },
        };

        await setDoc(doc(db, 'pods', targetPodId), updatedTargetPod, { merge: true });

        // Update my user profile
        await setDoc(
          doc(db, 'users', myProfile.uid),
          { podId: targetPodId, role: 'userB' },
          { merge: true }
        );

        // Update local storage profile
        saveUserProfile({
          ...myProfile,
          podId: targetPodId,
          role: 'userB',
        });

        sound.playCompletion();
        showToast('পডে সফলভাবে যুক্ত হয়েছেন! 🎉', `পড কোড: ${targetPodId}`, 'celebrate');
        return { success: true, message: 'পডে যুক্ত হয়েছেন!', updatedPod: updatedTargetPod };
      }
    } catch (err) {
      console.warn('Error joining pod by code:', err);
    }
  }

  // Otherwise, attach partner directly to current pod
  const partnerUser: PodUser = {
    id: 'usr_partner_' + Math.random().toString(36).substring(2, 7),
    name: `পার্টনার (${queryText})`,
    role: 'userB',
    lastActive: now,
  };

  const updatedPod: PodData = {
    ...pod,
    userB: partnerUser,
    lastAction: {
      userId: myProfile.uid,
      userName: myProfile.name,
      actionText: `পার্টনার (${queryText}) পডে যুক্ত হয়েছেন! 🤝`,
      timestamp: now,
    },
  };

  await syncPodData(updatedPod);
  sound.playCompletion();
  showToast('পার্টনার সংযুক্ত করা হয়েছে!', queryText, 'celebrate');
  return { success: true, message: 'পার্টনার যুক্ত হয়েছে', updatedPod };
}

// Alias for pairPartner returning updated PodData
export async function pairPartner(
  pod: PodData,
  partnerCodeOrEmail: string,
  myProfile: AuthUserProfile
): Promise<PodData> {
  const result = await pairPartnerByCodeOrEmail(pod, partnerCodeOrEmail, myProfile);
  return result.updatedPod || pod;
}

// Unpair partner
export async function unpairPartner(
  pod: PodData,
  myProfile: AuthUserProfile
): Promise<PodData> {
  const now = Date.now();
  const updatedPod: PodData = {
    ...pod,
    userB: null,
    lastAction: {
      userId: myProfile.uid,
      userName: myProfile.name,
      actionText: 'পার্টনার পড থেকে বিচ্ছিন্ন হয়েছেন।',
      timestamp: now,
    },
  };

  // Clear partner in firestore user profile
  try {
    const db = getFirestoreDb();
    await setDoc(
      doc(db, 'users', myProfile.uid),
      { partnerUid: null, partnerEmail: null },
      { merge: true }
    );
  } catch {
    // ignore
  }

  await syncPodData(updatedPod);
  showToast('পার্টনার বিচ্ছিন্ন করা হয়েছে', 'আপনি যেকোনো সময় নতুন কোড দিয়ে পার্টনারকে পুনরায় যুক্ত করতে পারবেন।', 'warning');
  return updatedPod;
}
