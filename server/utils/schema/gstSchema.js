/**
 * GST Compliance Schema
 * 
 * Manages:
 * - gst_settings: GST configuration and settings
 * - gst_returns: GST return filing records
 * - gst_transactions: GST transaction records
 * 
 * Dependencies:
 * - users (for created_by and filed_by references)
 * - invoices (for invoice_id reference in gst_transactions)
 */

/**
 * Ensure gst_settings table exists
 */
async function ensureGstSettingsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.gst_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      gst_number TEXT UNIQUE,
      registration_type TEXT,
      tax_rate NUMERIC(5, 2) DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      settings JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure gst_returns table exists
 */
async function ensureGstReturnsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.gst_returns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      return_period TEXT NOT NULL,
      filing_date DATE,
      gst_liability NUMERIC(15, 2) DEFAULT 0,
      gst_paid NUMERIC(15, 2) DEFAULT 0,
      status TEXT DEFAULT 'draft',
      filed_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure gst_transactions table exists
 */
async function ensureGstTransactionsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.gst_transactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      transaction_date DATE NOT NULL,
      transaction_type TEXT NOT NULL,
      invoice_id UUID REFERENCES public.invoices(id),
      gst_amount NUMERIC(15, 2) DEFAULT 0,
      taxable_amount NUMERIC(15, 2) DEFAULT 0,
      hsn_sac_code TEXT,
      description TEXT,
      created_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure all GST tables
 */
async function ensureGstSchema(client) {
  console.log('[SQL] Ensuring GST schema...');
  
  await ensureGstSettingsTable(client);
  await ensureGstReturnsTable(client);
  await ensureGstTransactionsTable(client);
  
  console.log('[SQL] ✅ GST schema ensured');
}

module.exports = {
  ensureGstSchema,
  ensureGstSettingsTable,
  ensureGstReturnsTable,
  ensureGstTransactionsTable,
};
