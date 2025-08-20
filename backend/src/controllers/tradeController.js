import { calculateFee } from '../utils/fees.js';
import { createTrade, getTradeById, listTrades, updateTradeState } from '../models/tradeModel.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';

// Configure file uploads for proof. Files are stored in UPLOAD_DIR env variable.
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  }
});
export const upload = multer({ storage });

/**
 * Create a new trade. Expects body with to_currency, from_currency and amounts.
 */
export async function create(req, res) {
  try {
    const { from_currency, to_currency, amount_crypto, amount_fiat, fiat_method } = req.body;
    if (!from_currency || !to_currency || (!amount_crypto && !amount_fiat)) {
      return res.status(400).json({ message: 'Missing trade parameters' });
    }
    // Determine fiat amount for fee calculation. If amount_fiat given, use it; else you could calculate using FX rates (mocked here).
    const fiatAmount = parseFloat(amount_fiat || 0);
    const fee_usd = calculateFee(fiatAmount);
    const trade = await createTrade({
      user_id: req.user.id,
      from_currency,
      to_currency,
      amount_crypto: amount_crypto || null,
      amount_fiat: fiatAmount,
      fiat_method,
      fee_usd,
      ip: req.ip
    });
    // Increment user's lifetime volume and check compliance thresholds
    await db('users').where({ id: req.user.id }).increment('lifetime_volume_usd', fiatAmount);
    // Response
    return res.status(201).json({ trade });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Trade creation failed' });
  }
}

/**
 * List trades for the authenticated user.
 */
export async function list(req, res) {
  try {
    const userId = req.user.id;
    const trades = await listTrades({ user_id: userId });
    return res.json({ trades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch trades' });
  }
}

/**
 * Upload proof of fiat payment (manual fiat methods). Accepts multipart/form-data
 * with file field named "proof". Stores file and links it to trade.
 */
export async function uploadProof(req, res) {
  try {
    const tradeId = req.params.id;
    const trade = await getTradeById(tradeId);
    if (!trade || trade.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Trade not found' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No proof file uploaded' });
    }
    // Save file record
    await db('files').insert({ id: uuidv4(), user_id: req.user.id, trade_id: tradeId, filename: req.file.filename, filepath: req.file.path });
    // Transition trade to AWAITING_REVIEW state
    await updateTradeState(tradeId, 'user', req.user.id, 'UNDER_REVIEW', 'Proof uploaded', req.ip);
    return res.json({ message: 'Proof uploaded' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to upload proof' });
  }
}