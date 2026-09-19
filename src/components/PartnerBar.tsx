import React from 'react';
import { Users, Sparkles, Heart, ShieldCheck, UserCheck, Link2, MessageSquare, Bell } from 'lucide-react';
import type { UserProfile, UserTrackerData, ConnectionStatus } from '../types';
import { toBengaliNumber } from '../utils/bengali';

interface PartnerBarProps {
  currentUser: UserProfile;
  partnerUser: UserProfile | null;
  myTracker: UserTrackerData;
  partnerTracker: UserTrackerData | null;
  activeTab: 'my_space' | 'partner_space' | 'insights';
  onTabChange: (tab: 'my_space' | 'partner_space' | 'insights') => void;
  onOpenConnectModal: () => void;
  connectionStatus: ConnectionStatus;
  onOpenChat?: () => void;
  onOpenNudge?: () => void;
  unreadMessagesCount?: number;
}

export const PartnerBar: React.FC<PartnerBarProps> = ({
  currentUser,
  partnerUser,
  myTracker,
  partnerTracker,
  activeTab,
  onTabChange,
  onOpenConnectModal,
  connectionStatus,
  onOpenChat,
  onOpenNudge,
  unreadMessagesCount = 0,
}) => {
  const isConnected = !!currentUser.partnerUid && !!partnerTracker;

  return (
    <div className="bg-[#101626] border border-white/10 rounded-2xl p-3 sm:p-4 shadow-xl mb-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Two Tabs (আমার স্পেস & পার্টনারের স্পেস) */}
        <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5">
          <button
            onClick={() => onTabChange('my_space')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_space'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>আমার স্পেস</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-medium">
              {toBengaliNumber(myTracker?.todayCompletionRate ?? 0)}%
            </span>
          </button>

          <button
            onClick={() => onTabChange('partner_space')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'partner_space'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>পার্টনার ভিউ</span>
            {isConnected ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-medium text-emerald-300">
                {toBengaliNumber(partnerTracker?.todayCompletionRate || 0)}%
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-medium">
                কানেক্ট করুন
              </span>
            )}
          </button>
        </div>

        {/* Right: Actions & Partner Sync Status Indicator */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          {isConnected ? (
            <>
              {/* Nudge Action Button */}
              {onOpenNudge && (
                <button
                  type="button"
                  onClick={onOpenNudge}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  title="পার্টনারকে তাগিদ বা অনুপ্রেরণা দিন"
                >
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  <span className="hidden xs:inline">তাগিদ দিন</span>
                </button>
              )}

              {/* Live Chat Action Button */}
              {onOpenChat && (
                <button
                  type="button"
                  onClick={onOpenChat}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  title="পার্টনারের সাথে লাইভ চ্যাট"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>লাইভ চ্যাট</span>
                  {unreadMessagesCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-1 -right-1" />
                  )}
                </button>
              )}

              <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-xl border border-white/5">
                <div className="flex items-center -space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-[10px] font-bold border border-[#101626]">
                    {(currentUser.name || 'ইউ').charAt(0)}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold border border-[#101626]">
                    {(currentUser.partnerName || 'পা').charAt(0)}
                  </div>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-white truncate max-w-[90px]">
                      {currentUser.partnerName || 'পার্টনার'}
                    </span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenConnectModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>পার্টনারকে যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
