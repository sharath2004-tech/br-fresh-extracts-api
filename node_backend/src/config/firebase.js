import admin from 'firebase-admin';
import fs from 'fs';

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const keyBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  let serviceAccount;

  if (keyBase64) {
    // Most reliable: base64-encoded JSON avoids all escaping issues
    const decoded = Buffer.from(keyBase64.trim(), 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (keyJson) {
    let raw = keyJson.trim();
    // Try direct parse first
    try {
      serviceAccount = JSON.parse(raw);
    } catch {
      // Try replacing literal \n sequences then parse
      try {
        serviceAccount = JSON.parse(raw.replace(/\\n/g, '\n'));
      } catch (e2) {
        console.error('[Firebase] JSON parse failed:', e2.message);
        console.error('[Firebase] keyJson first 100 chars:', raw.slice(0, 100));
        return;
      }
    }
    // If it came out as a string (double-stringified), parse again
    if (typeof serviceAccount === 'string') {
      serviceAccount = JSON.parse(serviceAccount);
    }
    // Ensure private_key uses real newlines
    if (typeof serviceAccount.private_key === 'string') {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
  } else if (keyPath && fs.existsSync(keyPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
  } else {
    console.warn('[Firebase] No service account configured. Phone auth disabled.');
    return;
  }

  console.log('[Firebase] service account project_id:', serviceAccount.project_id);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  initialized = true;
  console.log('[Firebase] Admin SDK initialized OK');
}

export function firebaseAdmin() {
  return admin;
}

/**
 * Send a push notification to a user by their MongoDB user_id.
 * Optional `data` object adds key-value pairs for tap navigation.
 * Silently skips if Firebase is not configured or user has no tokens.
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  if (!initialized) return;
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).select('fcm_tokens').lean();
    const tokens = user?.fcm_tokens?.filter(Boolean) || [];
    if (tokens.length === 0) return;

    // FCM data values must all be strings
    const stringData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    );

    const message = {
      notification: { title, body },
      data: stringData,
      tokens,
    };
    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up invalid tokens
    const invalidTokens = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (code === 'messaging/invalid-registration-token' ||
            code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(tokens[idx]);
        }
      }
    });
    if (invalidTokens.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $pull: { fcm_tokens: { $in: invalidTokens } },
      });
    }
  } catch (err) {
    // Push notifications are non-critical — log and continue
    console.warn('[FCM] Push notification failed:', err.message);
  }
}

/**
 * Broadcast a push notification to ALL users who have FCM tokens.
 * Batches in groups of 500 (FCM multicast limit).
 */
export async function sendPushToAllUsers(title, body) {
  if (!initialized) return;
  try {
    const User = (await import('../models/User.js')).default;
    const users = await User.find({ fcm_tokens: { $exists: true, $not: { $size: 0 } } })
      .select('fcm_tokens').lean();

    const allTokens = users.flatMap(u => u.fcm_tokens || []).filter(Boolean);
    if (allTokens.length === 0) return;

    // Batch into chunks of 500
    for (let i = 0; i < allTokens.length; i += 500) {
      const batch = allTokens.slice(i, i + 500);
      await admin.messaging().sendEachForMulticast({ notification: { title, body }, tokens: batch });
    }
  } catch (err) {
    console.warn('[FCM] Broadcast push failed:', err.message);
  }
}
