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

export async function register(req, res, next) {
  try {
    const { firebase_token, name, password } = req.body || {};
    if (!firebase_token || !password) {
      return res.status(400).json({ error: 'Token and password required' });
    }

    const admin = firebaseAdmin();
    if (!admin.apps?.length) {
      return res.status(501).json({ error: 'Firebase not configured' });
    }

    const decoded = await admin.auth().verifyIdToken(firebase_token);
    const phone_number = decoded.phone_number;
    if (!phone_number) return res.status(401).json({ error: 'Invalid Firebase token: No phone found.' });

    const existing = await findUserByPhone(phone_number);
    if (existing) return res.status(400).json({ error: 'User already exists.' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      phone_number,
      name: name || 'Customer',
      password_hash,
      is_profile_complete: true,
    });

    const tokens = {
      access: signAccessToken({ user_id: user.id, phone_number: user.phone_number, name: user.name }),
      refresh: signRefreshToken({ user_id: user.id, phone_number: user.phone_number }),
    };

    res.status(201).json({
      message: 'Account created!',
      tokens,
      user: normalizeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { firebase_token, new_password } = req.body || {};
    if (!firebase_token || !new_password) {
      return res.status(400).json({ error: 'Token and password required' });
    }

    const admin = firebaseAdmin();
    if (!admin.apps?.length) {
      return res.status(501).json({ error: 'Firebase not configured' });
    }

    const decoded = await admin.auth().verifyIdToken(firebase_token);
    const phone_number = decoded.phone_number;
    if (!phone_number) return res.status(401).json({ error: 'Invalid Firebase token: No phone found.' });

    const user = await findUserByPhone(phone_number);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.password_hash = await bcrypt.hash(new_password, 10);
    await user.save();

    res.json({ message: 'Password reset successfully.' });
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
    Object.assign(user, patch, { is_profile_complete: true });
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
