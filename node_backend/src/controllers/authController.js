import bcrypt from 'bcryptjs';
import { firebaseAdmin } from '../config/firebase.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import User from '../models/User.js';

function normalizeUser(u) {
  return {
    phone_number: u.phone_number,
    name: u.name,
    is_profile_complete: !!u.is_profile_complete,
  };
}

async function findUserByPhone(phone) {
  if (!phone) return null;
  let user = await User.findOne({ phone_number: phone });
  if (!user && phone.startsWith('+91')) {
    user = await User.findOne({ phone_number: phone.replace('+91', '') });
  }
  if (!user && !phone.startsWith('+91')) {
    user = await User.findOne({ phone_number: `+91${phone}` });
  }
  return user;
}

// Admin login — validates against env-var credentials, never hardcoded in frontend
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass  = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPass) {
      return res.status(503).json({ error: 'Admin login not configured.' });
    }
    if (email !== adminEmail || password !== adminPass) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signAccessToken({ role: 'admin', email });
    return res.json({ token, role: 'admin' });
  } catch (err) {
    next(err);
  }
}

export async function checkUser(req, res, next) {
  try {
    const phone = req.body?.phone_number;
    if (!phone) return res.status(400).json({ error: 'Phone number required' });
    const user = await findUserByPhone(phone);
    res.json({ exists: !!user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { phone_number, password } = req.body || {};
    if (!phone_number || !password) {
      return res.status(400).json({ error: 'Both phone and password are required' });
    }
    const user = await findUserByPhone(phone_number);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const ok = await bcrypt.compare(password, user.password_hash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid password' });

    const tokens = {
      access: signAccessToken({ user_id: user.id, phone_number: user.phone_number, name: user.name }),
      refresh: signRefreshToken({ user_id: user.id, phone_number: user.phone_number }),
    };

    res.json({ tokens, user: normalizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function profile(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (req.method === 'GET') {
      return res.json(user.toJSON());
    }

    const patch = req.body || {};
    // Whitelist allowed profile fields — prevent mass assignment
    const ALLOWED = ['name', 'email'];
    for (const field of ALLOWED) {
      if (patch[field] !== undefined) user[field] = patch[field];
    }
    user.is_profile_complete = true;
    await user.save();
    return res.json(user.toJSON());
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { old_password, new_password } = req.body || {};
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const ok = await bcrypt.compare(old_password || '', user.password_hash || '');
    if (!ok) return res.status(400).json({ error: 'Wrong old password.' });
    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();
    res.json({ message: 'Password updated!' });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const { refresh } = req.body || {};
    if (!refresh) return res.status(400).json({ error: 'Refresh token required' });
    const payload = verifyRefreshToken(refresh);
    const access = signAccessToken({ user_id: payload.user_id, phone_number: payload.phone_number || '' });
    res.json({ access });
  } catch (err) {
    next(err);
  }
}

// Verify Firebase Phone Auth ID token — for Android Capacitor native phone login
export async function firebaseVerify(req, res, next) {
  try {
    const { idToken, name, email } = req.body || {};
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    let decoded;
    try {
      decoded = await firebaseAdmin().auth().verifyIdToken(idToken);
    } catch (e) {
      console.error('[firebaseVerify] invalid token:', e?.message);
      return res.status(401).json({ error: 'Invalid or expired Firebase token.' });
    }

    const phone_number = decoded.phone_number;
    if (!phone_number) return res.status(400).json({ error: 'No phone number in Firebase token.' });

    let user = await findUserByPhone(phone_number);
    if (!user) {
      user = await User.create({
        phone_number,
        name: name?.trim() || 'Customer',
        email: email?.trim() || '',
        is_profile_complete: !!(name?.trim()),
      });
    }

    const tokens = {
      access: signAccessToken({ user_id: user.id, phone_number: user.phone_number, name: user.name }),
      refresh: signRefreshToken({ user_id: user.id, phone_number: user.phone_number }),
    };
    console.log(`[firebaseVerify] phone=${phone_number} uid=${decoded.uid}`);
    return res.json({ tokens, user: normalizeUser(user) });
  } catch (err) {
    next(err);
  }
}

// GET /auth/cart/ — returns user's saved cart
export async function getCart(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(userId).select('cart');
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ cart: user.cart || [] });
  } catch (err) { next(err); }
}

// PUT /auth/cart/ — saves user's cart
export async function saveCart(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { cart } = req.body || {};
    if (!Array.isArray(cart)) return res.status(400).json({ error: 'cart must be an array.' });
    // Sanitize: keep only safe fields
    const sanitized = cart.map(item => ({
      id:     String(item.id || ''),
      name:   String(item.name || '').slice(0, 200),
      weight: String(item.weight || '').slice(0, 50),
      price:  Number(item.price) || 0,
      qty:    Math.max(1, Math.min(99, Number(item.qty) || 1)),
      image:  String(item.image || '').slice(0, 500),
    })).slice(0, 50); // max 50 items
    await User.findByIdAndUpdate(userId, { cart: sanitized });
    res.json({ cart: sanitized });
  } catch (err) { next(err); }
}

// POST /auth/fcm-token/ — register or refresh device push notification token
export async function saveFcmToken(req, res, next) {
  try {
    const userId = req.jwtUser?.user_id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { token } = req.body || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }
    // Add token only if not already stored (avoid duplicates)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { fcm_tokens: token },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
}
