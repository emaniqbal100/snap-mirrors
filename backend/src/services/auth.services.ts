import { query } from '../config/database.js';
import { findUserByEmail, findUserById, User } from '../models/User.js';
import { comparePassword } from '../utils/helpers.js';
import { generateTokenPair, verifyRefreshToken, TokenPayload } from '../utils/jwt.js';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function loginAdmin(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user || user.role !== 'admin') {
    throw new AuthError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new AuthError('Account is disabled');
  }

  const isValidPassword = await comparePassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new AuthError('Invalid email or password');
  }

  const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = generateTokenPair(payload);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // matches JWT_REFRESH_EXPIRE_IN default

  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokens.refreshToken, expiresAt]
  );

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    ...tokens,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new AuthError('Invalid or expired refresh token');
  }

  // Check token exists in DB (not revoked)
  const result = await query(
    `SELECT * FROM refresh_tokens WHERE token = $1 AND user_id = $2 AND expires_at > NOW()`,
    [refreshToken, decoded.id]
  );

  if (result.rows.length === 0) {
    throw new AuthError('Refresh token revoked or expired');
  }

  const user = await findUserById(decoded.id);
  if (!user || !user.is_active) {
    throw new AuthError('User not found or inactive');
  }

  const payload: TokenPayload = { id: user.id, email: user.email, role: user.role };
  const tokens = generateTokenPair(payload);

  // Rotate: remove old refresh token, insert new one
  await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, tokens.refreshToken, expiresAt]
  );

  return tokens;
}

export async function logoutAdmin(refreshToken: string) {
  await query(`DELETE FROM refresh_tokens WHERE token = $1`, [refreshToken]);
}

export default { loginAdmin, refreshAccessToken, logoutAdmin, AuthError };