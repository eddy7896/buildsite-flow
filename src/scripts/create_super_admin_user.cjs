/**
 * Script to create super admin user in main database
 * Creates user, profile, and assigns super_admin role with agency_id = NULL
 */

const { Pool } = require('pg');
const { parseDatabaseUrl } = require('../server/utils/poolManager');

async function createSuperAdminUser() {
  const dbConfig = parseDatabaseUrl();
  const mainPool = new Pool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: 'buildflow_db',
  });

  const email = process.env.SUPER_ADMIN_EMAIL || 'super@buildflow.local';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'super123';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  try {
    console.log('🔧 Creating super admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}\n`);

    const client = await mainPool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Check if user already exists
      const userCheck = await client.query(
        'SELECT id FROM public.users WHERE email = $1',
        [email]
      );

      let userId;
      if (userCheck.rows.length > 0) {
        userId = userCheck.rows[0].id;
        console.log('   ℹ️  User already exists, updating...');
        
        // Update user (using pgcrypto for password hashing)
        await client.query(`
          UPDATE public.users 
          SET password_hash = crypt($1, gen_salt('bf')), 
              email_confirmed = true, 
              email_confirmed_at = NOW(),
              is_active = true,
              updated_at = NOW()
          WHERE id = $2
        `, [password, userId]);
      } else {
        // Create new user (using pgcrypto for password hashing)
        const userResult = await client.query(`
          INSERT INTO public.users (email, password_hash, email_confirmed, email_confirmed_at, is_active)
          VALUES ($1, crypt($2, gen_salt('bf')), true, NOW(), true)
          RETURNING id
        `, [email, password]);
        
        userId = userResult.rows[0].id;
        console.log('   ✅ User created');
      }

      // Create or update profile
      const profileCheck = await client.query(
        'SELECT id FROM public.profiles WHERE user_id = $1',
        [userId]
      );

      if (profileCheck.rows.length > 0) {
        await client.query(`
          UPDATE public.profiles 
          SET full_name = $1, is_active = true, updated_at = NOW()
          WHERE user_id = $2
        `, [name, userId]);
        console.log('   ✅ Profile updated');
      } else {
        await client.query(`
          INSERT INTO public.profiles (user_id, full_name, is_active)
          VALUES ($1, $2, true)
        `, [userId, name]);
        console.log('   ✅ Profile created');
      }

      // Disable audit trigger temporarily
      await client.query('ALTER TABLE public.user_roles DISABLE TRIGGER ALL');

      try {
        // Check if role already exists
        const roleCheck = await client.query(`
          SELECT id FROM public.user_roles 
          WHERE user_id = $1 AND role = 'super_admin' AND agency_id IS NULL
        `, [userId]);

        if (roleCheck.rows.length === 0) {
          // Assign super_admin role with agency_id = NULL
          await client.query(`
            INSERT INTO public.user_roles (user_id, role, agency_id)
            VALUES ($1, 'super_admin'::public.app_role, NULL)
            ON CONFLICT (user_id, role, agency_id) DO NOTHING
          `, [userId]);
          console.log('   ✅ Super admin role assigned (agency_id = NULL)');
        } else {
          console.log('   ✅ Super admin role already exists');
        }

        // Remove any super_admin roles with agency_id set (should not exist)
        const cleanupResult = await client.query(`
          DELETE FROM public.user_roles 
          WHERE user_id = $1 AND role = 'super_admin' AND agency_id IS NOT NULL
        `, [userId]);
        
        if (cleanupResult.rowCount > 0) {
          console.log(`   ✅ Cleaned up ${cleanupResult.rowCount} invalid super_admin role(s)`);
        }

      } finally {
        // Re-enable audit trigger
        await client.query('ALTER TABLE public.user_roles ENABLE TRIGGER ALL');
      }

      // Commit transaction
      await client.query('COMMIT');

      console.log('\n✅ Super admin user created successfully!');
      console.log(`\n📋 Login Credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log(`\n⚠️  Please change the password after first login!`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mainPool.end();
  }
}

// Run the script
if (require.main === module) {
  createSuperAdminUser()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createSuperAdminUser };

