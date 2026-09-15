import React from 'react';
import { Check, Plus, Minus, Trash2, Edit3 } from 'lucide-react';
import type { Habit } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { sound } from '../services/notifications';

interface HabitCardProps {
  habit: Habit;
  isUserA: boolean;
  onUpdateProgress: (habitId: string, delta: number, absolute?: number) => void;
  onToggleBoolean: (habitId: string) => void;
  onOpenLogModal: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isUserA,
  onUpdateProgress,
  onToggleBoolean,
  onOpenLogModal,
  onDeleteHabit,
}) => {
  // Determine "my" and "partner's" values depending on whether current user is userA or userB
  const myVal = isUserA ? habit.myProgress : habit.partnerProgress;
  const partnerVal = isUserA ? habit.partnerProgress : habit.myProgress;

  const myDone = habit.type === 'boolean'
    ? (isUserA ? !!habit.completedByMe : !!habit.completedByPartner)
    : myVal >= habit.target;

  const partnerDone = habit.type === 'boolean'
    ? (isUserA ? !!habit.completedByPartner : !!habit.completedByMe)
    : partnerVal >= habit.target;

  const myPercent = Math.min(100, Math.round((myVal / (habit.target || 1)) * 100));
  const partnerPercent = Math.min(100, Math.round((partnerVal / (habit.target || 1)) * 100));

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    const step = habit.target > 500 ? 500 : habit.target > 20 ? 5 : 1;
    onUpdateProgress(habit.id, step);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playTick();
    const step = habit.target > 500 ? 500 : habit.target > 20 ? 5 : 1;
    onUpdateProgress(habit.id, -step);
  };

  const handleToggle = () => {
    if (!myDone) {
      sound.playCompletion();
    } else {
      sound.playTick();
    }
    onToggleBoolean(habit.id);
  };

  return (
    <div className="ios-card ios-card-hover p-4 relative group flex flex-col justify-between overflow-hidden">
      {/* Top Habit info */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-2xl bg-white/5 border border-white/8 select-none flex items-center justify-center w-11 h-11">
              {habit.emoji || '🎯'}
            </span>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide flex items-center gap-1.5">
                {habit.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium font-num">
                টার্গেট: {toBengaliNumber(habit.target)} {habit.unit} • {habit.frequency === 'daily' ? 'প্রতিদিন' : 'সপ্তাহে'}
              </p>
            </div>
          </div>

          {/* Quick actions dropdown / delete */}
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onOpenLogModal(habit)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
              title="নির্দিষ্ট মান লিখুন"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDeleteHabit(habit.id)}
              className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-colors"
              title="লক্ষ্যটি মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Comparison Bars */}
        <div className="space-y-3 my-2">
          {/* My Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                আমার লক্ষ্য
              </span>
              <span className="font-semibold text-slate-200 font-num">
                {habit.type === 'boolean'
                  ? (myDone ? '✓ সম্পন্ন' : 'বাকি আছে')
                  : `${toBengaliNumber(myVal)} / ${toBengaliNumber(habit.target)} ${habit.unit} (${toBengaliNumber(myPercent)}%)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  myDone ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-rose-500'
                }`}
                style={{ width: habit.type === 'boolean' ? (myDone ? '100%' : '0%') : `${myPercent}%` }}
              />
            </div>
          </div>

          {/* Partner's Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                পার্টনার
              </span>
              <span className="font-semibold text-slate-300 font-num">
                {habit.type === 'boolean'
                  ? (partnerDone ? '✓ সম্পন্ন' : 'বাকি আছে')
                  : `${toBengaliNumber(partnerVal)} / ${toBengaliNumber(habit.target)} ${habit.unit} (${toBengaliNumber(partnerPercent)}%)`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  partnerDone ? 'bg-gradient-to-r from-cyan-400 to-teal-300' : 'bg-cyan-500'
                }`}
                style={{ width: habit.type === 'boolean' ? (partnerDone ? '100%' : '0%') : `${partnerPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Control Buttons */}
      <div className="pt-3 border-t border-white/5 mt-2 flex items-center justify-between gap-2">
        {habit.type === 'boolean' ? (
          <button
            onClick={handleToggle}
            className={`w-full py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              myDone
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/35 hover:bg-rose-500/25'
                : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Check className={`w-4 h-4 ${myDone ? 'text-rose-400 stroke-[3]' : 'text-slate-400'}`} />
            <span>{myDone ? 'আজ সম্পন্ন হয়েছে' : 'সম্পন্ন চিহ্নিত করুন'}</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-between gap-2">
            <button
              onClick={handleDecrement}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 active:scale-95 transition-all"
              title="কমান"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenLogModal(habit)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/8 text-xs font-semibold text-center truncate transition-all"
            >
              {myDone ? '🎉 সম্পন্ন!' : 'লগ করুন'}
            </button>

            <button
              onClick={handleIncrement}
              className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 active:scale-95 transition-all"
              title="যোগ করুন"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
