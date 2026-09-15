import React, { useState } from 'react';
import { X, Copy, Check, Flame, ShieldCheck, UserX, Bell, Share2, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import type { ConnectionStatus, PodData, PodUser, AuthUserProfile } from '../types';
import { showToast, requestNotificationPermission, sound } from '../services/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: PodData;
  myProfile: AuthUserProfile;
  connectionStatus: ConnectionStatus;
  notificationPermission: NotificationPermission;
  onOpenFirebaseConfig: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onPairPartner: (codeOrEmail: string) => void;
  onUnpairPartner: () => void;
  onUpdateUserName: (name: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  pod,
  myProfile,
  connectionStatus,
  notificationPermission,
  onOpenFirebaseConfig,
  onOpenAuthModal,
  onLogout,
  onPairPartner,
  onUnpairPartner,
  onUpdateUserName,
}) => {
  const [partnerInput, setPartnerInput] = useState('');
  const [displayName, setDisplayName] = useState(myProfile.name || 'আমি');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const partner: PodUser | null = myProfile.role === 'userA' ? pod.userB : pod.userA;
  const isPaired = !!partner;
  const isDemo = !myProfile.email || myProfile.uid.startsWith('demo_');

  const handleCopyCode = () => {
    sound.playTick();
    const shareUrl = `${window.location.origin}${window.location.pathname}?pod=${myProfile.podId}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setCopied(true);
        showToast('পড লিংক কপি করা হয়েছে! 📋', 'পার্টনারকে এই লিংক বা কোড পাঠিয়ে দিলে তিনি সরাসরি পডে ঢুকতে পারবেন।', 'success');
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        navigator.clipboard.writeText(myProfile.podId);
        setCopied(true);
        showToast('পড কোড কপি করা হয়েছে!', myProfile.podId, 'success');
        setTimeout(() => setCopied(false), 2000);
      });
  };

  const handleConnectPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInput.trim()) return;
    onPairPartner(partnerInput.trim());
    setPartnerInput('');
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onUpdateUserName(displayName.trim());
    showToast('নাম আপডেট সম্পন্ন হয়েছে', displayName.trim(), 'success');
  };

  const handleRequestNotif = async () => {
    await requestNotificationPermission();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#141b2d] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Grabber */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <h3 className="text-lg font-bold text-white tracking-wide">
            পড ও অ্যাকাউন্ট সেটিংস
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* 1. Account Section */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-transparent to-transparent border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {myProfile.name || 'ইউজার'}
                    {isDemo && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-normal">
                        ডেমো মোড
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {myProfile.email || 'কোনো ইমেইল যুক্ত নেই'}
                  </p>
                </div>
              </div>

              {isDemo ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAuthModal();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন / সাইন আপ</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 text-xs font-semibold border border-white/10 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>লগআউট</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Firebase Cloud Sync Status Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  🔥
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    ফায়ারবেস ক্লাউড সংযোগ
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {connectionStatus === 'connected' ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> habit-tracker-931a6-ff2dc ক্লাউড লাইভ সিঙ্ক সক্রিয়
                      </span>
                    ) : connectionStatus === 'connecting' ? (
                      <span className="text-amber-400 font-semibold">ফায়ারবেসের সাথে সংযুক্ত হচ্ছে...</span>
                    ) : (
                      <span>লোকাল ও ব্রডকাস্ট রিয়েল-টাইম মোডে চলছে</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenFirebaseConfig}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 border border-white/10 transition-all cursor-pointer shrink-0"
              >
                কনফিগ দেখুন
              </button>
            </div>
          </div>

          {/* 3. Duo Pod Pairing Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                পার্টনার পড কানেকশন (Duo Pod)
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                পার্টনারকে এই পড কোড বা শেয়ার লিংক দিন, অথবা নিচে পার্টনারের কোড বা ইমেইল লিখুন।
              </p>
            </div>

            {/* My Invite Code Box */}
            <div className="p-3.5 rounded-xl bg-[#0f1424] border border-white/10 space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                আপনার পড কোড ও শেয়ার লিংক
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-base font-bold text-rose-400 tracking-wider">
                  {myProfile.podId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>কপি হয়েছে!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>শেয়ার লিংক কপি</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Partner Code or Email Entry */}
            {!isPaired ? (
              <form onSubmit={handleConnectPartner} className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  পার্টনারের পড কোড বা ইমেইল ঠিকানা
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={partnerInput}
                    onChange={(e) => setPartnerInput(e.target.value)}
                    placeholder="যেমন: POD-XXXXX বা partner@mail.com"
                    className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-xs transition-all cursor-pointer shrink-0"
                  >
                    কানেক্ট
                  </button>
                </div>
              </form>
            ) : (
              /* Paired Status Panel with Unpair Button */
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  <div>
                    <p className="text-xs font-bold text-emerald-300">
                      সংযুক্ত আছেন: {partner?.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {partner?.email ? partner.email : 'উভয়ের ইনপুট তাৎক্ষণিক সিঙ্ক হচ্ছে।'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onUnpairPartner}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all cursor-pointer shrink-0"
                  title="পার্টনারকে পড থেকে রিমুভ করুন"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>বিচ্ছিন্ন হন</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Push Notifications Permission Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                <Bell className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">
                  পুশ নোটিফিকেশন
                </h4>
                <p className="text-xs text-slate-400">
                  {notificationPermission === 'granted'
                    ? 'নোটিফিকেশন সক্রিয় রয়েছে (Alert on)'
                    : 'পার্টনারের অ্যাকশন রিয়েল-টাইমে জানতে'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRequestNotif}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-blue-500 text-white hover:bg-blue-600 border-transparent'
              }`}
            >
              {notificationPermission === 'granted' ? 'সক্রিয় ✓' : 'অনুমতি দিন'}
            </button>
          </div>

          {/* 5. User Profile Display Name */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/8 space-y-3">
            <h4 className="text-sm font-bold text-white">প্রদর্শিত নাম পরিবর্তন</h4>
            <form onSubmit={handleSaveName} className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-slate-200 border border-white/10 transition-all cursor-pointer shrink-0"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
