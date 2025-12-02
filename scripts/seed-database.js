// Seed Database Script
// Runs the seed_initial_data.sql file to populate the database

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');
    console.log('📊 Database:', DATABASE_URL.split('@')[1]);
    
    // First, ensure the current_user_id() function exists
    console.log('🔧 Checking for required functions...');
    try {
      const fixFunctionPath = path.join(__dirname, 'fix-missing-function.sql');
      if (fs.existsSync(fixFunctionPath)) {
        const fixSQL = fs.readFileSync(fixFunctionPath, 'utf8');
        await client.query(fixSQL);
        console.log('✅ Fixed missing function');
      }
    } catch (error) {
      console.warn('⚠️  Could not fix function (may already exist):', error.message);
    }
    
    // Read the seed SQL file
    const seedFilePath = path.join(__dirname, '..', 'seed_initial_data.sql');
    const seedSQL = fs.readFileSync(seedFilePath, 'utf8');
    
    // Execute the seed SQL
    // First ensure the function exists and is accessible
    await client.query(`
      CREATE OR REPLACE FUNCTION public.current_user_id()
      RETURNS UUID
      LANGUAGE SQL
      STABLE
      SECURITY DEFINER
      AS $$
        SELECT COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'::UUID)
      $$;
    `);
    
    // Temporarily disable triggers that use current_user_id() during seeding
    await client.query('ALTER TABLE public.user_roles DISABLE TRIGGER ALL');
    await client.query('ALTER TABLE public.employee_details DISABLE TRIGGER ALL');
    await client.query('ALTER TABLE public.employee_salary_details DISABLE TRIGGER ALL');
    
    await client.query('BEGIN');
    await client.query(seedSQL);
    await client.query('COMMIT');
    
    // Re-enable triggers
    await client.query('ALTER TABLE public.user_roles ENABLE TRIGGER ALL');
    await client.query('ALTER TABLE public.employee_details ENABLE TRIGGER ALL');
    await client.query('ALTER TABLE public.employee_salary_details ENABLE TRIGGER ALL');
    
    console.log('✅ Database seeded successfully!');
    console.log('📝 You can now start the application');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seed
seedDatabase();

