// ============================================================================
// Hash Passwords for TechStream Solutions
// ============================================================================
// This script updates all user passwords in the database with bcrypt hashes
// Run this AFTER running seed_new_company.sql
// ============================================================================

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'buildflow_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

const DEFAULT_PASSWORD = 'password123';

async function hashAllPasswords() {
  const client = await pool.connect();
  
  try {
    console.log('🔐 Hashing passwords for all users...');
    console.log('');
    
    // Get all users with plain text passwords (password123)
    const result = await client.query(
      `SELECT id, email FROM public.users WHERE password_hash = $1 OR password_hash IS NULL`,
      [DEFAULT_PASSWORD]
    );
    
    if (result.rows.length === 0) {
      console.log('✅ No users found with plain text passwords.');
      console.log('   All passwords are already hashed.');
      return;
    }
    
    console.log(`📋 Found ${result.rows.length} users to update`);
    console.log('');
    
    // Hash the default password once
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log(`🔑 Generated bcrypt hash for password: "${DEFAULT_PASSWORD}"`);
    console.log('');
    
    // Update all users
    let updated = 0;
    for (const user of result.rows) {
      await client.query(
        `UPDATE public.users SET password_hash = $1 WHERE id = $2`,
        [hashedPassword, user.id]
      );
      updated++;
      console.log(`   ✓ Updated: ${user.email}`);
    }
    
    console.log('');
    console.log(`✅ Successfully updated ${updated} user passwords!`);
    console.log('');
    console.log('🔐 All users can now login with:');
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await hashAllPasswords();
    await pool.end();
    console.log('✅ Script completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
