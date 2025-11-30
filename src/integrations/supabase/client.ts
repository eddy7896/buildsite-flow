// Supabase Compatibility Layer
// This file provides backwards compatibility for components still using Supabase imports
// It wraps our PostgreSQL/localStorage database to provide a Supabase-like API

import { db } from '@/lib/database';

// Re-export the database interface as 'supabase' for compatibility
export const supabase = db;

export default supabase;

