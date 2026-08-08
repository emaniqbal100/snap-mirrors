
import { query } from '../config/database.js';

export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: 'customer' | 'admin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await query('SELECT * FROM users WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createUser(data: {
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  role?: 'customer' | 'admin';
}): Promise<User> {
  const result = await query(
    `INSERT INTO users (name, email, password_hash, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.name, data.email, data.password_hash, data.phone || null, data.role || 'admin']
  );
  return result.rows[0];
}
export async function findAllAdmins(): Promise<User[]> {
  const result = await query(
    `SELECT id, name, email, role, is_active, created_at FROM users WHERE role = 'admin' ORDER BY created_at DESC`
  );
  return result.rows;
}

export async function updateUserActiveStatus(id: number, isActive: boolean): Promise<User | null> {
  const result = await query(
    `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, is_active`,
    [isActive, id]
  );
  return result.rows[0] || null;
}
export default { findUserByEmail, findUserById, createUser, findAllAdmins, updateUserActiveStatus };