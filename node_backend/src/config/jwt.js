import jwt from 'jsonwebtoken';

const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '1h';
const REFRESH_TTL = process.env.JWT_REFRESH_TTL || '7d';

export function signAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return jwt.verify(token, secret);
}

export function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not set');
  return jwt.verify(token, secret);
}
