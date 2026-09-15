import React, { useState, useEffect, useCallback } from 'react';
import type { PodData, Habit, ConnectionStatus } from './types';
import {
  getCurrentUserProfile,
  saveUserProfile,
  initPodSync,
  syncPodData,
  pairPartner,
  unpairPartner,
  createInitialPod,
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
import { ToastBanner } from './components/ToastBanner';
import { sound, showToast } from './services/notifications';
import { LayoutDashboard, BarChart3 } from 'lucide-react';
import { toBengaliNumber } from './utils/bengali';

export default function App() {
  const [myProfile, setMyProfile] = useState(() => getCurrentUserProfile());
  const [pod, setPod] = useState<PodData>(() => createInitialPod(myProfile.podId, myProfile.name));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('demo');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'insights'>('dashboard');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Modals state
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedHabitForLog, setSelectedHabitForLog] = useState<Habit | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFirebaseConfigOpen, setIsFirebaseConfigOpen] = useState(false);

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
  }, [myProfile.podId]);

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
            showToast(`${h.name} সম্পন্ন হয়েছে! 🎉`, `${myProfile.name} টার্গেট পূরণ করেছেন।`, 'celebrate');
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
            userId: myProfile.id,
            userName: myProfile.name,
            actionText: `${targetHabit?.name || 'লক্ষ্য'}-এ নতুন অগ্রগতি যোগ করেছেন`,
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
            userId: myProfile.id,
            userName: myProfile.name,
            actionText: isNowDone
              ? `${targetHabit?.name} সম্পন্ন করেছেন! ✓`
              : `${targetHabit?.name} অসম্পন্ন হিসেবে চিহ্নিত করেছেন`,
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
            userId: myProfile.id,
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
            userId: myProfile.id,
            userName: myProfile.name,
            actionText: `লক্ষ্যটি মুছে ফেলেছেন: "${habitToDelete?.name || ''}"`,
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
  const handlePairPartner = async (partnerCode: string) => {
    const updated = await pairPartner(pod, partnerCode, myProfile);
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
    const newProfile = {
      ...myProfile,
      role: newRole,
      name: newRole === 'userA' ? 'আমি' : 'পার্টনার',
    };
    setMyProfile(newProfile);
    saveUserProfile(newProfile);
    showToast(
      `পারস্পেক্টিভ পরিবর্তিত: ${newProfile.name}`,
      'এখন আপনি দেখতে পাচ্ছেন পার্টনারের দিক থেকে স্ক্রিন কেমন দেখায়!',
      'info'
    );
  };

  // Update user name
  const handleUpdateUserName = (newName: string) => {
    const newProfile = { ...myProfile, name: newName };
    setMyProfile(newProfile);
    saveUserProfile(newProfile);
  };

  return (
    <div className="min-h-screen bg-[#0b0e17] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Real-time Toast Notifications */}
      <ToastBanner />

      {/* App Header */}
      <Header
        currentStreak={pod.currentStreak || 12}
        connectionStatus={connectionStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCelebration={() => setIsCelebrationOpen(true)}
        notificationPermission={notificationPermission}
      />

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
        onPairPartner={handlePairPartner}
        onUnpairPartner={handleUnpairPartner}
        onUpdateUserName={handleUpdateUserName}
      />

      <FirebaseModal
        isOpen={isFirebaseConfigOpen}
        onClose={() => setIsFirebaseConfigOpen(false)}
        onConfigSaved={() => {
          // Re-trigger sync by toggling podId or connection state
          setMyProfile((prev) => ({ ...prev }));
        }}
      />
    </div>
  );
}
