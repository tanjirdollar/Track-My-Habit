/**
 * Notification service handling Browser Web Notifications, In-app toasts, and Web Audio chimes.
 */

// Web Audio synthesizer for tactile feedback & alerts (no external mp3 files required)
class SoundFx {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Soft pleasant click / tick
  playTick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(620, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Audio not supported or allowed yet
    }
  }

  // Habit completion melodic chord
  playCompletion() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.3);
      });
    } catch {
      // Audio not allowed yet
    }
  }

  // Partner sync chime
  playPartnerUpdate() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio not allowed
    }
  }
}

export const sound = new SoundFx();

export type ToastType = 'success' | 'info' | 'warning' | 'celebrate';

export interface ToastMessage {
  id: string;
  title: string;
  subtitle?: string;
  type: ToastType;
}

type ToastListener = (msg: ToastMessage) => void;
const listeners: Set<ToastListener> = new Set();

export function showToast(title: string, subtitle?: string, type: ToastType = 'info') {
  const msg: ToastMessage = {
    id: Math.random().toString(36).substring(2, 9),
    title,
    subtitle,
    type
  };
  listeners.forEach((fn) => fn(msg));

  // Also trigger system push notification if enabled
  if (type === 'celebrate' || type === 'success') {
    sendPushNotification(title, subtitle);
  }
}

export function subscribeToToast(listener: ToastListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast('পুশ নোটিফিকেশন চালু হয়েছে! 🔔', 'পার্টনারের আপডেট আপনি সরাসরি জানতে পারবেন।', 'success');
      sound.playPartnerUpdate();
    }
    return perm;
  } catch (err) {
    console.warn('Could not request notification permission', err);
    return 'denied';
  }
}

export function sendPushNotification(title: string, body?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body || 'একসাথে - পার্টনার হ্যাবিট ট্র্যাকার',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch {
      // Notification might be blocked inside iframe
    }
  }
}
