import React from 'react';
import { Sparkles, Settings, LogIn, Users, Link2, LogOut, Flame, ShieldCheck } from 'lucide-react';
import type { UserProfile, ConnectionStatus } from '../types';
import { formatBengaliDate, toBengaliNumber } from '../utils/bengali';

interface HeaderProps {
  currentUser: UserProfile;
  connectionStatus: ConnectionStatus;
  streak: number;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenConnect: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  connectionStatus,
  streak,
  onOpenSettings,
  onOpenAuth,
  onOpenConnect,
}) => {
  const isDemo = currentUser.uid.startsWith('demo_');
  const isConnected = !!currentUser.partnerUid;

  return (
    <header className="border-b border-white/10 bg-[#0d1220]/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Left: Brand & Date */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-500 p-0.5 shadow-lg shadow-rose-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#0d1220] rounded-[14px] flex items-center justify-center text-lg">
              🎯
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-wide">
                একসাথে <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">Duo Pod</span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {formatBengaliDate()}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Sync Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : connectionStatus === 'connecting'
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-indigo-400'
              }`}
            />
            <span>
              {connectionStatus === 'connected'
                ? 'ক্লাউড সিঙ্ক চালু'
                : connectionStatus === 'connecting'
                ? 'কানেক্ট হচ্ছে...'
                : 'লোকাল ডেমো মোড'}
            </span>
          </div>

          {/* User Profile / Login button */}
          {isDemo ? (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>গুগল লগইন</span>
            </button>
          ) : (
            <div
              onClick={onOpenSettings}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-white transition-colors cursor-pointer"
              title={currentUser.email}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {(currentUser.name || 'ইউ').charAt(0)}
                </div>
              )}
              <span className="hidden sm:inline-block text-xs font-semibold max-w-[100px] truncate">
                {currentUser.name || 'ইউজার'}
              </span>
            </div>
          )}

          {/* Connect Partner button */}
          <button
            onClick={onOpenConnect}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isConnected
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 animate-pulse'
            }`}
            title="পার্টনার কানেকশন"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="সেটিংস"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
