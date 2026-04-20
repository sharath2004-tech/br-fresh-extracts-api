import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDb } from './src/config/db.js';
import { initFirebase } from './src/config/firebase.js';
import apiRouter from './src/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

// Fail fast if critical environment variables are missing
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'UPLOAD_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[STARTUP] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 8000;

// Trust Render/proxy X-Forwarded-For headers (required for rate limiting behind a proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Rate limiting
const defaultLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter    = rateLimit({ windowMs: 60 * 1000,       max: 10,  standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, please try again later.' } });

app.use('/api', defaultLimiter);
app.use('/api/auth/check-user/', authLimiter);
app.use('/api/auth/verify-otp/', authLimiter);
app.use('/api/auth/login/',      authLimiter);

const customOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://br-fresh-extracts-webapp.onrender.com',
  'https://www.brfreshextracts.co.in',
  'https://brfreshextracts.co.in',
  // Capacitor Android WebView origins — always allowed regardless of CORS_ALLOWED_ORIGINS
  'capacitor://localhost',
  'https://localhost',
  'http://localhost',
];

// Merge: custom origins from env + always-allowed defaults
const allowedOrigins = customOrigins.length
  ? [...new Set([...customOrigins, ...defaultOrigins])]
  : defaultOrigins;

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin) || /https:\/\/.*\.vercel\.app$/.test(origin)) {
      return cb(null, true);
    }
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Upload-Secret'],
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health/', async (req, res) => {
  const status = { ok: true };
  try {
    await connectDb();
    status.db = 'ok';
  } catch (e) {
    status.db = `error: ${e.message}`;
  }
  res.json(status);
});

app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Server error';
  res.status(status).json({ error: message });
});

async function start() {
  await connectDb();
  initFirebase();
  app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
