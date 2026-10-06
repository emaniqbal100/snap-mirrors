import { pool } from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'outflade@admin.com';
const ADMIN_PASSWORD = 'OUTflade__01';

async function seedAdmin() {
  try {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [ADMIN_EMAIL]
    );

    if (existing.rows.length > 0) {
      const result = await pool.query(
        `UPDATE users
         SET name = $1,
             password_hash = $2,
             role = 'admin',
             is_active = true,
             updated_at = NOW()
         WHERE email = $3
         RETURNING id, name, email, role, is_active`,
        [ADMIN_NAME, passwordHash, ADMIN_EMAIL]
      );

      console.log('✅ Existing admin updated successfully:');
      console.log(result.rows[0]);
    } else {
      const result = await pool.query(
        `INSERT INTO users
         (name, email, password_hash, role, is_active)
         VALUES ($1, $2, $3, 'admin', true)
         RETURNING id, name, email, role, is_active`,
        [ADMIN_NAME, ADMIN_EMAIL, passwordHash]
      );

      console.log('✅ Admin created successfully:');
      console.log(result.rows[0]);
    }

    console.log('\n🔑 Login with:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error);
    process.exit(1);
  }
}

seedAdmin();