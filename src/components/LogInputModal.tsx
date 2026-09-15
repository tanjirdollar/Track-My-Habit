import React, { useState, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import type { Habit } from '../types';
import { toBengaliNumber } from '../utils/bengali';
import { sound } from '../services/notifications';

interface LogInputModalProps {
  habit: Habit | null;
  isUserA: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaveValue: (habitId: string, value: number) => void;
}

export const LogInputModal: React.FC<LogInputModalProps> = ({
  habit,
  isUserA,
  isOpen,
  onClose,
  onSaveValue,
}) => {
  const [val, setVal] = useState<number>(0);

  useEffect(() => {
    if (habit) {
      const current = isUserA ? habit.myProgress : habit.partnerProgress;
      setVal(current);
    }
  }, [habit, isUserA, isOpen]);

  if (!isOpen || !habit) return null;

  const step = habit.target > 1000 ? 500 : habit.target > 20 ? 5 : 1;

  const handleInc = () => {
    sound.playTick();
    setVal((prev) => prev + step);
  };

  const handleDec = () => {
    sound.playTick();
    setVal((prev) => Math.max(0, prev - step));
  };

  const handleSave = () => {
    sound.playTick();
    onSaveValue(habit.id, Number(val) || 0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Grabber */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <h3 className="text-base font-bold text-white tracking-wide">
            অগ্রগতি আপডেট করুন ({habit.name})
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-center">
          {/* Quick adjust display */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 inline-block min-w-[180px]">
            <span className="text-3xl font-extrabold text-white font-num">
              {toBengaliNumber(val)}
            </span>
            <span className="text-sm font-semibold text-rose-400 ml-2">
              {habit.unit}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              টার্গেট: {toBengaliNumber(habit.target)} {habit.unit}
            </p>
          </div>

          {/* Quick adjust buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleDec}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
            >
              <Minus className="w-5 h-5" />
            </button>

            <input
              type="number"
              value={val}
              onChange={(e) => setVal(Math.max(0, Number(e.target.value)))}
              className="w-28 text-center p-3 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-bold font-num focus:outline-none focus:border-rose-500"
            />

            <button
              type="button"
              onClick={handleInc}
              className="w-12 h-12 rounded-2xl bg-rose-500/25 hover:bg-rose-500/35 text-rose-300 border border-rose-500/30 flex items-center justify-center text-xl font-bold active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
          >
            সংরক্ষণ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
