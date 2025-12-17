/**
 * File Serving Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * GET /api/files/:bucket/:path(*)
 * File serving endpoint - queries file_storage table for file metadata
 */
router.get('/:bucket/:path(*)', asyncHandler(async (req, res) => {
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

    // For now, if file exists in database but not on disk, return 404
    // In production, you would read from disk/S3 here
    res.status(404).json({
      error: 'File storage not fully implemented. Using base64 URLs for now.',
      note: 'Avatar images should be stored as base64 data URLs in the database',
    });
  } catch (error) {
    console.error('[API] File serving error:', error);
    res.status(500).json({ error: error.message });
  }
}));

module.exports = router;
