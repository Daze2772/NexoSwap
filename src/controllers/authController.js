import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { createUser, getUserByEmail, getPasswordHashByUserId } from '../models/userModel.js';
import { createRefreshToken, revokeRefreshToken } from '../models/authModel.js';
import db from '../config/database.js';

dotenv.config();

// Helper to generate JWT access token
function generateAccessToken(user) {
  const data = { id: user.id, role: user.role };
  return jwt.sign({ data }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' });
}

// Helper to generate refresh token (random string) and store hashed version
async function generateRefreshToken(userId) {
  const rawToken = uuidv4() + uuidv4();
  const tokenHash = await argon2.hash(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days default
  await createRefreshToken(userId, tokenHash, expiresAt);
  return { rawToken, expiresAt };
}

export async function register(req, res) {
  try {
    const { name, email, address, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const passwordHash = await argon2.hash(password);
    const user = await createUser({ name, email, address, passwordHash });
    const accessToken = generateAccessToken(user);
    const { rawToken, expiresAt } = await generateRefreshToken(user.id);
    return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken: rawToken, refreshExpiresAt: expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const hash = await getPasswordHashByUserId(user.id);
    const valid = await argon2.verify(hash, password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken(user);
    const { rawToken, expiresAt } = await generateRefreshToken(user.id);
    return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, accessToken, refreshToken: rawToken, refreshExpiresAt: expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Login failed' });
  }
}

export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Missing refresh token' });
    }
    // Search for token in DB by iterating through tokens. In production you would store a token id (jti) in the JWT payload or use a lookup table.
    const tokens = await db('refresh_tokens').where({ revoked_at: null });
    let tokenRecord = null;
    for (const t of tokens) {
      if (await argon2.verify(t.token_hash, refreshToken)) {
        tokenRecord = t;
        break;
      }
    }
    if (!tokenRecord) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (new Date(tokenRecord.expires_at) < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    // revoke old token
    await revokeRefreshToken(tokenRecord.id);
    // generate new tokens
    const userId = tokenRecord.user_id;
    const user = await db('users').where({ id: userId }).first();
    const accessToken = generateAccessToken(user);
    const { rawToken: newRefresh, expiresAt } = await generateRefreshToken(userId);
    return res.json({ accessToken, refreshToken: newRefresh, refreshExpiresAt: expiresAt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Refresh failed' });
  }
}