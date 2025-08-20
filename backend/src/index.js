import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import db from './config/database.js';
import apiLimiter from './middleware/rateLimit.js';
import authRoutes from './routes/authRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

dotenv.config();

const app = express();

// Trust proxy configuration for Cloud Run (1 hop)
// Cloud Run sets X-Forwarded-For, X-Forwarded-Proto, etc.
app.set('trust proxy', 1);

// Expose db via app locals for controllers that require direct access (not recommended but convenient here)
app.locals.db = db;

// Security middleware
app.use(helmet());

// Enable CORS with frontend origin from env (default to open for MVP)
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({ 
  origin: corsOrigin === '*' ? true : corsOrigin, 
  credentials: corsOrigin === '*' ? false : true 
}));

// Logging
app.use(morgan('combined'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health endpoints (no auth, no rate limit)
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/readyz', async (req, res) => {
  try {
    if (db.raw) {
      await db.raw('select 1');
    } else if (db.query) {
      await db.query('select 1');
    }
    return res.status(200).json({ ready: true });
  } catch (e) {
    return res.status(500).json({ ready: false });
  }
});

// Rate limiter for all requests (basic)
app.use(apiLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/trades', tradeRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`NexoSwap backend listening on port ${port}`);
});
