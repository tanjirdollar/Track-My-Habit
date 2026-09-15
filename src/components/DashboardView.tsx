import React from 'react';
import { Plus } from 'lucide-react';
import type { Habit, PodData } from '../types';
import { HabitCard } from './HabitCard';
import { toBengaliNumber } from '../utils/bengali';

interface DashboardViewProps {
  pod: PodData;
  isUserA: boolean;
  onUpdateProgress: (habitId: string, delta: number, absolute?: number) => void;
  onToggleBoolean: (habitId: string) => void;
  onOpenAddModal: () => void;
  onOpenLogModal: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  pod,
  isUserA,
  onUpdateProgress,
  onToggleBoolean,
  onOpenAddModal,
  onOpenLogModal,
  onDeleteHabit,
}) => {
  const habits = pod.habits || [];

  // Calculate overall metrics
  let totalGoals = habits.length * 2; // My goals + partner goals
  let completedCount = 0;
  let myDoneCount = 0;
  let partnerDoneCount = 0;

  habits.forEach((h) => {
    const myVal = isUserA ? h.myProgress : h.partnerProgress;
    const partnerVal = isUserA ? h.partnerProgress : h.myProgress;

    const myDone = h.type === 'boolean'
      ? (isUserA ? !!h.completedByMe : !!h.completedByPartner)
      : myVal >= h.target;

    const partnerDone = h.type === 'boolean'
      ? (isUserA ? !!h.completedByPartner : !!h.completedByMe)
      : partnerVal >= h.target;

    if (myDone) {
      completedCount++;
      myDoneCount++;
    }
    if (partnerDone) {
      completedCount++;
      partnerDoneCount++;
    }
  });

  const overallPercent = totalGoals > 0 ? Math.round((completedCount / totalGoals) * 100) : 0;

  // SVG Circular arc calculations (radius 50 -> circumference 2 * pi * 50 = 314.159)
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (circumference * overallPercent) / 100;

  return (
    <div className="space-y-4 pb-24">
      {/* Top Overall Progress Ring Card */}
      <div className="ios-card p-5 relative overflow-hidden bg-gradient-to-br from-[#151c30] to-[#0f1424]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-bold text-white tracking-wide">
              আজকের সার্বিক লক্ষ্য
            </h2>
            <p className="text-sm text-slate-300">
              আজকের যৌথ লক্ষ্য পূরণ:{' '}
              <strong className="text-rose-400 font-num font-bold text-base">
                {toBengaliNumber(overallPercent)}%
              </strong>
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-300 font-num">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                আমার লক্ষ্য: {toBengaliNumber(myDoneCount)}/{toBengaliNumber(habits.length)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300 font-num">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                পার্টনারের লক্ষ্য: {toBengaliNumber(partnerDoneCount)}/{toBengaliNumber(habits.length)}
              </span>
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient id="summary-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                className="arc-bg"
                cx="60"
                cy="60"
                r="50"
              />
              <circle
                className="arc-fill"
                cx="60"
                cy="60"
                r="50"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold font-num text-white tracking-tight">
                {toBengaliNumber(overallPercent)}%
              </span>
              <span className="text-[10px] text-slate-400 font-medium">যৌথ অগ্রগতি</span>
            </div>
          </div>
        </div>
      </div>

      {/* Widget Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5" id="widgets-container">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            isUserA={isUserA}
            onUpdateProgress={onUpdateProgress}
            onToggleBoolean={onToggleBoolean}
            onOpenLogModal={onOpenLogModal}
            onDeleteHabit={onDeleteHabit}
          />
        ))}

        {habits.length === 0 && (
          <div className="col-span-full py-12 px-4 text-center ios-card border-dashed">
            <p className="text-slate-400 text-sm mb-3">এখনো কোনো লক্ষ্য যুক্ত করা হয়নি।</p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 text-white font-semibold text-sm hover:bg-rose-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              প্রথম লক্ষ্য যোগ করুন
            </button>
          </div>
        )}
      </section>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 right-4 z-20 sm:right-6">
        <button
          onClick={onOpenAddModal}
          id="open-add-goal-btn"
          className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-[0_8px_25px_rgba(244,63,94,0.45)] hover:shadow-[0_12px_32px_rgba(244,63,94,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>নতুন লক্ষ্য যোগ করুন</span>
        </button>
      </div>
    </div>
  );
};
