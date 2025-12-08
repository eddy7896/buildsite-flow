// Simple Express API server to connect frontend to PostgreSQL
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
// Increase JSON payload limit to 50MB to accommodate base64 encoded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// File serving endpoint
app.get('/api/files/:bucket/:path(*)', async (req, res) => {
  try {
    const { bucket, path } = req.params;
    
    // Query file_storage table to get file metadata
    const fileResult = await pool.query(
      `SELECT file_path, mime_type, file_size 
       FROM public.file_storage 
       WHERE bucket_name = $1 AND file_path = $2`,
      [bucket, `${bucket}/${path}`]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = fileResult.rows[0];
    
    // For now, if file exists in database but not on disk, return 404
    // In production, you would read from disk/S3 here
    res.status(404).json({ 
      error: 'File storage not fully implemented. Using base64 URLs for now.',
      note: 'Avatar images should be stored as base64 data URLs in the database'
    });
  } catch (error) {
    console.error('[API] File serving error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Transaction endpoint for multiple queries
app.post('/api/database/transaction', async (req, res) => {
  try {
    const { queries = [], userId } = req.body;
    
    if (!Array.isArray(queries) || queries.length === 0) {
      return res.status(400).json({ error: 'Queries array is required' });
    }

    console.log('[API] Executing transaction with', queries.length, 'queries');
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Set user context if provided
      if (userId) {
        const escapedUserId = userId.replace(/'/g, "''");
        await client.query(`SET LOCAL app.current_user_id = '${escapedUserId}'`);
      }
      
      const results = [];
      for (const { sql, params = [] } of queries) {
        const trimmedSql = sql.trim();
        console.log('[API] Transaction query:', trimmedSql.substring(0, 100));
        const result = await client.query(trimmedSql, params);
        results.push({
          rows: result.rows,
          rowCount: result.rowCount,
        });
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        results,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[API] Transaction error:', error);
      res.status(500).json({ 
        error: error.message,
        detail: error.detail,
        code: error.code
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[API] Transaction setup error:', error);
    res.status(500).json({ 
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

