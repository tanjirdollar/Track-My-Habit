import React, { useState, useEffect } from 'react';
import { X, Flame, CheckCircle, HelpCircle } from 'lucide-react';
import type { FirebaseConfig } from '../types';
import { getSavedFirebaseConfig, saveFirebaseConfig } from '../services/firebase';
import { showToast } from '../services/notifications';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

const SAMPLE_CONFIG_PLACEHOLDER = `{
  "apiKey": "AIzaSyD-your-api-key-here",
  "authDomain": "duo-pod-app.firebaseapp.com",
  "projectId": "duo-pod-app",
  "storageBucket": "duo-pod-app.appspot.com",
  "messagingSenderId": "1234567890",
  "appId": "1:1234567890:web:abcdef"
}`;

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedFirebaseConfig();
      if (saved) {
        setJsonInput(JSON.stringify(saved, null, 2));
      } else {
        setJsonInput('');
      }
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setErrorMsg(null);
    if (!jsonInput.trim()) {
      setErrorMsg('অনুগ্রহ করে ফায়ারবেস কনফিগারেশন JSON পেস্ট করুন।');
      return;
    }

    try {
      // Clean up common JS object copy-paste errors (e.g. unquoted keys or trailing commas)
      let cleaned = jsonInput.trim();
      // If user pasted const firebaseConfig = { ... }
      if (cleaned.includes('{') && cleaned.includes('}')) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        cleaned = cleaned.substring(start, end + 1);
      }

      const parsed = JSON.parse(cleaned) as FirebaseConfig;

      if (!parsed.apiKey || !parsed.projectId) {
        setErrorMsg('JSON-এ অবশ্যই "apiKey" এবং "projectId" থাকতে হবে।');
        return;
      }

      saveFirebaseConfig(parsed);
      showToast('ফায়ারবেস কনফিগ সংরক্ষিত হয়েছে! 🔥', 'রিয়েল-টাইম ক্লাউড সিঙ্ক চালু করা হচ্ছে...', 'success');
      onConfigSaved();
      onClose();
    } catch {
      setErrorMsg('ভুল JSON ফরম্যাট। অনুগ্রহ করে সঠিক JSON ফরম্যাট চেক করে আবার চেষ্টা করুন।');
    }
  };

  const handleUseDemo = () => {
    saveFirebaseConfig(null);
    showToast('ডেমো ও লোকাল মোডে চলছে', 'ট্যাব বা একই ব্রাউজারে রিয়েল-টাইম সিঙ্ক সক্রিয় রয়েছে।', 'info');
    onConfigSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Grabber */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-white tracking-wide">
              ফায়ারবেস (Firebase) কনফিগারেশন
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <p className="text-xs text-slate-300 leading-relaxed">
            গুগল ফায়ারবেসের মাধ্যমে যেকোনো ভিন্ন ডিভাইস ও ফোন থেকে তাৎক্ষণিক ২-মুখী লাইভ সিঙ্ক সক্রিয় করতে আপনার Firebase Project-এর ওয়েব কনফিগারেশন JSON নিচে পেস্ট করুন।
          </p>

          <div className="space-y-1.5">
            <textarea
              rows={8}
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={SAMPLE_CONFIG_PLACEHOLDER}
              className="w-full p-3.5 rounded-xl bg-[#0b0e17] border border-white/10 text-emerald-300 font-mono text-xs focus:outline-none focus:border-amber-500 resize-none shadow-inner"
            />
            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium">{errorMsg}</p>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              <strong>টিপস:</strong> আপনি যদি এখনও Firebase কনফিগ না দিতে চান, তবে "ডেমো মোডে চালিয়ে যান" চাপুন। ব্রাউজারের আলাদা দুটি ট্যাবে অ্যাপটি ওপেন করলেও সাথে সাথে সিঙ্ক দেখতে পারবেন!
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              সংরক্ষণ ও সংযোগ করুন
            </button>

            <button
              type="button"
              onClick={handleUseDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs border border-white/8 transition-all cursor-pointer"
            >
              ডেমো মোডে চালিয়ে যান
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
