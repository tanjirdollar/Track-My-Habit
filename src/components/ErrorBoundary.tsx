import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetData = () => {
    try {
      localStorage.clear();
      window.location.href = window.location.pathname;
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0e1117] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#131929] border border-rose-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-5 border border-rose-500/30 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              কিছু একটা সমস্যা হয়েছে
            </h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              অ্যাপের ডেটা লোড করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পেজটি রিলোড দিন অথবা ডেটা রিসেট করে পুনরায় চেষ্টা করুন।
            </p>

            {this.state.error && (
              <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-left mb-6 overflow-x-auto">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.message || 'Unknown render error'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-rose-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পেজ রিলোড করুন</span>
              </button>

              <button
                onClick={this.handleResetData}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>ক্যাশ রিসেট করে শুরু করুন</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
