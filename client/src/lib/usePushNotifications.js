import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

const VAPID_PUBLIC_KEY = null; // Fetched from server at runtime

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [status, setStatus] = useState('loading'); // loading | denied | not-subscribed | subscribed | unsupported
  const [vapidKey, setVapidKey] = useState(null);

  // Check browser support + fetch VAPID key from server
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }

    api
      .get('/push/vapid-public-key')
      .then((data) => {
        if (!data.enabled || !data.publicKey) {
          setStatus('unsupported');
          return;
        }
        setVapidKey(data.publicKey);

        // Check current subscription state
        navigator.serviceWorker.ready.then((reg) => {
          reg.pushManager.getSubscription().then((sub) => {
            if (sub) {
              setStatus('subscribed');
            } else if (Notification.permission === 'denied') {
              setStatus('denied');
            } else {
              setStatus('not-subscribed');
            }
          });
        });
      })
      .catch(() => setStatus('unsupported'));
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!vapidKey || status === 'subscribed') return false;

    try {
      const reg = await navigator.serviceWorker.ready;

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        return false;
      }

      // Create push subscription
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const { endpoint, keys } = subscription.toJSON();

      // Send to server
      await api.post('/push/subscribe', {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      setStatus('subscribed');
      return true;
    } catch (err) {
      console.error('[push] Subscribe failed:', err);
      return false;
    }
  }, [vapidKey, status]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const { endpoint } = sub.toJSON();
        await sub.unsubscribe();
        await api.post('/push/unsubscribe', { endpoint });
      }
      setStatus('not-subscribed');
    } catch (err) {
      console.error('[push] Unsubscribe failed:', err);
    }
  }, []);

  // Send test notification
  const sendTest = useCallback(async () => {
    try {
      const result = await api.post('/push/test');
      return result;
    } catch (err) {
      console.error('[push] Test failed:', err);
      return null;
    }
  }, []);

  return { status, subscribe, unsubscribe, sendTest };
}
