// CAMPUSCONNECT Push Notification Service Worker
// Handles push events, notification clicks, and background sync

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'CampusConnect', body: 'You have a new notification', icon: '/campusconnect-logo.png', tag: 'campusconnect', data: {} };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/campusconnect-logo.png',
    badge: '/campusconnect-logo.png',
    tag: data.tag || 'campusconnect-' + Date.now(),
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click — open/focus the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if CampusConnect is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification close (for analytics if needed)
self.addEventListener('notificationclose', (event) => {
  // Could track dismissed notifications here
});
