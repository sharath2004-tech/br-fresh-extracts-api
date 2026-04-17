import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDb } from './src/config/db.js';
import apiRouter from './src/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://br-fresh-extracts-webapp.onrender.com',
  'https://www.brfreshextracts.co.in',
  'https://brfreshextracts.co.in',
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const list = allowedOrigins.length ? allowedOrigins : defaultOrigins;
    if (list.includes(origin) || /https:\/\/.*\.vercel\.app$/.test(origin)) {
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
  app.listen(PORT, () => {
    console.log(`API running on :${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
