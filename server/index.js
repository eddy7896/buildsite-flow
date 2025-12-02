// Simple Express API server to connect frontend to PostgreSQL
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Parse database URL from environment or use defaults
// Database: buildflow_db, Password: admin
const DATABASE_URL = process.env.DATABASE_URL || 
  process.env.VITE_DATABASE_URL ||
  'postgresql://postgres:admin@localhost:5432/buildflow_db';

console.log('Connecting to database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Database query endpoint
app.post('/api/database/query', async (req, res) => {
  try {
    const { sql, params = [], userId } = req.body;
    
    if (!sql) {
      return res.status(400).json({ error: 'SQL query is required' });
    }

    console.log('[API] Executing query:', sql.substring(0, 100));
    
    let result;
    
    // If userId is provided, set the context in a transaction
    if (userId) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Set the user context for audit logs
        // Escape single quotes in userId (UUID format is safe, but be defensive)
        const escapedUserId = userId.replace(/'/g, "''");
        await client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);
        
        // Execute the actual query
        const trimmedSql = sql.trim();
        console.log('[API] Executing query with userId context:', trimmedSql.substring(0, 150));
        console.log('[API] Query params:', params);
        
        result = await client.query(trimmedSql, params);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('[API] Transaction error:', error);
        throw error;
      } finally {
        client.release();
      }
    } else {
      // Execute query without transaction
      result = await pool.query(sql.trim(), params);
    }
    
    res.json({
      rows: result.rows,
      rowCount: result.rowCount,
    });
  } catch (error) {
    console.error('[API] Query error:', error);
    res.status(500).json({ 
      error: error.message,
      detail: error.detail,
      code: error.code
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${DATABASE_URL.split('@')[1]}`);
});

