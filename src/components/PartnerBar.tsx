import React from 'react';
import { ArrowLeftRight, UserPlus, UserCheck } from 'lucide-react';
import type { PodUser, AuthUserProfile } from '../types';

interface PartnerBarProps {
  myProfile: AuthUserProfile;
  partner: PodUser | null;
  onOpenSettings: () => void;
  onSwitchPerspective: () => void;
}

export const PartnerBar: React.FC<PartnerBarProps> = ({
  myProfile,
  partner,
  onOpenSettings,
  onSwitchPerspective,
}) => {
  const isPartnerConnected = !!partner;

  return (
    <section className="mx-4 mt-3 px-3.5 py-2.5 rounded-2xl bg-[#131a2e]/90 border border-white/8 flex items-center justify-between shadow-sm">
      {/* Me tag */}
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]"></span>
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-[130px]">
            {myProfile.name || 'আমি'}
          </span>
          {myProfile.email && (
            <span className="text-[10px] text-slate-400 truncate max-w-[90px] sm:max-w-[110px]">
              {myProfile.email}
            </span>
          )}
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
          {myProfile.role === 'userA' ? 'A' : 'B'}
        </span>
      </div>

      {/* Sync indicator in center */}
      <button
        type="button"
        className="flex items-center gap-1.5 text-slate-400 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/5"
        onClick={onSwitchPerspective}
        title="ক্লিক করে পার্টনার বা নিজের পারস্পেক্টিভ অদলবদল করুন (টেস্ট করার জন্য)"
      >
        <ArrowLeftRight className="w-3 h-3 text-rose-400" />
        <span className="text-[10px] sm:text-[11px] font-medium text-slate-300">
          সিঙ্ক ভিউ
        </span>
      </button>

      {/* Partner tag */}
      <div className="flex items-center gap-2">
        {isPartnerConnected ? (
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onOpenSettings}
            title="পার্টনার ম্যানেজ করতে ক্লিক করুন"
          >
            <div className="flex flex-col text-right">
              <span className="text-xs sm:text-sm font-semibold text-cyan-200 truncate max-w-[100px] sm:max-w-[130px]">
                {partner.name}
              </span>
              {partner.email && (
                <span className="text-[10px] text-cyan-400/70 truncate max-w-[90px] sm:max-w-[110px]">
                  {partner.email}
                </span>
              )}
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></span>
            <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>পার্টনার যুক্ত করুন</span>
          </button>
        )}
      </div>
    </section>
  );
};
