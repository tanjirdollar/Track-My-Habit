import React from 'react';
import { Settings, Bell, Flame } from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '../utils/bengali';
import type { ConnectionStatus } from '../types';
import { requestNotificationPermission, showToast } from '../services/notifications';

interface HeaderProps {
  currentStreak: number;
  connectionStatus: ConnectionStatus;
  onOpenSettings: () => void;
  onOpenCelebration: () => void;
  notificationPermission: NotificationPermission;
}

export const Header: React.FC<HeaderProps> = ({
  currentStreak,
  connectionStatus,
  onOpenSettings,
  onOpenCelebration,
  notificationPermission,
}) => {
  const isOnline = connectionStatus === 'connected' || connectionStatus === 'demo';

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

  return (
    <header className="px-4 py-3.5 flex items-center justify-between border-b border-white/5 bg-[#101524]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex flex-col">
        <div className="flex items-center gap-2.5">
          <span
            className={`live-dot ${!isOnline ? 'offline' : ''}`}
            title={
              connectionStatus === 'connected'
                ? 'ফায়ারবেস রিয়েল-টাইম ক্লাউড সংযোগ সক্রিয়'
                : 'লোকাল ও ব্রডকাস্ট রিয়েল-টাইম সংযোগ সক্রিয়'
            }
          />
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            একসাথে
            <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
              Duo Pod
            </span>
          </h1>
        </div>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          {formatBengaliDate(new Date())}
        </p>
      </div>

      <div className="flex items-center gap-2">
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/20 border border-amber-500/30 text-amber-300 hover:border-amber-400/50 transition-all cursor-pointer group shadow-sm"
          title="ধারার বিবরণ দেখতে ক্লিক করুন"
          id="streak-badge-btn"
        >
          <span className="flame-anim text-base group-hover:scale-110 transition-transform">🔥</span>
          <span className="text-sm font-semibold tracking-wide font-num">
            {toBengaliNumber(currentStreak)} দিন
          </span>
        </button>

        {/* Settings Icon Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          title="সেটিংস ও পড কনফিগারেশন"
          id="open-settings-btn"
          aria-label="সেটিংস"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
