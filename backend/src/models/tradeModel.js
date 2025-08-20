import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new trade. Adds an audit log entry for the initiated state.
 *
 * @param {Object} trade – trade details including user_id, from_currency, to_currency,
 *        amount_crypto, amount_fiat, fiat_method.
 * @returns {Promise<Object>} inserted trade row.
 */
export async function createTrade(trade) {
  const id = uuidv4();
  const now = new Date();
  const trx = await db.transaction();
  try {
    const [row] = await trx('trades')
      .insert({
        id,
        user_id: trade.user_id,
        from_currency: trade.from_currency,
        to_currency: trade.to_currency,
        amount_crypto: trade.amount_crypto,
        amount_fiat: trade.amount_fiat,
        fiat_method: trade.fiat_method,
        state: 'INITIATED',
        fee_usd: trade.fee_usd
      })
      .returning('*');
    // Insert audit log
    await trx('audit_logs').insert({
      id: uuidv4(),
      trade_id: id,
      actor_type: 'user',
      actor_id: trade.user_id,
      ip: trade.ip || null,
      reason: 'Trade created',
      prev_state: null,
      next_state: 'INITIATED'
    });
    await trx.commit();
    return row;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Update trade state and write audit log.
 */
export async function updateTradeState(tradeId, actorType, actorId, nextState, reason, ip) {
  const trx = await db.transaction();
  try {
    const trade = await trx('trades').where({ id: tradeId }).first();
    if (!trade) throw new Error('Trade not found');
    const prevState = trade.state;
    await trx('trades').where({ id: tradeId }).update({ state: nextState });
    await trx('audit_logs').insert({
      id: uuidv4(),
      trade_id: tradeId,
      actor_type: actorType,
      actor_id: actorId,
      ip: ip || null,
      reason,
      prev_state: prevState,
      next_state: nextState
    });
    await trx.commit();
    return nextState;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Get trade by ID.
 */
export async function getTradeById(id) {
  return db('trades').where({ id }).first();
}

/**
 * List trades for a user or all if admin.
 */
export async function listTrades(options = {}) {
  const query = db('trades');
  if (options.user_id) {
    query.where({ user_id: options.user_id });
  }
  if (options.state) {
    query.where({ state: options.state });
  }
  if (options.limit) {
    query.limit(options.limit);
  }
  if (options.offset) {
    query.offset(options.offset);
  }
  return query.orderBy('created_at', 'desc');
}