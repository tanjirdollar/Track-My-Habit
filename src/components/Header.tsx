import React from 'react';
import { Settings, Bell, User, LogIn } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '../utils/bengali';
import type { ConnectionStatus, AuthUserProfile } from '../types';
import { requestNotificationPermission, showToast } from '../services/notifications';

interface HeaderProps {
  currentStreak: number;
  connectionStatus: ConnectionStatus;
  currentUser: AuthUserProfile | null;
  onOpenSettings: () => void;
  onOpenCelebration: () => void;
  onOpenAuth: () => void;
  notificationPermission: NotificationPermission;
}

export const Header: React.FC<HeaderProps> = ({
  currentStreak,
  connectionStatus,
  currentUser,
  onOpenSettings,
  onOpenCelebration,
  onOpenAuth,
  notificationPermission,
}) => {
  const isOnline = connectionStatus === 'connected';

  const handleNotificationClick = async () => {
    if (notificationPermission !== 'granted') {
      const result = await requestNotificationPermission();
      if (result === 'granted') {
        showToast('পুশ নোটিফিকেশন সক্রিয়! 🔔', 'পার্টনারের রিয়েল-টাইম আপডেট এখানে দেখতে পাবেন।', 'success');
      }
    } else {
      showToast('নোটিফিকেশন সক্রিয় আছে', 'পার্টনার যেকোনো লক্ষ্য সম্পন্ন করলে আপনাকে সতর্ক করা হবে।', 'info');
    }
  };

  const isDemo = !currentUser || currentUser.uid.startsWith('demo_');

  return (
    <header className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-[#101524]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span
            className={`live-dot ${!isOnline ? 'offline' : ''}`}
            title={
              connectionStatus === 'connected'
                ? 'ফায়ারবেস ক্লাউড লাইভ সিঙ্ক সক্রিয়'
                : connectionStatus === 'connecting'
                ? 'ফায়ারবেসের সাথে সংযুক্ত হচ্ছে...'
                : 'লোকাল সিঙ্ক মোডে আছে'
            }
          />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            একসাথে
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
              Duo Pod
            </span>
          </h1>
        </div>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
          {formatBengaliDate(new Date())}
        </p>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* User Account / Login Button */}
        <button
          onClick={onOpenAuth}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            isDemo
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-300 hover:bg-rose-500/20'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/20'
          }`}
          title={isDemo ? 'অ্যাকাউন্টে লগইন বা সাইন আপ করুন' : `লগইন আছেন: ${currentUser?.email}`}
        >
          {isDemo ? <LogIn className="w-3.5 h-3.5 text-rose-400" /> : <User className="w-3.5 h-3.5 text-emerald-400" />}
          <span className="max-w-[70px] sm:max-w-[100px] truncate">
            {isDemo ? 'লগইন' : currentUser?.name || 'অ্যাকাউন্ট'}
          </span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={handleNotificationClick}
          className={`p-2 rounded-xl border transition-all ${
            notificationPermission === 'granted'
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={
            notificationPermission === 'granted'
              ? 'নোটিফিকেশন চালু আছে'
              : 'পুশ নোটিফিকেশন চালু করতে ক্লিক করুন'
          }
          aria-label="পুশ নোটিফিকেশন"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Streak Badge Button */}
        <button
          onClick={onOpenCelebration}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400/50 transition-all cursor-pointer group shadow-sm"
          title="ধারার বিবরণ দেখতে ক্লিক করুন"
          id="streak-badge-btn"
        >
          <span className="flame-anim text-sm sm:text-base group-hover:scale-110 transition-transform">🔥</span>
          <span className="text-xs sm:text-sm font-semibold tracking-wide font-num">
            {toBengaliNumber(currentStreak)} দিন
          </span>
        </button>

        {/* Settings Icon Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="সেটিংস ও পড কনফিগারেশন"
          id="open-settings-btn"
          aria-label="সেটিংস"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </header>
  );
};
