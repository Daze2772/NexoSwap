import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Insert a new refresh token record. The token should be hashed prior to
 * calling this function (e.g., using argon2.hash()).
 *
 * @param {string} userId
 * @param {string} tokenHash
 * @param {Date} expiresAt
 */
export async function createRefreshToken(userId, tokenHash, expiresAt) {
  await db('refresh_tokens').insert({ id: uuidv4(), user_id: userId, token_hash: tokenHash, expires_at: expiresAt });
}

/**
 * Find a refresh token record by user_id. Optionally filter by token_hash.
 */
export async function findRefreshToken(userId, tokenHash) {
  if (tokenHash) {
    return db('refresh_tokens').where({ user_id: userId, token_hash: tokenHash, revoked_at: null }).first();
  }
  return db('refresh_tokens').where({ user_id: userId, revoked_at: null }).orderBy('created_at', 'desc').first();
}

/**
 * Revoke a refresh token by id.
 */
export async function revokeRefreshToken(id) {
  await db('refresh_tokens').where({ id }).update({ revoked_at: new Date() });
}