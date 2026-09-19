import React from 'react';
import { Plus, Flame, CheckCircle2, ShieldCheck, Lock, Users, Sparkles, Link2, Bell } from 'lucide-react';
import type { UserTrackerData, Habit } from '../types';
import { HabitCard } from './HabitCard';
import { toBengaliNumber } from '../utils/bengali';

interface DashboardViewProps {
  tracker: UserTrackerData | null;
  isReadOnly?: boolean;
  partnerName?: string;
  isConnected?: boolean;
  onToggleHabit?: (id: string) => void;
  onIncrementHabit?: (id: string, delta: number) => void;
  onOpenAddGoal?: () => void;
  onOpenLogModal?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  onOpenConnectModal?: () => void;
  onNudgeHabit?: (habit?: Habit | null) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tracker,
  isReadOnly = false,
  partnerName = 'পার্টনার',
  isConnected = false,
  onToggleHabit,
  onIncrementHabit,
  onOpenAddGoal,
  onOpenLogModal,
  onDeleteHabit,
  onOpenConnectModal,
  onNudgeHabit,
}) => {
  // If viewing partner space but partner is not connected yet
  if (isReadOnly && (!isConnected || !tracker)) {
    return (
      <div className="rounded-3xl bg-[#111728] border border-white/10 p-6 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
          <Users className="w-8 h-8" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-bold text-white tracking-wide">
            পার্টনারের সাথে এখনো যুক্ত হননি
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            পার্টনারের সারাদিনের অভ্যাস ও অগ্রগতি লাইভ দেখতে তাকে যুক্ত করুন। কানেক্ট হওয়ার পর তিনি তার ফোন থেকে ডেটা দিলে আপনি এখানে সরাসরি রিয়েল-টাইমে দেখতে পাবেন (রিড-ওনলি)।
          </p>
        </div>

        <button
          onClick={onOpenConnectModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
        >
          <Link2 className="w-4 h-4" />
          <span>পার্টনার কানেক্ট করুন</span>
        </button>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="text-center py-12 text-slate-400">
        তথ্য লোড হচ্ছে...
      </div>
    );
  }

  const todayCompletionRate = typeof tracker.todayCompletionRate === 'number' && !isNaN(tracker.todayCompletionRate) ? tracker.todayCompletionRate : 0;
  const todayCompletedCount = typeof tracker.todayCompletedCount === 'number' && !isNaN(tracker.todayCompletedCount) ? tracker.todayCompletedCount : 0;
  const todayTotalCount = typeof tracker.todayTotalCount === 'number' && !isNaN(tracker.todayTotalCount) ? tracker.todayTotalCount : 0;
  const currentStreak = typeof tracker.currentStreak === 'number' && !isNaN(tracker.currentStreak) ? tracker.currentStreak : 0;
  const habits = Array.isArray(tracker.habits) ? tracker.habits : [];
  const userName = tracker.userName || 'আমি';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Space Notice Header if Read-Only */}
      {isReadOnly ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-500/30 flex items-center justify-center text-indigo-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">
                {partnerName}-এর ব্যক্তিগত স্পেস (Read-Only)
              </span>
              <p className="text-[11px] text-indigo-300/80">
                পার্টনারের লাইভ অগ্রগতি দৃশ্যমান। আপনি কোনো কিছু এডিট বা টিক করতে পারবেন না।
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {onNudgeHabit && (
              <button
                type="button"
                onClick={() => onNudgeHabit(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs shadow-md shadow-amber-500/10 active:scale-95 transition-all cursor-pointer"
                title={`${partnerName}-কে তাগিদ পাঠান`}
              >
                <Bell className="w-3.5 h-3.5 animate-bounce" />
                <span>তাগিদ পাঠান 🔔</span>
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              লাইভ
            </span>
          </div>
        </div>
      ) : null}

      {/* Progress & Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Today's Overall Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111728] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>আজকের সামগ্রিক অগ্রগতি</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {toBengaliNumber(todayCompletionRate)}%
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              ({toBengaliNumber(todayCompletedCount)} / {toBengaliNumber(todayTotalCount)})
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isReadOnly
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                  : 'bg-gradient-to-r from-rose-500 to-amber-500'
              }`}
              style={{ width: `${todayCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111728] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>স্ট্রিক (Streak)</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-amber-400">
              {toBengaliNumber(currentStreak)}
            </span>
            <span className="text-xs text-slate-400 font-semibold">দিন টানা</span>
          </div>
          <p className="text-[11px] text-slate-500">প্রতিদিনের লক্ষ্য পূরণ করে বজায় রাখুন</p>
        </div>

        {/* User Identity / Owner Tag */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111728] border border-white/10 shadow-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>ট্র্যাকার মালিক</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-base font-bold text-white truncate">
            {isReadOnly ? partnerName : `${userName || 'আমি'} (My Space)`}
          </div>
          <p className="text-[11px] text-slate-400">
            {isReadOnly ? 'পার্টনার ইনপুট নিয়ন্ত্রণ করেন' : 'আপনার স্বাধীন ট্র্যাকিং স্পেস'}
          </p>
        </div>
      </div>

      {/* Habits List Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
            {isReadOnly ? `${partnerName}-এর আজকের লক্ষ্যসমূহ` : 'আমার আজকের লক্ষ্যসমূহ'}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-medium">
            {toBengaliNumber(habits.length)}টি
          </span>
        </div>

        {!isReadOnly && onOpenAddGoal && (
          <button
            onClick={onOpenAddGoal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>নতুন লক্ষ্য যোগ</span>
          </button>
        )}
      </div>

      {/* Habits Grid */}
      {habits.length === 0 ? (
        <div className="text-center py-10 rounded-2xl bg-[#111728] border border-white/5 text-slate-400 text-sm">
          {isReadOnly
            ? 'পার্টনার এখনো কোনো অভ্যাস বা লক্ষ্য যোগ করেননি।'
            : 'আপনার এখনো কোনো লক্ষ্য নেই। উপরের "নতুন লক্ষ্য যোগ" বাটনে ক্লিক করুন।'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isReadOnly={isReadOnly}
              partnerName={partnerName}
              onToggle={onToggleHabit}
              onIncrement={onIncrementHabit}
              onOpenLogModal={onOpenLogModal}
              onDelete={onDeleteHabit}
              onNudge={onNudgeHabit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
