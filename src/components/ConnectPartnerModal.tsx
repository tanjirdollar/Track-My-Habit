import React, { useState } from 'react';
import { X, Copy, Check, Users, Link2, Unlink, Sparkles, ShieldCheck, Mail, AlertCircle, RotateCcw } from 'lucide-react';
import type { UserProfile } from '../types';
import { connectPartnerByCodeOrEmail, disconnectPartner, resetTrackerProgressToZero } from '../services/firebase';
import { showToast, sound } from '../services/notifications';

interface ConnectPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialInviteCode?: string;
  onPartnerConnected: (partner: UserProfile) => void;
  onPartnerDisconnected: () => void;
  onProgressReset?: () => void;
}

export const ConnectPartnerModal: React.FC<ConnectPartnerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialInviteCode,
  onPartnerConnected,
  onPartnerDisconnected,
  onProgressReset,
}) => {
  const [partnerInput, setPartnerInput] = useState(initialInviteCode || '');
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetProgressOnConnect, setResetProgressOnConnect] = useState(true);

  // Sync initialInviteCode whenever it changes or modal opens
  React.useEffect(() => {
    if (initialInviteCode && !partnerInput) {
      setPartnerInput(initialInviteCode);
    }
  }, [initialInviteCode, isOpen]);

  if (!isOpen) return null;

  const isConnected = !!currentUser.partnerUid;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.inviteCode);
    setCopiedCode(true);
    sound.playTick();
    showToast('ইনভাইট কোড কপি হয়েছে! 📋', currentUser.inviteCode, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('invite', currentUser.inviteCode);
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    sound.playTick();
    showToast('শেয়ার লিংক কপি হয়েছে! 🔗', 'পার্টনারকে পাঠিয়ে দিন', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!partnerInput.trim()) {
      setErrorMessage('পার্টনারের কোড বা ইমেইল প্রদান করুন।');
      return;
    }

    setLoading(true);

    try {
      const result = await connectPartnerByCodeOrEmail(currentUser, partnerInput.trim());
      if (result.success && result.partner) {
        if (resetProgressOnConnect) {
          await resetTrackerProgressToZero(currentUser.uid);
          onProgressReset?.();
        }
        onPartnerConnected(result.partner);
        onClose();
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'কানেক্ট করার সময় ত্রুটি ঘটেছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে পার্টনারের সাথে সংযোগ বিচ্ছিন্ন করতে চান?')) {
      await disconnectPartner(currentUser);
      onPartnerDisconnected();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#131929] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Grabber for mobile */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                পারস্পরিক কানেকশন (Pairing)
              </h3>
              <p className="text-[11px] text-slate-400">
                পার্টনারের সাথে রিয়েল-টাইম ট্র্যাকিং যুক্ত করুন
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

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Invite Link Detected Banner */}
          {initialInviteCode && (
            <div className="p-3.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>ইনভাইট লিংক থেকে কোড পাওয়া গেছে: <strong className="text-white font-mono">{initialInviteCode}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setPartnerInput(initialInviteCode)}
                className="px-2.5 py-1 rounded-lg bg-indigo-500 text-white font-bold text-[10px] hover:bg-indigo-400 cursor-pointer"
              >
                ব্যবহার করুন
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* If already connected */}
          {isConnected ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">বর্তমানে কানেক্টেড আছেন</div>
                    <div className="text-xs text-emerald-400 font-semibold">
                      {currentUser.partnerName || 'পার্টনার'}
                    </div>
                  </div>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              </div>

              {currentUser.partnerEmail && (
                <div className="text-[11px] text-slate-400">
                  ইমেইল: {currentUser.partnerEmail}
                </div>
              )}

              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>পার্টনারের সাথে সংযোগ বিচ্ছিন্ন করুন</span>
              </button>
            </div>
          ) : null}

          {/* Section 1: Your Invite Code */}
          <div className="p-4 rounded-2xl bg-[#0d1220] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                আপনার ইনভাইট কোড
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">
                পার্টনারকে এই কোডটি দিন
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 py-2 px-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-center font-bold tracking-widest text-base">
                {currentUser.inviteCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'কপি হয়েছে' : 'কপি'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'লিংক কপি হয়েছে!' : 'সরাসরি ইনভাইট লিংক কপি করুন'}</span>
            </button>
          </div>

          {/* Section 2: Enter Partner's Code */}
          <form onSubmit={handleConnect} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                পার্টনারের কোড বা ইমেইল লিখুন
              </label>
              <input
                type="text"
                value={partnerInput}
                onChange={(e) => setPartnerInput(e.target.value)}
                placeholder="যেমন: POD-8X2F অথবা partner@mail.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0c101c] border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 font-mono tracking-wider"
              />
            </div>

            {/* Option to start progress at zero */}
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/20 border border-white/5 cursor-pointer text-xs text-slate-300 hover:bg-black/30 transition-colors">
              <input
                type="checkbox"
                checked={resetProgressOnConnect}
                onChange={(e) => setResetProgressOnConnect(e.target.checked)}
                className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center gap-1.5 leading-snug">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>নতুন পার্টনারের সাথে প্রগ্রেস রিসেট করে ০% থেকে শুরু করুন</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>কানেক্ট করুন (Connect Partner)</span>
                </>
              )}
            </button>
          </form>

          {/* Info footer */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 leading-relaxed">
            💡 <strong>কাজের নিয়ম:</strong> আপনি ও আপনার পার্টনার দুজনে আলাদা গুগল অ্যাকাউন্ট দিয়ে লগইন করবেন। এরপর যেকেউ একজনের কোড অন্যজন ইনপুট দিলেই লাইভ সিঙ্ক শুরু হবে।
          </div>
        </div>
      </div>
    </div>
  );
};
