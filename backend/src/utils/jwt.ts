import { config } from '../config/env.js';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

// Generate access token

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET as string, {
    expiresIn: config.JWT_EXPIRE_IN as SignOptions['expiresIn'],
  });
}

// Generate refresh token

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET as string, {
    expiresIn: config.JWT_REFRESH_EXPIRE_IN as SignOptions['expiresIn'],
  });
}

// Verify access token
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return null;
  }
}

// Decode token without verification (for debugging)
export function decodeToken(token: string): DecodedToken | null {
  try {
    const decoded = jwt.decode(token) as DecodedToken;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Generate both tokens
export function generateTokenPair(payload: TokenPayload) {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export default {
  generateToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  generateTokenPair,
};