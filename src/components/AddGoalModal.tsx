import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Habit, HabitFrequency, HabitType } from '../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'current' | 'completed'>) => void;
}

interface Preset {
  id: string;
  name: string;
  type: HabitType;
  target: number;
  unit: string;
  emoji: string;
}

const PRESETS: Preset[] = [
  { id: 'steps', name: 'হাঁটা', type: 'number', target: 10000, unit: 'কদম', emoji: '👟' },
  { id: 'sleep', name: 'পর্যাপ্ত ঘুম', type: 'number', target: 8, unit: 'ঘণ্টা', emoji: '🌙' },
  { id: 'water', name: 'পানি পান', type: 'number', target: 8, unit: 'গ্লাস', emoji: '💧' },
  { id: 'workout', name: 'ব্যায়াম', type: 'number', target: 45, unit: 'মিনিট', emoji: '⚡' },
  { id: 'reading', name: 'বই পড়া', type: 'number', target: 20, unit: 'পৃষ্ঠা', emoji: '📖' },
  { id: 'vitamins', name: 'ভিটামিন ও ওষুধ', type: 'boolean', target: 1, unit: 'বার', emoji: '💊' },
  { id: 'meditation', name: 'মেডিটেশন', type: 'number', target: 15, unit: 'মিনিট', emoji: '🧘' },
  { id: 'weight', name: 'ওজন পর্যবেক্ষণ', type: 'number', target: 65, unit: 'কেজি', emoji: '⚖️' },
];

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose, onAddHabit }) => {
  const [selectedPreset, setSelectedPreset] = useState<string>('steps');
  const [name, setName] = useState<string>('হাঁটা');
  const [type, setType] = useState<HabitType>('number');
  const [target, setTarget] = useState<number>(10000);
  const [unit, setUnit] = useState<string>('কদম');
  const [emoji, setEmoji] = useState<string>('👟');
  const [frequency, setFrequency] = useState<HabitFrequency>('daily');

  if (!isOpen) return null;

  const handleSelectPreset = (p: Preset) => {
    setSelectedPreset(p.id);
    setName(p.name);
    setType(p.type);
    setTarget(p.target);
    setUnit(p.unit);
    setEmoji(p.emoji);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddHabit({
      name: name.trim(),
      type,
      target: type === 'boolean' ? 1 : Number(target) || 1,
      unit: type === 'boolean' ? 'বার' : unit.trim() || 'একক',
      frequency,
      emoji: emoji || '🎯',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Grabber bar for mobile sheet feel */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              নতুন লক্ষ্য তৈরি করুন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Preset Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              প্রিসেট হ্যাবিট বেছে নিন
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`p-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 border transition-all ${
                    selectedPreset === p.id
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-200 shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{p.emoji}</span>
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                লক্ষ্যের নাম
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-12 text-center p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-lg focus:outline-none focus:border-rose-500"
                  maxLength={2}
                  title="ইমোজি"
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: সকালে হাঁটা"
                  className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Tracking Type Toggle */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                ট্র্যাকিংয়ের ধরণ
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/8">
                <button
                  type="button"
                  onClick={() => setType('boolean')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    type === 'boolean'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✓ হ্যাঁ / না সম্পন্ন
                </button>
                <button
                  type="button"
                  onClick={() => setType('number')}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                    type === 'number'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📊 সংখ্যাগত গণনা
                </button>
              </div>
            </div>

            {/* Numeric Fields */}
            {type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    দৈনিক টার্গেট
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 font-num"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="যেমন: কদম, গ্লাস"
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Frequency */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                পুনরাবৃত্তি (Frequency)
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
                className="w-full p-2.5 rounded-xl bg-[#1c2438] border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option value="daily">প্রতিদিন (Daily)</option>
                <option value="weekdays">সপ্তাহে ৩ দিন (3 Days/Week)</option>
                <option value="weekly">সপ্তাহে ১ দিন (1 Day/Week)</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-lg hover:from-rose-600 hover:to-amber-600 transition-all cursor-pointer"
            >
              লক্ষ্যটি যুক্ত করুন
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
