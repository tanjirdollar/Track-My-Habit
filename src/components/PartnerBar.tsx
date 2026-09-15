import React from 'react';
import { ArrowLeftRight, UserPlus, UserCheck, Smartphone } from 'lucide-react';
import type { PodUser } from '../types';

interface PartnerBarProps {
  myProfile: { id: string; name: string; role: 'userA' | 'userB'; podId: string };
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
        <span className="text-sm font-semibold text-slate-200 truncate max-w-[120px]">
          {myProfile.name || 'আমি'}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
          {myProfile.role === 'userA' ? 'A' : 'B'}
        </span>
      </div>

      {/* Sync indicator in center */}
      <div
        className="flex items-center gap-1 text-slate-400 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        onClick={onSwitchPerspective}
        title="ক্লিক করে পার্টনার বা নিজের পারস্পেক্টিভ অদলবদল করুন (একই স্ক্রিনে টেস্ট করার জন্য)"
      >
        <ArrowLeftRight className="w-3.5 h-3.5 text-rose-400" />
        <span className="text-[11px] font-medium text-slate-300 hidden sm:inline">
          রিয়েল-টাইম সিঙ্ক
        </span>
      </div>

      {/* Partner tag */}
      <div className="flex items-center gap-2">
        {isPartnerConnected ? (
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onOpenSettings}
            title="পার্টনার ম্যানেজ করতে ক্লিক করুন"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]"></span>
            <span className="text-sm font-semibold text-cyan-200 truncate max-w-[120px]">
              {partner.name}
            </span>
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        ) : (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>পার্টনার যুক্ত করুন</span>
          </button>
        )}
      </div>
    </section>
  );
};
