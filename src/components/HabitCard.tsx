import React from 'react';
import { Check, Plus, Minus, Lock, Flame, MoreVertical, Edit2, Trash2, Clock } from 'lucide-react';
import type { Habit } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { showToast } from '../services/notifications';

interface HabitCardProps {
  habit: Habit;
  isReadOnly?: boolean;
  partnerName?: string;
  onToggle?: (id: string) => void;
  onIncrement?: (id: string, delta: number) => void;
  onOpenLogModal?: (habit: Habit) => void;
  onDelete?: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  isReadOnly = false,
  partnerName = 'পার্টনার',
  onToggle,
  onIncrement,
  onOpenLogModal,
  onDelete,
}) => {
  const isDone = habit.completed || (habit.target > 0 && habit.current >= habit.target);
  const percent = habit.target > 0 ? Math.min(100, Math.round((habit.current / habit.target) * 100)) : (habit.completed ? 100 : 0);

  const handleReadOnlyClick = () => {
    showToast(
      'রিড-ওনলি মোড (Read-Only) 🔒',
      `এটি ${partnerName}-এর ব্যক্তিগত স্পেস। আপনি কেবল লাইভ অগ্রগতি পর্যবেক্ষণ করতে পারবেন, এডিট করতে পারবেন না।`,
      'info'
    );
  };

  return (
    <div
      className={`group relative rounded-2xl p-4 sm:p-5 border transition-all duration-200 overflow-hidden ${
        isDone
          ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-500/50 shadow-lg shadow-emerald-950/10'
          : 'bg-[#121829] border-white/10 hover:border-white/20'
      }`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-md ${
              isDone ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white'
            }`}
          >
            {habit.emoji || '🎯'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                {habit.name}
              </h4>
              {isReadOnly && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-semibold text-indigo-300">
                  <Lock className="w-2.5 h-2.5" />
                  <span>রিড-ওনলি</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              লক্ষ্য: {toBengaliNumber(habit.target)} {habit.unit}
              {habit.frequency === 'daily' && ' • দৈনিক'}
            </p>
          </div>
        </div>

        {/* Action Button: Checkbox or Read-Only Status Badge */}
        {isReadOnly ? (
          <button
            onClick={handleReadOnlyClick}
            type="button"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isDone
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'bg-white/5 border border-white/10 text-slate-500'
            }`}
            title="পার্টনারের লক্ষ্য (রিড-ওনলি)"
          >
            {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <Lock className="w-4 h-4 text-slate-400" />}
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle?.(habit.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                isDone
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                  : 'bg-white/10 hover:bg-white/20 border border-white/10 text-slate-400 hover:text-white'
              }`}
              title={isDone ? 'সম্পন্ন হয়েছে' : 'সম্পন্ন করুন'}
            >
              <Check className={`w-5 h-5 stroke-[3] ${isDone ? 'text-white' : 'opacity-40'}`} />
            </button>

            {onDelete && (
              <button
                onClick={() => onDelete(habit.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="লক্ষ্যটি মুছুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            অগ্রগতি:{' '}
            <strong className="text-white font-bold">
              {toBengaliNumber(habit.current)} / {toBengaliNumber(habit.target)} {habit.unit}
            </strong>
          </span>
          <span
            className={`font-bold ${
              isDone ? 'text-emerald-400' : 'text-slate-300'
            }`}
          >
            {toBengaliNumber(percent)}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isDone
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm'
                : isReadOnly
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Bottom Controls (Only for Owner; STRICTLY Hidden / Read-Only for Partner) */}
      {!isReadOnly ? (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          {habit.type === 'number' ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onIncrement?.(habit.id, -1)}
                disabled={habit.current <= 0}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title="-1 কমান"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onOpenLogModal?.(habit)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
              >
                ইনপুট দিন
              </button>

              <button
                onClick={() => onIncrement?.(habit.id, 1)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="+1 বাড়ান"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400">
              {isDone ? 'আজকের জন্য সম্পন্ন ✓' : 'টিক দিয়ে সম্পন্ন করুন'}
            </span>
          )}

          <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>দৈনিক অভ্যাস</span>
          </div>
        </div>
      ) : (
        <div
          onClick={handleReadOnlyClick}
          className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-indigo-300/80 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-indigo-400" />
            <span>পার্টনার ট্র্যাকিং (সুরক্ষিত রিড-ওনলি)</span>
          </div>
          <span className="text-slate-400">
            {isDone ? 'সম্পন্ন হয়েছে' : 'চলমান...'}
          </span>
        </div>
      )}
    </div>
  );
};
