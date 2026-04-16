import { firebaseAdmin } from '../config/firebase.js';

export async function requireFirebaseUser(req, res, next) {
  try {
    const authHeader = req.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.body?.firebase_token || req.query?.firebase_token);

    if (!token) {
      return res.status(401).json({ error: 'Missing firebase token' });
    }

    const admin = firebaseAdmin();
    if (!admin.apps?.length) {
      return res.status(501).json({ error: 'Firebase not configured' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.firebaseUser = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid firebase token' });
  }
}
