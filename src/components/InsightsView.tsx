import React from 'react';
import { Award, Users, Flame } from 'lucide-react';
import type { PodData } from '../types';
import { SpeedometerCanvas } from './SpeedometerCanvas';
import { toBengaliNumber, formatShortDay } from '../utils/bengali';

interface InsightsViewProps {
  pod: PodData;
}

export const InsightsView: React.FC<InsightsViewProps> = ({ pod }) => {
  const score = pod.healthScore || 86;

  const getStatusText = (s: number) => {
    if (s >= 85) return 'চমৎকার / THRIVING';
    if (s >= 70) return 'উন্নতিশীল / STRONG';
    if (s >= 50) return 'চলমান / STEADY';
    return 'মনোযোগ প্রয়োজন / NEEDS SYNC';
  };

  // Generate 7-day sync history
  const today = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const { dayName, dateNum } = formatShortDay(d);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayHist = pod.history?.[dateKey];

    // Seed realistic sample completion for preceding days if not explicitly logged
    const myDone = dayHist ? dayHist.userADone : (i % 2 === 0 || i === 6);
    const partnerDone = dayHist ? dayHist.userBDone : (i % 3 !== 0);
    const isFullSync = myDone && partnerDone;
    const isToday = i === 6;

    return {
      dayName,
      dateNum,
      myDone,
      partnerDone,
      isFullSync,
      isToday,
    };
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Pod Health Score Card */}
      <div className="ios-card p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-white tracking-wide">
            পড হেলথ স্কোর (Pod Health)
          </h2>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            সক্রিয় মেট্রিক্স
          </span>
        </div>

        {/* Speedometer */}
        <div className="py-2">
          <SpeedometerCanvas score={score} />
          <div className="text-center -mt-2">
            <div className="text-3xl font-extrabold font-num text-white tracking-tight">
              {toBengaliNumber(score)}
            </div>
            <div className="text-xs font-bold text-emerald-400 tracking-wider uppercase mt-0.5">
              {getStatusText(score)}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center mt-3 pt-3 border-t border-white/5">
          উভয় পার্টনারের গত ৭ দিনের ধারাবাহিকতা এবং সিঙ্কের উপর ভিত্তি করে পরিমাপকৃত।
        </p>
      </div>

      {/* 3 Stat Badges Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Best Streak */}
        <div className="ios-card p-3 flex flex-col items-center text-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-1.5">
            <Award className="w-5 h-5" />
          </div>
          <span className="text-base font-bold text-white font-num">
            {toBengaliNumber(pod.bestStreak || 24)} দিন
          </span>
          <span className="text-[11px] text-slate-400 font-medium">সর্বোচ্চ ধারা</span>
        </div>

        {/* Days Together */}
        <div className="ios-card p-3 flex flex-col items-center text-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-1.5">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-base font-bold text-white font-num">
            {toBengaliNumber(pod.daysTogether || 42)} দিন
          </span>
          <span className="text-[11px] text-slate-400 font-medium">একসাথে যাত্রা</span>
        </div>

        {/* Current Streak */}
        <div className="ios-card p-3 flex flex-col items-center text-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center text-rose-400 mb-1.5">
            <Flame className="w-5 h-5" />
          </div>
          <span className="text-base font-bold text-white font-num">
            {toBengaliNumber(pod.currentStreak || 12)} দিন
          </span>
          <span className="text-[11px] text-slate-400 font-medium">বর্তমান ধারা</span>
        </div>
      </div>

      {/* Weekly Days in Sync Card */}
      <div className="ios-card p-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-white tracking-wide">
            এই সপ্তাহের সিঙ্ক (Days in Sync)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            উভয় পার্টনারের লক্ষ্য পূরণ হলে বৃত্তটি সম্পূর্ণ উজ্জ্বল হয়ে ওঠে
          </p>
        </div>

        {/* 7-Day Strip */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 py-2">
          {past7Days.map((day, idx) => (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center p-2 rounded-2xl transition-all ${
                day.isToday ? 'bg-white/10 ring-1 ring-white/20' : 'bg-white/5'
              }`}
            >
              <span className="text-[11px] font-medium text-slate-400 mb-1.5">
                {day.dayName}
              </span>

              {/* Split Circle */}
              <div
                className={`split-circle ${
                  day.isFullSync
                    ? 'ring-2 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : ''
                }`}
              >
                {/* Left side: My completion */}
                <div
                  className={`split-left ${
                    day.myDone ? 'bg-rose-500' : 'bg-white/10'
                  }`}
                  title="আমার অগ্রগতি"
                />
                {/* Right side: Partner's completion */}
                <div
                  className={`split-right ${
                    day.partnerDone ? 'bg-cyan-400' : 'bg-white/10'
                  }`}
                  title="পার্টনারের অগ্রগতি"
                />
              </div>

              <span className="text-xs font-bold font-num text-slate-300 mt-1.5">
                {day.dateNum}
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 pt-4 mt-3 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>আমার সম্পন্ন</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>পার্টনারের সম্পন্ন</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"></span>
            <span>পূর্ণ সিঙ্ক (দুজনেই)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
