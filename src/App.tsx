import React, { useState, useEffect, useCallback } from 'react';
import type { PodData, Habit, ConnectionStatus, AuthUserProfile } from './types';
import {
  getCurrentUserProfile,
  saveUserProfile,
  initPodSync,
  syncPodData,
  pairPartnerByCodeOrEmail,
  unpairPartner,
  createInitialPod,
  subscribeToAuth,
  logoutUser,
} from './services/firebase';
import { Header } from './components/Header';
import { PartnerBar } from './components/PartnerBar';
import { DashboardView } from './components/DashboardView';
import { InsightsView } from './components/InsightsView';
import { AddGoalModal } from './components/AddGoalModal';
import { LogInputModal } from './components/LogInputModal';
import { CelebrationModal } from './components/CelebrationModal';
import { SettingsModal } from './components/SettingsModal';
import { FirebaseModal } from './components/FirebaseModal';
import { AuthModal } from './components/AuthModal';
import { ToastBanner } from './components/ToastBanner';
import { sound, showToast } from './services/notifications';
import { LayoutDashboard, BarChart3, LogIn, Sparkles } from 'lucide-react';
import { toBengaliNumber } from './utils/bengali';

export default function App() {
  const [myProfile, setMyProfile] = useState<AuthUserProfile>(() => getCurrentUserProfile());
  const [pod, setPod] = useState<PodData>(() => createInitialPod(myProfile.podId, myProfile.name));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights'>('dashboard');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedHabitForLog, setSelectedHabitForLog] = useState<Habit | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      if (user) {
        setMyProfile(user);
      }
    });
    return () => unsubAuth();
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Initialize Real-time synchronization
  useEffect(() => {
    const unsub = initPodSync(
      myProfile.podId,
      myProfile,
      (updatedData) => {
        setPod(updatedData);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    return () => {
      unsub();
    };
  }, [myProfile.podId, myProfile.uid, myProfile.role]);

  const isUserA = myProfile.role === 'userA';

  // Recalculate health score helper
  const calculateHealthScore = (habits: Habit[]): number => {
    if (!habits.length) return 80;
    let completed = 0;
    habits.forEach((h) => {
      const aDone = h.type === 'boolean' ? !!h.completedByMe : h.myProgress >= h.target;
      const bDone = h.type === 'boolean' ? !!h.completedByPartner : h.partnerProgress >= h.target;
      if (aDone) completed++;
      if (bDone) completed++;
    });
    const ratio = completed / (habits.length * 2);
    return Math.min(100, Math.max(50, Math.round(50 + ratio * 50)));
  };

  // Update progress for numeric habits (+/- or direct)
  const handleUpdateProgress = useCallback(
    async (habitId: string, delta: number, absolute?: number) => {
      setPod((prev) => {
        const updatedHabits = prev.habits.map((h) => {
          if (h.id !== habitId) return h;

          let newProgress: number;
          if (absolute !== undefined) {
            newProgress = Math.max(0, absolute);
          } else {
            const current = isUserA ? h.myProgress : h.partnerProgress;
            newProgress = Math.max(0, current + delta);
          }

          const targetReached = newProgress >= h.target;
          if (targetReached && (isUserA ? h.myProgress < h.target : h.partnerProgress < h.target)) {
            sound.playCompletion();
            showToast(`${h.name} সম্পন্ন হয়েছে! 🎉`, `${myProfile.name} লক্ষ্য পূরণ করেছেন।`, 'celebrate');
          }

          return {
            ...h,
            myProgress: isUserA ? newProgress : h.myProgress,
            partnerProgress: !isUserA ? newProgress : h.partnerProgress,
            updatedAt: Date.now(),
          };
        });

        const newScore = calculateHealthScore(updatedHabits);
        const targetHabit = updatedHabits.find((h) => h.id === habitId);

        const updatedPod: PodData = {
          ...prev,
          habits: updatedHabits,
          healthScore: newScore,
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: `${targetHabit?.name || 'লক্ষ্য'}-এ নতুন অগ্রগতি ইনপুট করেছেন`,
            habitName: targetHabit?.name,
            timestamp: Date.now(),
          },
        };

        syncPodData(updatedPod);
        return updatedPod;
      });
    },
    [isUserA, myProfile]
  );

  // Toggle boolean habit
  const handleToggleBoolean = useCallback(
    async (habitId: string) => {
      setPod((prev) => {
        const updatedHabits = prev.habits.map((h) => {
          if (h.id !== habitId) return h;
          const currentDone = isUserA ? !!h.completedByMe : !!h.completedByPartner;
          const newDone = !currentDone;

          return {
            ...h,
            completedByMe: isUserA ? newDone : h.completedByMe,
            completedByPartner: !isUserA ? newDone : h.completedByPartner,
            myProgress: isUserA ? (newDone ? 1 : 0) : h.myProgress,
            partnerProgress: !isUserA ? (newDone ? 1 : 0) : h.partnerProgress,
            updatedAt: Date.now(),
          };
        });

        const targetHabit = updatedHabits.find((h) => h.id === habitId);
        const isNowDone = isUserA ? targetHabit?.completedByMe : targetHabit?.completedByPartner;

        const updatedPod: PodData = {
          ...prev,
          habits: updatedHabits,
          healthScore: calculateHealthScore(updatedHabits),
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: isNowDone
              ? `${targetHabit?.name} সম্পন্ন করেছেন! ✓`
              : `${targetHabit?.name} টিক চিহ্ন প্রত্যাহার করেছেন`,
            habitName: targetHabit?.name,
            timestamp: Date.now(),
          },
        };

        syncPodData(updatedPod);
        return updatedPod;
      });
    },
    [isUserA, myProfile]
  );

  // Add new habit
  const handleAddHabit = useCallback(
    async (newHabitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'myProgress' | 'partnerProgress'>) => {
      const now = Date.now();
      const newHabit: Habit = {
        ...newHabitData,
        id: 'habit_' + Math.random().toString(36).substring(2, 9),
        myProgress: 0,
        partnerProgress: 0,
        completedByMe: false,
        completedByPartner: false,
        createdAt: now,
        updatedAt: now,
      };

      setPod((prev) => {
        const updatedPod: PodData = {
          ...prev,
          habits: [...prev.habits, newHabit],
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: `নতুন লক্ষ্য যুক্ত করেছেন: "${newHabit.name}"`,
            habitName: newHabit.name,
            timestamp: now,
          },
        };
        syncPodData(updatedPod);
        return updatedPod;
      });

      showToast('নতুন লক্ষ্য যুক্ত করা হয়েছে!', newHabit.name, 'success');
      sound.playCompletion();
    },
    [myProfile]
  );

  // Delete habit
  const handleDeleteHabit = useCallback(
    async (habitId: string) => {
      const habitToDelete = pod.habits.find((h) => h.id === habitId);
      setPod((prev) => {
        const updatedPod: PodData = {
          ...prev,
          habits: prev.habits.filter((h) => h.id !== habitId),
          lastAction: {
            userId: myProfile.uid,
            userName: myProfile.name,
            actionText: `লক্ষ্য মুছে ফেলেছেন: "${habitToDelete?.name || ''}"`,
            timestamp: Date.now(),
          },
        };
        syncPodData(updatedPod);
        return updatedPod;
      });
      showToast('লক্ষ্যটি মুছে ফেলা হয়েছে', habitToDelete?.name, 'info');
    },
    [pod.habits, myProfile]
  );

  // Pair partner
  const handlePairPartner = async (partnerCodeOrEmail: string) => {
    const updated = await pairPartnerByCodeOrEmail(pod, partnerCodeOrEmail, myProfile);
    setPod(updated);
  };

  // Unpair partner
  const handleUnpairPartner = async () => {
    const updated = await unpairPartner(pod, myProfile);
    setPod(updated);
  };

  // Switch role perspective (A <-> B)
  const handleSwitchPerspective = () => {
    sound.playTick();
    const newRole = myProfile.role === 'userA' ? 'userB' : 'userA';
    const newProfile: AuthUserProfile = {
      ...myProfile,
      role: newRole,
      name: myProfile.name || (newRole === 'userA' ? 'আমি' : 'পার্টনার'),
    };
    setMyProfile(newProfile);
    saveUserProfile(newProfile);
    showToast(
      `ভিউ পরিবর্তিত: ${newRole === 'userA' ? 'আমি (User A)' : 'পার্টনার (User B)'}`,
      'এখন আপনি দেখতে পাচ্ছেন পার্টনারের দিক থেকে স্ক্রিন ও ইনপুট কেমন কাজ করে!',
      'info'
    );
  };

  // Update user name
  const handleUpdateUserName = (newName: string) => {
    const newProfile: AuthUserProfile = { ...myProfile, name: newName };
    setMyProfile(newProfile);
    saveUserProfile(newProfile);
  };

  // Logout user
  const handleLogout = async () => {
    await logoutUser();
    const demo = getCurrentUserProfile();
    setMyProfile(demo);
    showToast('লগআউট সম্পন্ন হয়েছে', 'আপনি এখন ডেমো অ্যাকাউন্ট হিসেবে আছেন।', 'info');
  };

  const isDemo = !myProfile.email || myProfile.uid.startsWith('demo_');

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Real-time Toast Notifications */}
      <ToastBanner />

      {/* App Header */}
      <Header
        currentStreak={pod.currentStreak || 12}
        connectionStatus={connectionStatus}
        currentUser={myProfile}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCelebration={() => setIsCelebrationOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        notificationPermission={notificationPermission}
      />

      {/* Account Reminder Banner if Demo */}
      {isDemo && (
        <aside aria-label="Account login banner" className="mx-4 mt-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent border border-amber-500/20 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-200">
            <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              পার্টনারের সাথে আলাদা অ্যাকাউন্টে লাইভ সিঙ্ক করতে লগইন করুন
            </span>
          </div>
          <button
            onClick={() => setIsAuthOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/30 transition-all cursor-pointer shrink-0 flex items-center gap-1"
          >
            <LogIn className="w-3 h-3" />
            <span>লগইন / সাইন আপ</span>
          </button>
        </aside>
      )}

      {/* Partner Status Bar */}
      <div className="max-w-2xl w-full mx-auto">
        <PartnerBar
          myProfile={myProfile}
          partner={isUserA ? pod.userB : pod.userA}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onSwitchPerspective={handleSwitchPerspective}
        />
      </div>

      {/* Main Content View */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4">
        {activeTab === 'dashboard' ? (
          <DashboardView
            pod={pod}
            isUserA={isUserA}
            onUpdateProgress={handleUpdateProgress}
            onToggleBoolean={handleToggleBoolean}
            onOpenAddModal={() => setIsAddGoalOpen(true)}
            onOpenLogModal={(habit) => {
              setSelectedHabitForLog(habit);
              setIsLogModalOpen(true);
            }}
            onDeleteHabit={handleDeleteHabit}
          />
        ) : (
          <InsightsView pod={pod} />
        )}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#101524]/90 backdrop-blur-xl border-t border-white/5 py-2 px-6 flex justify-around items-center max-w-2xl mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-rose-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-xs tracking-wide">একসাথে</span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'insights'
              ? 'text-rose-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <BarChart3 className={`w-5 h-5 ${activeTab === 'insights' ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
          <span className="text-xs tracking-wide">ইনসাইটস</span>
        </button>
      </nav>

      {/* Auth Modal (Login / Sign Up) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setMyProfile(user);
        }}
      />

      {/* Modals */}
      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddHabit={handleAddHabit}
      />

      <LogInputModal
        isOpen={isLogModalOpen}
        isUserA={isUserA}
        habit={selectedHabitForLog}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedHabitForLog(null);
        }}
        onSaveValue={(habitId, val) => handleUpdateProgress(habitId, 0, val)}
      />

      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        streakCount={pod.currentStreak || 12}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        pod={pod}
        myProfile={myProfile}
        connectionStatus={connectionStatus}
        notificationPermission={notificationPermission}
        onOpenFirebaseConfig={() => {
          setIsSettingsOpen(false);
          setIsFirebaseConfigOpen(true);
        }}
        onOpenAuthModal={() => {
          setIsAuthOpen(true);
        }}
        onLogout={handleLogout}
        onPairPartner={handlePairPartner}
        onUnpairPartner={handleUnpairPartner}
        onUpdateUserName={handleUpdateUserName}
      />

      <FirebaseModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
        onConfigSaved={() => {
          setMyProfile((prev) => ({ ...prev }));
        }}
      />
    </div>
  );
}
