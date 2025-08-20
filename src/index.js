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
app.set("trust proxy", 1);

// Expose db via app locals for controllers that require direct access (not recommended but convenient here)
app.locals.db = db;

// Security middleware
app.use(helmet());

// Enable CORS with allowlist from env
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: corsOrigins.length ? corsOrigins : '*', credentials: true }));

// Logging
app.use(morgan('combined'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for all requests (basic)
app.use(apiLimiter);

// Routes
app.use('/auth', authRoutes);
app.use('/trades', tradeRoutes);
app.use('/admin', adminRoutes);

// Health endpoints
app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
app.get('/readyz', async (req, res) => {
  try {
    // Simple DB check
    await db.raw('SELECT 1');
    res.json({ ready: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ready: false });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`NexoSwap backend listening on port ${port}`);
});
