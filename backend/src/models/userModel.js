import db from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new user and corresponding auth credentials.
 *
 * @param {Object} userData – Object containing name, email, address, passwordHash and optional role.
 * @returns {Promise<Object>} Created user record (without password hash).
 */
export async function createUser(userData) {
  const trx = await db.transaction();
  try {
    const id = uuidv4();
    const role = userData.role || 'user';
    const [user] = await trx('users')
      .insert({ id, name: userData.name, email: userData.email, address: userData.address, role })
      .returning(['id', 'name', 'email', 'address', 'role', 'created_at']);
    await trx('auth_credentials').insert({ id: uuidv4(), user_id: id, password_hash: userData.passwordHash });
    await trx.commit();
    return user;
  } catch (err) {
    await trx.rollback();
    throw err;
  }
}

/**
 * Fetch a user by email.
 *
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function getUserByEmail(email) {
  const user = await db('users').where({ email, deleted_at: null }).first();
  return user || null;
}

/**
 * Fetch a user by id.
 *
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getUserById(id) {
  const user = await db('users').where({ id, deleted_at: null }).first();
  return user || null;
}

/**
 * Fetch password hash for a user.
 */
export async function getPasswordHashByUserId(userId) {
  const cred = await db('auth_credentials').where({ user_id: userId }).first();
  return cred ? cred.password_hash : null;
}

/**
 * Update lifetime_volume_usd for a user by incrementing with amount.
 */
export async function incrementLifetimeVolume(userId, amount) {
  await db('users').where({ id: userId }).increment('lifetime_volume_usd', amount);
}

/**
 * Create or update ID verification record.
 */
export async function createVerification(userId, type, provider, status, resultJson) {
  await db('verifications').insert({
    id: uuidv4(),
    user_id: userId,
    type,
    provider,
    status,
    result_json: JSON.stringify(resultJson)
  });
}