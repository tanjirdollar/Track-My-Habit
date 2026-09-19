import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Sparkles, Heart, Flame, Smile, Check } from 'lucide-react';
import type { DuoMessage, UserProfile } from '../types';
import { toBengaliNumber } from '../utils/bengali';

interface DuoChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  partnerName: string;
  partnerUid?: string;
  partnerPhoto?: string | null;
  messages: DuoMessage[];
  onSendMessage: (text: string) => Promise<boolean>;
}

const QUICK_CHIPS = [
  '💪 চালিয়ে যাও!',
  '🔥 দারুণ করছো!',
  '💧 পানি খেয়েছো তো?',
  '🏃‍♂️ শরীরচর্চা শেষ?',
  '👏 অনেক ভালো অগ্রগতি!',
  '⏰ আর একটু বাকি!',
];

export const DuoChatModal: React.FC<DuoChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  partnerName,
  partnerUid,
  partnerPhoto,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(text);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${toBengaliNumber(hours)}:${toBengaliNumber(strMinutes)} ${ampm}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-[#101524] border border-white/10 rounded-3xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden text-white animate-scale-up">
        {/* Header */}
        <div className="px-5 py-4 bg-[#141b2d] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {partnerName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#101524]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {partnerName}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  লাইভ চ্যাট
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                পার্টনারের সাথে তাৎক্ষণিক বার্তা ও অনুপ্রেরণা আদান-প্রদান
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

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0d121f]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">কোনো বার্তা নেই</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  {partnerName}-কে একটি উৎসাহব্যঞ্জক বার্তা বা হ্যালো পাঠান!
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUid === currentUser.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isMe ? 'আমি' : msg.senderName}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      • {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-md shadow-indigo-600/20'
                        : 'bg-[#1a233a] border border-white/10 text-slate-200 rounded-bl-xs shadow-md'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Motivation Chips */}
        <div className="px-4 py-2 bg-[#121829] border-t border-white/5 overflow-x-auto flex items-center gap-1.5 shrink-0 scrollbar-none">
          {QUICK_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="text-[11px] px-3 py-1 rounded-full bg-white/5 hover:bg-indigo-500/20 hover:border-indigo-500/40 border border-white/5 text-slate-300 hover:text-indigo-200 transition-all whitespace-nowrap cursor-pointer active:scale-95"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 bg-[#141b2d] border-t border-white/10 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`${partnerName}-কে কিছু লিখুন...`}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="w-10 h-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
