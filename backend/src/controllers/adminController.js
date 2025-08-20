import db from '../config/database.js';
import { listTrades as listTradesModel, updateTradeState } from '../models/tradeModel.js';

// List users with pagination and search
export async function listUsers(req, res) {
  try {
    const { limit = 20, offset = 0, search } = req.query;
    const query = db('users').select('id', 'name', 'email', 'lifetime_volume_usd', 'role', 'created_at');
    if (search) {
      query.whereILike('email', `%${search}%`).orWhereILike('name', `%${search}%`);
    }
    const users = await query.limit(limit).offset(offset);
    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
}

// List trades with optional filters. Only accessible by admins
export async function listTrades(req, res) {
  try {
    const { state, user_id, limit, offset } = req.query;
    const trades = await listTradesModel({ state, user_id, limit, offset });
    return res.json({ trades });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to fetch trades' });
  }
}

// Mark fiat payment received for a trade. If the fiat amount is > $500 then require an "otp" field.
export async function markReceived(req, res) {
  try {
    const tradeId = req.params.id;
    const trade = await db('trades').where({ id: tradeId }).first();
    if (!trade) return res.status(404).json({ message: 'Trade not found' });
    // Determine if manual fiat
    const amount = parseFloat(trade.amount_fiat || 0);
    if (amount > 500 && !req.body.otp) {
      return res.status(400).json({ message: 'OTP required for amounts over $500' });
    }
    await updateTradeState(tradeId, 'admin', req.user.id, 'COMPLETED', 'Fiat received', req.ip);
    return res.json({ message: 'Trade marked as completed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to update trade' });
  }
}