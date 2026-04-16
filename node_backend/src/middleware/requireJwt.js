import { verifyAccessToken } from '../config/jwt.js';

export function requireJwt(req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' });
  }
  try {
    const payload = verifyAccessToken(token);
    req.jwtUser = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid access token' });
  }
}
