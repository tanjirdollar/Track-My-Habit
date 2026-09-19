import React, { useState } from 'react';
import { Bell, Sparkles, Send, X, Flame, Heart, Zap, CheckCircle2 } from 'lucide-react';
import type { Habit } from '../types';

interface NudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  targetHabit?: Habit | null;
  habitName?: string;
  onSendNudge: (message: string, habitName?: string, emoji?: string) => Promise<boolean>;
}

const PRESET_MESSAGES = [
  { emoji: '🔥', text: 'তুমি পারবে! আজকের গোলটা শেষ করে ফেলো!' },
  { emoji: '💧', text: 'পানি পান করতে মনে আছে তো? একটু পানি খেয়ে নাও!' },
  { emoji: '🏃‍♂️', text: 'চল একটু হেঁটে আসি বা শরীরচর্চাটা সেরে ফেলি!' },
  { emoji: '📚', text: 'আর অল্প কিছুক্ষণ পড়লেই আজকের লক্ষ্য পূরণ হয়ে যাবে!' },
  { emoji: '🧘‍♂️', text: 'গভীর শ্বাস নাও, একটু রিল্যাক্স হয়ে কাজটি শুরু করো।' },
  { emoji: '⏰', text: 'আজকের দিনটা প্রায় শেষ হতে চলল, টাস্কটা এখনই সেরে ফেলো!' },
  { emoji: '💪', text: 'তোমার প্রতি আমার পূর্ণ বিশ্বাস আছে, লেগে থাকো!' },
  { emoji: '👏', text: 'তুমি সত্যিই দারুণ করছো! আজকের দিনটা তোমার!' },
];

export const NudgeModal: React.FC<NudgeModalProps> = ({
  isOpen,
  onClose,
  partnerName,
  targetHabit,
  habitName,
  onSendNudge,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);
  const [customText, setCustomText] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🔔');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const resolvedHabitName = habitName || targetHabit?.name;
  const defaultHabitText = resolvedHabitName
    ? `"${resolvedHabitName}" কাজটি শেষ করার জন্য ছোট্ট একটা তাগিদ!`
    : '';

  const handleSend = async () => {
    let finalMessage = customText.trim();
    let finalEmoji = selectedEmoji;

    if (!finalMessage && selectedPreset !== null && PRESET_MESSAGES[selectedPreset]) {
      finalMessage = PRESET_MESSAGES[selectedPreset].text;
      finalEmoji = PRESET_MESSAGES[selectedPreset].emoji;
    }

    if (!finalMessage) {
      finalMessage = defaultHabitText || 'আজকের লক্ষ্যগুলো শেষ করতে ভুলে যেও না!';
    }

    setIsSending(true);
    try {
      await onSendNudge(finalMessage, resolvedHabitName, finalEmoji);
      setCustomText('');
      onClose();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#121829] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-white animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {partnerName}-কে তাগিদ দিন
              </h3>
              <p className="text-xs text-slate-400">
                {targetHabit ? `${targetHabit.emoji || '🎯'} ${targetHabit.name}` : 'অনুপ্রেরণামূলক বার্তা পাঠান'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset quick messages */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            দ্রুত তাগিদ ও অনুপ্রেরণা সিলেক্ট করুন:
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
            {PRESET_MESSAGES.map((preset, idx) => {
              const isSelected = selectedPreset === idx && !customText;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(idx);
                    setSelectedEmoji(preset.emoji);
                    setCustomText('');
                  }}
                  className={`flex items-center gap-3 text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 shadow-md shadow-amber-500/10 font-semibold'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <span className="text-lg shrink-0">{preset.emoji}</span>
                  <span className="leading-snug">{preset.text}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 ml-auto text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom message input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            বা আপনার নিজের ভাষায় লিখুন:
          </label>
          <div className="relative">
            <input
              type="text"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                if (e.target.value) {
                  setSelectedPreset(null);
                }
              }}
              placeholder={targetHabit ? `যেমন: "${targetHabit.name}" শেষ করে ফেলো প্রিয়!` : 'যেমন: তাড়াতাড়ি গোলটা শেষ করো, অপেক্ষা করছি!'}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={handleSend}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'পাঠানো হচ্ছে...' : 'তাগিদ পাঠান 🔔'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
