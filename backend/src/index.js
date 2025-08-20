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

// Trust proxy configuration for Cloud Run
// Cloud Run sets X-Forwarded-For, X-Forwarded-Proto, etc.
app.set("trust proxy", true);

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
    // Check database connection
    await db.raw('SELECT 1');
    
    // Check if migrations have been run by looking for a key table
    const tables = await db.raw(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'trades')
    `);
    
    if (tables.rows.length < 2) {
      return res.status(503).json({ 
        ready: false, 
        message: 'Database migrations not completed' 
      });
    }
    
    res.json({ ready: true });
  } catch (err) {
    console.error('Readyz check failed:', err);
    res.status(500).json({ 
      ready: false, 
      error: err.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`NexoSwap backend listening on port ${port}`);
});
