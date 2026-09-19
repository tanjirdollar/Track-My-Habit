import React, { useState, useEffect, useCallback } from 'react';
import type { UserProfile, UserTrackerData, Habit, ConnectionStatus, DuoMessage, PartnerNudge } from './types';
import {
  getDemoUserProfile,
  subscribeToAuth,
  subscribeToMyTracker,
  subscribeToPartnerTracker,
  updateMyTracker,
  createInitialTracker,
  calculateTrackerStats,
  normalizeInviteCode,
  syncMyProfileWithPartner,
  saveUserProfileLocal,
  getFirestoreDb,
  resetTrackerProgressToZero,
  sendDuoMessage,
  subscribeToDuoChat,
  sendNudgeToPartner,
  subscribeToPartnerNudges,
  sendBrowserNotification,
  requestNotificationPermission,
} from './services/firebase';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { Header } from './components/Header';
import { PartnerBar } from './components/PartnerBar';
import { DashboardView } from './components/DashboardView';
import { InsightsView } from './components/InsightsView';
import { AddGoalModal } from './components/AddGoalModal';
import { LogInputModal } from './components/LogInputModal';
import { CelebrationModal } from './components/CelebrationModal';
import { SettingsModal } from './components/SettingsModal';
import { ConnectPartnerModal } from './components/ConnectPartnerModal';
import { AuthModal } from './components/AuthModal';
import { NudgeModal } from './components/NudgeModal';
import { DuoChatModal } from './components/DuoChatModal';
import { ToastBanner } from './components/ToastBanner';
import { sound, showToast } from './services/notifications';
import { CheckCircle, Users, BarChart3, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getDemoUserProfile());
  const [partnerUser, setPartnerUser] = useState<UserProfile | null>(null);
  const [myTracker, setMyTracker] = useState<UserTrackerData>(() =>
    createInitialTracker(currentUser.uid, currentUser.name, currentUser.email)
  );
  const [partnerTracker, setPartnerTracker] = useState<UserTrackerData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('demo');
  const [activeTab, setActiveTab] = useState<'my_space' | 'partner_space' | 'insights'>('my_space');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedHabitForLog, setSelectedHabitForLog] = useState<Habit | null>(null);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [celebrationHabitName, setCelebrationHabitName] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNudgeOpen, setIsNudgeOpen] = useState(false);
  const [selectedNudgeHabit, setSelectedNudgeHabit] = useState<Habit | null>(null);
  const [chatMessages, setChatMessages] = useState<DuoMessage[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // 1. Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubAuth();
  }, []);

  // Sync myTracker immediately when currentUser changes
  useEffect(() => {
    setMyTracker((prev) => {
      if (prev && prev.userId === currentUser.uid) return prev;
      return createInitialTracker(currentUser.uid, currentUser.name, currentUser.email);
    });
  }, [currentUser.uid, currentUser.name, currentUser.email]);

  // 2. Check for URL invite parameter on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const invite = params.get('invite');
      if (invite) {
        const cleaned = normalizeInviteCode(invite);
        if (cleaned && cleaned !== normalizeInviteCode(currentUser.inviteCode)) {
          setPendingInviteCode(cleaned);
          setIsConnectOpen(true);
        }
      }
    }
  }, [currentUser.inviteCode]);

  // 3. Subscribe to My Tracker (Owner: Read & Write)
  useEffect(() => {
    const unsub = subscribeToMyTracker(
      currentUser.uid,
      currentUser,
      (data) => {
        setMyTracker(data);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    return () => unsub();
  }, [currentUser.uid, currentUser.name, currentUser.email, currentUser.partnerUid]);

  // 4. Subscribe to Partner Tracker (Strict Read-Only)
  useEffect(() => {
    const unsub = subscribeToPartnerTracker(
      currentUser.partnerUid,
      (data) => {
        setPartnerTracker(data);
      },
      (notificationText) => {
        // Real-time notification when partner completes a habit
        showToast(
          `${currentUser.partnerName || 'পার্টনার'} লক্ষ্য পূরণ করেছেন! 🎉`,
          notificationText,
          'celebrate'
        );
      }
    );

    return () => unsub();
  }, [currentUser.partnerUid, currentUser.partnerName]);

  // 5. Reactive Partner Synchronization Listener (Peer Sync across devices)
  useEffect(() => {
    if (!currentUser.uid || currentUser.uid.startsWith('demo_')) return;

    const db = getFirestoreDb();

    // A: Listen to currentUser's own document in Firestore for any partner field updates
    const myDocRef = doc(db, 'users', currentUser.uid);
    const unsubMyDoc = onSnapshot(
      myDocRef,
      (snap) => {
        if (snap.exists()) {
          const remote = snap.data() as UserProfile;
          if (
            remote.partnerUid &&
            remote.partnerUid !== currentUser.partnerUid &&
            !currentUser.disconnectedPartnerUids?.includes(remote.partnerUid)
          ) {
            setCurrentUser((prev) => {
              const updated: UserProfile = {
                ...prev,
                partnerUid: remote.partnerUid,
                partnerName: remote.partnerName || prev.partnerName,
                partnerEmail: remote.partnerEmail || prev.partnerEmail,
                partnerPhoto: remote.partnerPhoto || prev.partnerPhoto,
              };
              saveUserProfileLocal(updated);
              return updated;
            });
          }
        }
      },
      (err) => {
        console.warn('My profile snapshot listener notice:', err);
      }
    );

    // B: Listen for incoming partner connection where another user has chosen currentUser as partner
    const qIncoming = query(collection(db, 'users'), where('partnerUid', '==', currentUser.uid));
    const unsubIncoming = onSnapshot(
      qIncoming,
      async (snap) => {
        if (!snap.empty) {
          const partnerDoc = snap.docs[0];
          const incomingPartner = partnerDoc.data() as UserProfile;
          if (
            currentUser.partnerUid !== incomingPartner.uid &&
            !currentUser.disconnectedPartnerUids?.includes(incomingPartner.uid)
          ) {
            // Auto-link back safely on current user's document
            const linked = await syncMyProfileWithPartner(currentUser, incomingPartner);
            setCurrentUser(linked);
          }
        }
      },
      (err) => {
        console.warn('Incoming partner link listener notice:', err);
      }
    );

    return () => {
      unsubMyDoc();
      unsubIncoming();
    };
  }, [currentUser.uid, currentUser.partnerUid, currentUser.disconnectedPartnerUids]);

  // 6. Subscribe to Partner Nudges (Live Motivation & Reminders)
  useEffect(() => {
    if (!currentUser.partnerUid) return;

    const unsub = subscribeToPartnerNudges(currentUser.uid, (nudge) => {
      const title = `${nudge.senderName} তাগিদ পাঠিয়েছেন! ${nudge.emoji || '🔔'}`;
      sound.playNotification();
      showToast(title, nudge.message, 'info');
      sendBrowserNotification(title, nudge.message);
    });

    return () => unsub();
  }, [currentUser.uid, currentUser.partnerUid]);

  // 7. Subscribe to Duo Live Chat
  useEffect(() => {
    if (!currentUser.partnerUid) {
      setChatMessages([]);
      return;
    }

    const unsub = subscribeToDuoChat(currentUser.uid, currentUser.partnerUid, (msgs) => {
      setChatMessages(msgs);
      if (!isChatOpen && msgs.length > 0) {
        const last = msgs[msgs.length - 1];
        if (last.senderUid !== currentUser.uid) {
          setUnreadMessagesCount((prev) => prev + 1);
          sound.playNotification();
          const title = `${currentUser.partnerName || 'পার্টনার'} থেকে নতুন বার্তা 💬`;
          showToast(title, last.text, 'info');
          sendBrowserNotification(title, last.text);
        }
      }
    });

    return () => unsub();
  }, [currentUser.uid, currentUser.partnerUid, currentUser.partnerName, isChatOpen]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'],
      });
    } catch {}
  };

  // Toggle Habit completion (My Space only)
  const handleToggleHabit = useCallback(
    async (habitId: string) => {
      const habit = myTracker.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newCompleted = !habit.completed;
      const newCurrent = newCompleted ? (habit.target > 0 ? habit.target : 1) : 0;

      if (newCompleted) {
        sound.playCompletion();
        triggerConfetti();
        setCelebrationHabitName(habit.name);
        setIsCelebrationOpen(true);
        showToast('অভিনন্দন! লক্ষ্য পূরণ হয়েছে 🎉', habit.name, 'celebrate');
      } else {
        sound.playTick();
      }

      const updatedHabits = myTracker.habits.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            completed: newCompleted,
            current: newCurrent,
            updatedAt: Date.now(),
          };
        }
        return h;
      });

      const updatedTracker: UserTrackerData = {
        ...myTracker,
        habits: updatedHabits,
        lastAction: {
          actionText: newCompleted
            ? `"${habit.name}" লক্ষ্য সম্পন্ন করেছেন`
            : `"${habit.name}" আনচেক করেছেন`,
          habitName: habit.name,
          timestamp: Date.now(),
        },
      };

      setMyTracker(updatedTracker);
      await updateMyTracker(currentUser.uid, updatedTracker);
    },
    [myTracker, currentUser.uid]
  );

  // Increment/Decrement Habit progress (My Space only)
  const handleIncrementHabit = useCallback(
    async (habitId: string, delta: number) => {
      const habit = myTracker.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const newCurrent = Math.max(0, (habit.current || 0) + delta);
      const isNowDone = habit.target > 0 && newCurrent >= habit.target;
      const wasDone = habit.target > 0 && habit.current >= habit.target;

      sound.playTick();

      if (isNowDone && !wasDone) {
        sound.playCompletion();
        triggerConfetti();
        setCelebrationHabitName(habit.name);
        setIsCelebrationOpen(true);
        showToast('অভিনন্দন! লক্ষ্য পূরণ হয়েছে 🎉', habit.name, 'celebrate');
      }

      const updatedHabits = myTracker.habits.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            current: newCurrent,
            completed: isNowDone,
            updatedAt: Date.now(),
          };
        }
        return h;
      });

      const updatedTracker: UserTrackerData = {
        ...myTracker,
        habits: updatedHabits,
        lastAction: {
          actionText: `"${habit.name}" অগ্রগতি আপডেট করেছেন (${newCurrent} ${habit.unit})`,
          habitName: habit.name,
          timestamp: Date.now(),
        },
      };

      setMyTracker(updatedTracker);
      await updateMyTracker(currentUser.uid, updatedTracker);
    },
    [myTracker, currentUser.uid]
  );

  // Save manual log value (My Space only)
  const handleSaveLogValue = useCallback(
    async (habitId: string, value: number) => {
      const habit = myTracker.habits.find((h) => h.id === habitId);
      if (!habit) return;

      const isNowDone = habit.target > 0 && value >= habit.target;
      const wasDone = habit.target > 0 && habit.current >= habit.target;

      if (isNowDone && !wasDone) {
        sound.playCompletion();
        triggerConfetti();
        setCelebrationHabitName(habit.name);
        setIsCelebrationOpen(true);
        showToast('টার্গেট পূরণ হয়েছে! 🌟', habit.name, 'celebrate');
      }

      const updatedHabits = myTracker.habits.map((h) => {
        if (h.id === habitId) {
          return {
            ...h,
            current: value,
            completed: isNowDone,
            updatedAt: Date.now(),
          };
        }
        return h;
      });

      const updatedTracker: UserTrackerData = {
        ...myTracker,
        habits: updatedHabits,
        lastAction: {
          actionText: `"${habit.name}" ${value} ${habit.unit} লগ করেছেন`,
          habitName: habit.name,
          timestamp: Date.now(),
        },
      };

      setMyTracker(updatedTracker);
      await updateMyTracker(currentUser.uid, updatedTracker);
    },
    [myTracker, currentUser.uid]
  );

  // Add new Goal (My Space only)
  const handleAddGoal = useCallback(
    async (newGoalData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'current' | 'completed'>) => {
      const newHabit: Habit = {
        ...newGoalData,
        id: 'h_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        current: 0,
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const updatedHabits = [...myTracker.habits, newHabit];
      const updatedTracker: UserTrackerData = {
        ...myTracker,
        habits: updatedHabits,
        lastAction: {
          actionText: `নতুন লক্ষ্য যোগ করেছেন: "${newHabit.name}"`,
          habitName: newHabit.name,
          timestamp: Date.now(),
        },
      };

      setMyTracker(updatedTracker);
      await updateMyTracker(currentUser.uid, updatedTracker);
      sound.playCompletion();
      showToast('নতুন লক্ষ্য যোগ করা হয়েছে! 🎯', newHabit.name, 'success');
    },
    [myTracker, currentUser.uid]
  );

  // Delete Goal (My Space only)
  const handleDeleteGoal = useCallback(
    async (habitId: string) => {
      const habit = myTracker.habits.find((h) => h.id === habitId);
      if (!habit) return;

      if (window.confirm(`আপনি কি "${habit.name}" লক্ষ্যটি মুছে ফেলতে চান?`)) {
        const updatedHabits = myTracker.habits.filter((h) => h.id !== habitId);
        const updatedTracker: UserTrackerData = {
          ...myTracker,
          habits: updatedHabits,
        };

        setMyTracker(updatedTracker);
        await updateMyTracker(currentUser.uid, updatedTracker);
        sound.playTick();
        showToast('লক্ষ্য মুছে ফেলা হয়েছে', habit.name, 'info');
      }
    },
    [myTracker, currentUser.uid]
  );

  // Reset Progress to Zero (User requested: ডিফল্ট প্রগ্রেস শূন্য করে দেওয়া)
  const handleResetProgress = useCallback(async () => {
    await resetTrackerProgressToZero(currentUser.uid);
    const cleanTracker = createInitialTracker(currentUser.uid, currentUser.name, currentUser.email);
    setMyTracker(cleanTracker);
    sound.playTick();
    showToast('প্রগ্রেস রিসেট করা হয়েছে', 'সকল অভ্যাসের অগ্রগতি শূন্য (০) থেকে শুরু হবে।', 'info');
  }, [currentUser.uid, currentUser.name, currentUser.email]);

  // Send Nudge / Reminder to Partner
  const handleSendNudge = useCallback(
    async (message: string, habitName?: string, emoji?: string) => {
      if (!currentUser.partnerUid) {
        showToast('কোনো পার্টনার যুক্ত নেই', 'তাগিদ পাঠাতে প্রথমে পার্টনার কানেক্ট করুন।', 'error');
        return false;
      }
      return await sendNudgeToPartner(currentUser, currentUser.partnerUid, message, habitName, emoji);
    },
    [currentUser]
  );

  // Send Live Duo Chat Message to Partner
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!currentUser.partnerUid) {
        showToast('কোনো পার্টনার যুক্ত নেই', 'মেসেজ পাঠাতে প্রথমে পার্টনার কানেক্ট করুন।', 'error');
        return false;
      }
      return await sendDuoMessage(currentUser, currentUser.partnerUid, text);
    },
    [currentUser]
  );

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Toast Notifications container */}
      <ToastBanner />

      {/* App Header */}
      <Header
        currentUser={currentUser}
        connectionStatus={connectionStatus}
        streak={myTracker?.currentStreak ?? 0}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 pb-24">
        {/* Top Space Switcher Bar (My Space vs Partner Space) */}
        <PartnerBar
          currentUser={currentUser}
          partnerUser={partnerUser}
          myTracker={myTracker}
          partnerTracker={partnerTracker}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenConnectModal={() => setIsConnectOpen(true)}
          connectionStatus={connectionStatus}
          onOpenChat={() => {
            setIsChatOpen(true);
            setUnreadMessagesCount(0);
          }}
          onOpenNudge={() => {
            setSelectedNudgeHabit(null);
            setIsNudgeOpen(true);
          }}
          unreadMessagesCount={unreadMessagesCount}
        />

        {/* View 1: My Space (Full Edit Access) */}
        {activeTab === 'my_space' && (
          <DashboardView
            tracker={myTracker}
            isReadOnly={false}
            partnerName={currentUser.partnerName || 'পার্টনার'}
            isConnected={!!currentUser.partnerUid}
            onToggleHabit={handleToggleHabit}
            onIncrementHabit={handleIncrementHabit}
            onOpenAddGoal={() => setIsAddGoalOpen(true)}
            onOpenLogModal={(h) => {
              setSelectedHabitForLog(h);
              setIsLogModalOpen(true);
            }}
            onDeleteHabit={handleDeleteGoal}
            onNudgeHabit={(h) => {
              setSelectedNudgeHabit(h || null);
              setIsNudgeOpen(true);
            }}
          />
        )}

        {/* View 2: Partner's Space (Strict Read-Only Access) */}
        {activeTab === 'partner_space' && (
          <DashboardView
            tracker={partnerTracker}
            isReadOnly={true}
            partnerName={currentUser.partnerName || 'পার্টনার'}
            isConnected={!!currentUser.partnerUid}
            onOpenConnectModal={() => setIsConnectOpen(true)}
            onNudgeHabit={(h) => {
              setSelectedNudgeHabit(h || null);
              setIsNudgeOpen(true);
            }}
          />
        )}

        {/* View 3: Insights & Analytics */}
        {activeTab === 'insights' && (
          <InsightsView
            myTracker={myTracker}
            partnerTracker={partnerTracker}
          />
        )}
      </main>

      {/* Bottom Floating Navigation (Mobile & Desktop) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0c111e]/90 backdrop-blur-lg border-t border-white/10 py-2 sm:py-2.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <button
            onClick={() => setActiveTab('my_space')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'my_space'
                ? 'text-rose-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="text-[11px]">আমার স্পেস</span>
          </button>

          <button
            onClick={() => setActiveTab('partner_space')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'partner_space'
                ? 'text-indigo-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">পার্টনার ভিউ</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px]">ইনসাইটস</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
        }}
      />

      <ConnectPartnerModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        currentUser={currentUser}
        initialInviteCode={pendingInviteCode || undefined}
        onPartnerConnected={(partner) => {
          setCurrentUser((prev) => ({
            ...prev,
            partnerUid: partner.uid,
            partnerName: partner.name,
            partnerEmail: partner.email,
          }));
          setIsConnectOpen(false);
        }}
        onPartnerDisconnected={() => {
          setCurrentUser((prev) => ({
            ...prev,
            partnerUid: null,
            partnerName: null,
            partnerEmail: null,
          }));
          setPartnerTracker(null);
        }}
        onProgressReset={handleResetProgress}
      />

      <AddGoalModal
        isOpen={isAddGoalOpen}
        onClose={() => setIsAddGoalOpen(false)}
        onAddHabit={handleAddGoal}
      />

      <LogInputModal
        isOpen={isLogModalOpen}
        habit={selectedHabitForLog}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedHabitForLog(null);
        }}
        onSaveValue={handleSaveLogValue}
      />

      <CelebrationModal
        isOpen={isCelebrationOpen}
        habitName={celebrationHabitName}
        onClose={() => setIsCelebrationOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          setCurrentUser(getDemoUserProfile());
          setPartnerTracker(null);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
        onResetProgress={handleResetProgress}
      />

      <NudgeModal
        isOpen={isNudgeOpen}
        onClose={() => {
          setIsNudgeOpen(false);
          setSelectedNudgeHabit(null);
        }}
        partnerName={currentUser.partnerName || 'পার্টনার'}
        habitName={selectedNudgeHabit?.name}
        onSendNudge={handleSendNudge}
      />

      <DuoChatModal
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setUnreadMessagesCount(0);
        }}
        currentUser={currentUser}
        partnerName={currentUser.partnerName || 'পার্টনার'}
        partnerPhoto={currentUser.partnerPhoto}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
