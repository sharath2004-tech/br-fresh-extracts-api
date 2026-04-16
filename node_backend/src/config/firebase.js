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
