import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { toBengaliNumber } from '../utils/bengali';
import { sound } from '../services/notifications';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  streakCount,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playCompletion();
      try {
        // Confetti burst
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f43f5e', '#f59e0b', '#06b6d4', '#10b981', '#ffffff'],
        });
      } catch {
        // Ignore if confetti not supported
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1c2438] to-[#101524] border border-amber-500/30 rounded-3xl p-6 text-center shadow-[0_12px_40px_rgba(245,158,11,0.25)] relative overflow-hidden">
        {/* Flame Burst */}
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-orange-500/30 flex items-center justify-center mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <span className="text-5xl flame-anim">🔥</span>
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide font-num mb-2">
          {toBengaliNumber(streakCount)} দিনের ধারা!
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          চমৎকার সিঙ্ক! আপনারা দুজন একসাথে লক্ষ্য পূরণ করে নতুন মাইলফলকে পৌঁছেছেন। ধারা বজায় রাখুন!
        </p>

        <button
          type="button"
          onClick={onClose}
          id="celeb-close-btn"
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          এগিয়ে চলুন 🚀
        </button>
      </div>
    </div>
  );
};
