import { Router } from 'express';
import webpush from 'web-push';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

const router = Router();
router.use(auth);

// Configure web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    env.VAPID_EMAIL || 'mailto:campusconnect.ia@gmail.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
}

// GET /api/push/vapid-public-key — return VAPID public key for frontend
router.get('/vapid-public-key', (req, res) => {
  if (!env.VAPID_PUBLIC_KEY) {
    return res.json({ enabled: false });
  }
  res.json({ enabled: true, publicKey: env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — register a push subscription
router.post('/subscribe', asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth: authKey } = req.body;
  if (!endpoint || !p256dh || !authKey) {
    throw ApiError.badRequest('Missing push subscription fields');
  }

  // Upsert subscription (one per endpoint per user)
  const existing = await prisma.pushSubscription.findUnique({
    where: { user_endpoint: { user: req.user.id, endpoint } },
  });

  if (existing) {
    await prisma.pushSubscription.update({
      where: { id: existing.id },
      data: { active: true, p256dh, auth: authKey },
    });
  } else {
    await prisma.pushSubscription.create({
      data: {
        user: req.user.id,
        endpoint,
        p256dh,
        auth: authKey,
        userAgent: req.headers['user-agent'] || '',
      },
    });
  }

  res.json({ success: true, message: 'Push subscription saved' });
}));

// POST /api/push/unsubscribe — remove push subscription
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  if (endpoint) {
    await prisma.pushSubscription.updateMany({
      where: { user: req.user.id, endpoint },
      data: { active: false },
    });
  } else {
    // Remove all subscriptions for user
    await prisma.pushSubscription.updateMany({
      where: { user: req.user.id },
      data: { active: false },
    });
  }
  res.json({ success: true });
}));

// POST /api/push/test — send a test notification
router.post('/test', asyncHandler(async (req, res) => {
  if (!env.VAPID_PUBLIC_KEY) {
    throw ApiError.badRequest('Push notifications not configured');
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { user: req.user.id, active: true },
  });

  if (subs.length === 0) {
    throw ApiError.badRequest('No active push subscriptions');
  }

  const payload = JSON.stringify({
    title: '🔔 CampusConnect',
    body: 'Push notifications are working! You will receive deadline reminders, attendance alerts, and opportunity updates.',
    icon: '/campusconnect-logo.png',
    tag: 'test-notification',
    data: { url: '/notifications' },
  });

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      // Subscription expired or invalid — deactivate it
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { active: false },
        });
      }
    }
  }

  res.json({ sent, failed, message: `Test notification sent to ${sent} device(s)` });
}));

// ── Helper: Send push notification to a user ──
export async function sendPushToUser(userId, { title, body, icon, url, tag }) {
  if (!env.VAPID_PUBLIC_KEY) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { user: userId, active: true },
  });

  const payload = JSON.stringify({
    title: title || 'CampusConnect',
    body: body || '',
    icon: icon || '/campusconnect-logo.png',
    tag: tag || `cc-${Date.now()}`,
    data: { url: url || '/dashboard' },
  });

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { active: false },
        });
      }
    }
  }
}

export default router;
