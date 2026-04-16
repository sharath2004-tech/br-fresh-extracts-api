export function requireSecret(req, res, next) {
  const secret = process.env.UPLOAD_SECRET || '';
  if (!secret) return next();
  const header = req.get('X-Upload-Secret');
  if (header && header === secret) return next();
  return res.status(403).json({ error: 'Unauthorized.' });
}
