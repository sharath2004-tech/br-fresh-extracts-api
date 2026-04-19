import admin from 'firebase-admin';
import fs from 'fs';

let initialized = false;

export function initFirebase() {
  if (initialized) return;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
  const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (keyJson) {
    const serviceAccount = JSON.parse(keyJson);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    return;
  }

  if (keyPath && fs.existsSync(keyPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    initialized = true;
    return;
  }

  console.warn('FIREBASE_SERVICE_ACCOUNT_KEY_PATH/JSON not set. Firebase auth disabled.');
}

export function firebaseAdmin() {
  return admin;
}

/**
 * Send a push notification to a user by their MongoDB user_id.
 * Silently skips if Firebase is not configured or user has no tokens.
 */
export async function sendPushNotification(userId, title, body) {
  if (!initialized) return;
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId).select('fcm_tokens').lean();
    const tokens = user?.fcm_tokens?.filter(Boolean) || [];
    if (tokens.length === 0) return;

    const message = {
      notification: { title, body },
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
