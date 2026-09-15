import React, { useState } from 'react';
import { X, Lock, Mail, User, LogIn, UserPlus, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';
import { registerWithEmail, loginWithEmail, loginAsDemo } from '../services/firebase';
import { showToast, sound } from '../services/notifications';
import type { AuthUserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUserProfile) => void;
  initialMode?: 'login' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('ইমেইল ও পাসওয়ার্ড সঠিকভাবে পূরণ করুন।');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার নাম লিখুন।');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const user = await registerWithEmail(name.trim(), email.trim(), password);
        sound.playCompletion();
        showToast('অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! 🎉', `${user.name}, আপনাকে স্বাগতম!`, 'celebrate');
        onAuthSuccess(user);
        onClose();
      } else {
        const user = await loginWithEmail(email.trim(), password);
        sound.playCompletion();
        showToast('লগইন সফল হয়েছে! 👋', `${user.name}, আপনাকে স্বাগতম!`, 'success');
        onAuthSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let msg = 'লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
      const code = err?.code || '';

      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        msg = 'ভুল ইমেইল বা পাসওয়ার্ড। অনুগ্রহ করে তথ্য যাচাই করুন।';
      } else if (code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। লগইন করার চেষ্টা করুন।';
      } else if (code === 'auth/weak-password') {
        msg = 'পাসওয়ার্ডটি খুব সহজ। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Firebase Console-এ Email/Password অথেনটিকেশন সক্রিয় করা নেই। Firebase Console > Authentication > Sign-in method থেকে Email/Password চালূ করুন।';
      } else if (code === 'auth/network-request-failed') {
        msg = 'নেটওয়ার্ক ত্রুটি। আপনার ইন্টারনেট সংযোগ চেক করুন।';
      } else if (err?.message) {
        msg = err.message;
      }

      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'userA' | 'userB') => {
    const demoUser = loginAsDemo(role, role === 'userA' ? 'আমি (User A)' : 'পার্টনার (User B)');
    sound.playTick();
    showToast(`ডেমো একাউন্টে প্রবেশ করা হয়েছে: ${demoUser.name}`, 'লোকাল ও ব্রডকাস্টের মাধ্যমে সিঙ্ক কাজ করবে।', 'info');
    onAuthSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Grabber */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {mode === 'login' ? 'অ্যাকাউন্টে লগইন করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
              </h3>
              <p className="text-[11px] text-slate-400">
                পার্টনারের সাথে রিয়েল-টাইম ক্লাউড সিঙ্কের জন্য
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-4 pb-1">
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              লগইন (Sign In)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              নতুন অ্যাকাউন্ট (Sign Up)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> আপনার নাম
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: তানজির বা পার্টনার"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
                required={mode === 'signup'}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> ইমেইল ঠিকানা
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> পাসওয়ার্ড
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষর"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> লগইন করুন
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> অ্যাকাউন্ট তৈরি করুন
              </>
            )}
          </button>

          {/* Quick Demo Test Option */}
          <div className="pt-2 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> দ্রুত টেস্ট মোড:
              </span>
              <span className="text-[10px] text-slate-500">লগইন ছাড়াও সরাসরি পরীক্ষা করুন</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('userA')}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-rose-300 text-center transition-all cursor-pointer"
              >
                আমি (User A)
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('userB')}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-cyan-300 text-center transition-all cursor-pointer"
              >
                পার্টনার (User B)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
