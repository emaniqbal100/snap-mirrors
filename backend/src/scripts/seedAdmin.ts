import { pool } from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// 🔧 CHANGE THESE VALUES before running
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@snapmirror.com';
const ADMIN_PASSWORD = 'Testing123!';

async function seedAdmin() {
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [ADMIN_EMAIL]);
    if (existing.rows.length > 0) {
      console.log('⚠️  Admin with this email already exists. Skipping.');
      process.exit(0);
    }

    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       RETURNING id, name, email, role`,
      [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
    );

    console.log('✅ Admin created successfully:');
    console.log(result.rows[0]);
    console.log(`\n🔑 Login with:\n   Email: ${ADMIN_EMAIL}\n   Password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();
