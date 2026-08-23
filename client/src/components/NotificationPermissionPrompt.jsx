import { useState, useEffect } from 'react';
import { Bell, X, Sparkles } from 'lucide-react';
import { usePushNotifications } from '../lib/usePushNotifications';

export default function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);
  const { status, subscribe } = usePushNotifications();

  useEffect(() => {
    // Show prompt only once per session if user hasn't decided yet
    if (status === 'not-subscribed') {
      const dismissed = sessionStorage.getItem('cc_notif_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setShow(true), 3000); // Show after 3s
        return () => clearTimeout(timer);
      }
    }
  }, [status]);

  if (!show || status !== 'not-subscribed') return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    setShow(false);
    if (ok) sessionStorage.setItem('cc_notif_prompt_dismissed', '1');
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('cc_notif_prompt_dismissed', '1');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 p-5 w-80 max-w-[calc(100vw-3rem)]">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shrink-0 shadow-sm">
            <Bell size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">Stay Updated!</p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enable push notifications for deadline reminders, attendance alerts, and new opportunities.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleEnable}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium bg-brand-600 text-white hover:bg-brand-700 shadow-sm transition"
              >
                <Sparkles size={14} /> Enable
              </button>
              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
