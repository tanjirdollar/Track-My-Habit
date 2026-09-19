import React, { useState } from 'react';
import { X, Copy, Check, LogOut, LogIn, Users, Shield, Link2, ExternalLink, HelpCircle, CheckCircle, RotateCcw, Bell } from 'lucide-react';
import type { UserProfile } from '../types';
import { logoutUser, disconnectPartner, requestNotificationPermission } from '../services/firebase';
import { showToast, sound } from '../services/notifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenConnect: () => void;
  onResetProgress?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenConnect,
  onResetProgress,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const isDemo = currentUser.uid.startsWith('demo_');
  const isConnected = !!currentUser.partnerUid;

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentUser.inviteCode);
    setCopiedCode(true);
    sound.playTick();
    showToast('ইনভাইট কোড কপি হয়েছে! 📋', currentUser.inviteCode, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSignOut = async () => {
    await logoutUser();
    onLogout();
    onClose();
    showToast('লগআউট সম্পন্ন হয়েছে', 'আপনি লোকাল ডেমো মোডে ফিরে গেছেন।', 'info');
  };

  const handleUnpair = async () => {
    if (window.confirm('আপনি কি নিশ্চিত যে পার্টনারের সাথে সংযোগ বিচ্ছিন্ন করতে চান?')) {
      await disconnectPartner(currentUser);
      showToast('পার্টনার সংযোগ বিচ্ছিন্ন করা হয়েছে', '', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-[#131929] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Mobile Grabber */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-3 sm:hidden" />

        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                অ্যাপ সেটিংস ও প্রোফাইল
              </h3>
              <p className="text-[11px] text-slate-400">
                অ্যাকাউন্ট ও পার্টনার সিঙ্ক্রোনাইজেশন
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
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                আপনার অ্যাকাউন্ট
              </span>
              {isDemo ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  ডেমো অ্যাকাউন্ট
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  গুগল অ্যাকাউন্ট সক্রিয়
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name || 'User'}
                  className="w-12 h-12 rounded-2xl object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {(currentUser.name || 'ইউ').charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate">
                  {currentUser.name || 'ইউজার'}
                </h4>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser.email || 'কোনো ইমেইল যুক্ত নেই'}
                </p>
              </div>

              {isDemo ? (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAuth();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>লগইন</span>
                </button>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
                  title="লগআউট"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Partner & Connection Section */}
          <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                পার্টনার কানেকশন
              </span>
              <span className="text-xs text-indigo-400 font-mono font-bold">
                কোড: {currentUser.inviteCode}
              </span>
            </div>

            {isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                      {(currentUser.partnerName || 'পা').charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {currentUser.partnerName || 'পার্টনার'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {currentUser.partnerEmail || 'রিয়েল-টাইম ক্লাউড সিঙ্ক সক্রিয়'}
                      </div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenConnect();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold text-center transition-colors cursor-pointer"
                  >
                    কানেকশন বিস্তারিত
                  </button>
                  <button
                    onClick={handleUnpair}
                    className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    বিচ্ছিন্ন হন
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">
                  বর্তমানে কোনো পার্টনার যুক্ত নেই। আপনার ইনভাইট কোড শেয়ার করে অথবা পার্টনারের কোড দিয়ে কানেক্ট করুন।
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenConnect();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>পার্টনারকে যুক্ত করুন (Connect)</span>
                </button>
              </div>
            )}
          </div>

          {/* Habit Progress & Notification Controls */}
          <div className="p-4 rounded-2xl bg-[#0c101c] border border-white/5 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              প্রগ্রেস ও নোটিফিকেশন নিয়ন্ত্রণ
            </span>

            <div className="flex flex-col sm:flex-row gap-2">
              {onResetProgress && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('আপনি কি নিশ্চিত যে সকল অভ্যাসের প্রগ্রেস ও হিস্ট্রি রিসেট করে শূন্য (০) থেকে শুরু করতে চান?')) {
                      onResetProgress();
                      onClose();
                    }
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>প্রগ্রেস ০% রিসেট করুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  requestNotificationPermission();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>নোটিফিকেশন সক্রিয় করুন</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              পার্টনার কোনো টাস্ক শেষ করলে বা তাগিদ দিলে তাৎক্ষণিক রিয়েল-টাইম নোটিফিকেশন পাঠানো হবে।
            </p>
          </div>

          {/* Firebase Configuration Info & Setup Instructions */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Firebase Console প্রয়োজনীয় নির্দেশনা</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              গুগল লগইন ও ফায়ারস্টোর লাইভ সিঙ্কের জন্য আপনার Firebase Console-এ নিচের বিষয়গুলো নিশ্চিত করুন:
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
              <li>
                <strong>Authentication &gt; Sign-in method:</strong> Google সক্রিয় (Enable) করুন।
              </li>
              <li>
                <strong>Authentication &gt; Settings &gt; Authorized Domains:</strong> অ্যাপের হোস্ট ডোমেনগুলো যুক্ত করুন।
              </li>
              <li>
                <strong>Firestore Database:</strong> ডাটাবেজ তৈরি করে Rules ট্যাবে সিকিউরিটি রুলস সেভ করুন।
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
