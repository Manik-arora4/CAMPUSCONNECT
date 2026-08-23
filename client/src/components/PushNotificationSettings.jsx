import { Bell, BellOff, BellRing, MonitorSmartphone, CheckCircle, XCircle } from 'lucide-react';
import { usePushNotifications } from '../lib/usePushNotifications';

const STATUS_MAP = {
  loading: { label: 'Checking…', icon: MonitorSmartphone, color: 'text-slate-400' },
  unsupported: { label: 'Not supported in this browser', icon: XCircle, color: 'text-slate-400' },
  denied: { label: 'Blocked by browser', icon: BellOff, color: 'text-red-500' },
  'not-subscribed': { label: 'Not enabled', icon: BellOff, color: 'text-slate-500' },
  subscribed: { label: 'Active — you will receive notifications', icon: CheckCircle, color: 'text-green-600' },
};

export default function PushNotificationSettings() {
  const { status, subscribe, unsubscribe, sendTest } = usePushNotifications();
  const info = STATUS_MAP[status] || STATUS_MAP.unsupported;
  const Icon = info.icon;
  const isSubscribed = status === 'subscribed';
  const canToggle = status === 'not-subscribed' || status === 'subscribed';
  const isUnsupported = status === 'unsupported' || status === 'loading';

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-brand-100 flex items-center justify-center">
          <Bell size={20} className="text-brand-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Push Notifications</h3>
          <p className="text-xs text-slate-500">Get alerts for deadlines, attendance & opportunities</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Icon size={16} className={info.color} />
        <span className={`text-sm ${info.color}`}>{info.label}</span>
      </div>

      {!isUnsupported && (
        <div className="flex items-center gap-2">
          {canToggle && (
            <button
              onClick={isSubscribed ? unsubscribe : subscribe}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                isSubscribed
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
              }`}
            >
              {isSubscribed ? (
                <>
                  <BellOff size={16} /> Disable
                </>
              ) : (
                <>
                  <BellRing size={16} /> Enable Notifications
                </>
              )}
            </button>
          )}

          {isSubscribed && (
            <button
              onClick={async () => {
                const result = await sendTest();
                if (result) alert(result.message || 'Test notification sent!');
              }}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <Bell size={16} /> Send Test
            </button>
          )}
        </div>
      )}

      {status === 'denied' && (
        <p className="text-xs text-red-400 mt-1">
          Notifications are blocked. Enable them in your browser settings (click the lock icon in the address bar).
        </p>
      )}
    </div>
  );
}
