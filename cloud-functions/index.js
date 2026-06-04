const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// A lightweight login-rate-limit stub. This is a placeholder for a real rate limiter.
exports.loginAttempt = functions.https.onRequest(async (req, res) => {
  try {
    const body = req.body || {};
    const action = body.action || 'login';
    const identifier = body.details?.credential || body.details?.email || body.details?.mobile || body.details?.whatsapp || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = admin.firestore.Timestamp.now();
    const key = `rate-limit-${action}-${ip}`;
    const ref = db.collection('rate_limits').doc(key);
    const snap = await ref.get();
    let attempts = [];
    if (snap.exists) {
      const data = snap.data();
      attempts = Array.isArray(data.attempts) ? data.attempts : [];
      attempts = attempts.filter(ts => ts.toDate() > new Date(Date.now() - 5 * 60 * 1000));
    }
    if (attempts.length >= 10) {
      return res.status(429).json({ error: 'Too many attempts. Try again later.' });
    }
    attempts.push(now);
    await ref.set({ action, identifier, attempts, updatedAt: now });
    return res.json({ ok: true, attempts: attempts.length });
  } catch (error) {
    console.error('loginAttempt error', error);
    return res.status(500).json({ error: 'Internal error' });
  }
});

exports.rateLimit = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  res.set('Access-Control-Allow-Origin', '*');
  try {
    const body = req.body || {};
    const action = body.action || 'unknown';
    const identifier = body.details?.credential || body.details?.email || body.details?.mobile || body.details?.whatsapp || 'anonymous';
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const now = admin.firestore.Timestamp.now();
    const key = `rate-limit-${action}-${identifier}-${ip}`;
    const ref = db.collection('rate_limits').doc(key);
    const snap = await ref.get();
    let attempts = [];
    if (snap.exists) {
      const data = snap.data();
      attempts = Array.isArray(data.attempts) ? data.attempts : [];
      attempts = attempts.filter(ts => ts.toDate() > new Date(Date.now() - 5 * 60 * 1000));
    }
    if (attempts.length >= 10) {
      return res.status(429).json({ ok: false, blocked: true, reason: 'Too many attempts. Try again later.' });
    }
    attempts.push(now);
    await ref.set({ action, identifier, attempts, updatedAt: now });
    return res.json({ ok: true, attempts: attempts.length });
  } catch (error) {
    console.error('rateLimit error', error);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Push notification sender — triggered via HTTP for admin broadcasts
exports.sendPush = functions.https.onRequest(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).send('');
  }

  res.set('Access-Control-Allow-Origin', '*');

  const { title, body, targetUserId } = req.body || {};
  if (!title || !body) {
    return res.status(400).json({ ok: false, error: 'title and body are required' });
  }

  try {
    let subsSnapshot;
    if (targetUserId) {
      const ref = db.collection('push_subscriptions').doc(targetUserId);
      const snap = await ref.get();
      subsSnapshot = snap.exists ? { docs: [snap] } : { docs: [] };
    } else {
      subsSnapshot = await db.collection('push_subscriptions').get();
    }

    const results = [];
    for (const doc of subsSnapshot.docs) {
      const data = doc.data();
      if (!data.subscription) continue;
      try {
        const message = {
          notification: { title, body },
          token: data.subscription.keys?.auth
            ? undefined
            : data.subscription.endpoint
        };
        // Try sending via FCM if token available
        if (data.subscription.keys) {
          await admin.messaging().send({
            notification: { title, body },
            token: data.subscription.endpoint
          }, true);
          results.push({ userId: doc.id, status: 'sent' });
        } else {
          results.push({ userId: doc.id, status: 'skipped-no-token' });
        }
      } catch (sendError) {
        results.push({ userId: doc.id, status: 'failed', error: sendError.message });
        if (sendError.code === 'messaging/invalid-registration-token' ||
            sendError.code === 'messaging/registration-token-not-registered') {
          await doc.ref.delete();
        }
      }
    }

    return res.json({ ok: true, sent: results.filter(r => r.status === 'sent').length, total: results.length, results });
  } catch (error) {
    console.error('sendPush error', error);
    return res.status(500).json({ ok: false, error: 'Internal error' });
  }
});

// Auto-set admin custom claim when admin document is created
exports.setAdminClaims = functions.firestore
  .document('admins/{userId}')
  .onCreate(async (snap, context) => {
    const userId = context.params.userId;
    try {
      await admin.auth().setCustomUserClaims(userId, { admin: true });
      console.log('Admin claim set for', userId);
    } catch (error) {
      console.error('Failed to set admin claim for', userId, error.message);
    }
  });
