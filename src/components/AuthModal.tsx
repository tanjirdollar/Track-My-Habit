import React, { useState } from 'react';
import { X, Lock, Mail, User, LogIn, UserPlus, Sparkles, AlertCircle, ExternalLink } from 'lucide-react';
import { loginWithGoogle, registerWithEmail, loginWithEmail } from '../services/firebase';
import { showToast, sound } from '../services/notifications';
import type { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      onAuthSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMessage(err?.message || 'গুগল লগইনে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Grabber for mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                অ্যাকাউন্টে প্রবেশ করুন
              </h3>
              <p className="text-[11px] text-slate-400">
                পার্টনারের সাথে রিয়েল-টাইম ক্লাউড সিঙ্কের জন্য
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Error message banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* 1. Primary Hero: Google Sign-In */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-lg shadow-white/10 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {googleLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Google অ্যাকাউন্ট দিয়ে প্রবেশ করুন</span>
            </button>
            <p className="text-[11px] text-center text-slate-400">
              আপনি ও আপনার পার্টনার দুজনে আলাদা গুগল অ্যাকাউন্ট দিয়ে লগইন করবেন
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              অথবা ইমেইল দিয়ে
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Tab Switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              নতুন অ্যাকাউন্ট (Sign Up)
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> আপনার নাম
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: তানজির"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
                  required={mode === 'signup'}
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> ইমেইল
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> পাসওয়ার্ড
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="কমপক্ষে ৬ অক্ষর"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-rose-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-3.5 h-3.5" /> লগইন করুন
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" /> অ্যাকাউন্ট তৈরি করুন
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
