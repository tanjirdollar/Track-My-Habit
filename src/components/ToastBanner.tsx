import React, { useEffect, useState } from 'react';
import { subscribeToToast, type ToastMessage } from '../services/notifications';
import { Sparkles, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export const ToastBanner: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const unsub = subscribeToToast((msg) => {
      setToasts((prev) => [...prev, msg]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id));
      }, 4500);
    });
    return unsub;
  }, []);

  if (toasts.length === 0) return null;

  const getIcon = (type: ToastMessage['type']) => {
    switch (type) {
      case 'celebrate':
        return <Sparkles className="w-5 h-5 text-amber-300" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-rose-400" />;
      default:
        return <Info className="w-5 h-5 text-cyan-400" />;
    }
  };

  const getBorderBg = (type: ToastMessage['type']) => {
    switch (type) {
      case 'celebrate':
        return 'bg-gradient-to-r from-[#241a3a] to-[#1a233e] border-amber-500/40 shadow-[0_8px_24px_rgba(245,158,11,0.25)]';
      case 'success':
        return 'bg-[#122421] border-emerald-500/40 shadow-[0_8px_24px_rgba(16,185,129,0.2)]';
      case 'warning':
        return 'bg-[#29141e] border-rose-500/40 shadow-[0_8px_24px_rgba(244,63,94,0.2)]';
      default:
        return 'bg-[#131d33] border-cyan-500/30 shadow-[0_8px_24px_rgba(6,182,212,0.2)]';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-white backdrop-blur-md animate-fade-in transition-all ${getBorderBg(
            t.type
          )}`}
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0">{getIcon(t.type)}</div>
            <div>
              <p className="text-xs font-bold tracking-wide">{t.title}</p>
              {t.subtitle && (
                <p className="text-[11px] text-slate-300 mt-0.5">{t.subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
