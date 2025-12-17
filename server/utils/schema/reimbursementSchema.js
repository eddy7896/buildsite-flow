/**
 * Expense and Reimbursement Schema
 * 
 * Manages:
 * - expense_categories: Expense category definitions
 * - reimbursement_requests: Reimbursement request records
 * - reimbursement_attachments: Receipt and attachment files
 * - receipts: Receipt records
 * 
 * Dependencies:
 * - users (for user_id and created_by references)
 */

/**
 * Ensure expense_categories table exists
 */
async function ensureExpenseCategoriesTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.expense_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure reimbursement_requests table exists
 */
async function ensureReimbursementRequestsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.reimbursement_requests (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      request_number TEXT UNIQUE,
      user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
      category_id UUID REFERENCES public.expense_categories(id),
      amount NUMERIC(15, 2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      description TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      approved_by UUID REFERENCES public.users(id),
      approved_at TIMESTAMP WITH TIME ZONE,
      rejected_by UUID REFERENCES public.users(id),
      rejected_at TIMESTAMP WITH TIME ZONE,
      rejection_reason TEXT,
      paid_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure reimbursement_attachments table exists
 */
async function ensureReimbursementAttachmentsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.reimbursement_attachments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      reimbursement_request_id UUID NOT NULL REFERENCES public.reimbursement_requests(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size BIGINT,
      uploaded_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure receipts table exists
 */
async function ensureReceiptsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.receipts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      receipt_number TEXT UNIQUE,
      reimbursement_request_id UUID REFERENCES public.reimbursement_requests(id),
      category_id UUID REFERENCES public.expense_categories(id),
      amount NUMERIC(15, 2) NOT NULL,
      receipt_date DATE NOT NULL,
      merchant_name TEXT,
      description TEXT,
      file_path TEXT,
      file_name TEXT,
      uploaded_by UUID REFERENCES public.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
}

/**
 * Ensure all reimbursement tables
 */
async function ensureReimbursementSchema(client) {
  console.log('[SQL] Ensuring reimbursement schema...');
  
  await ensureExpenseCategoriesTable(client);
  await ensureReimbursementRequestsTable(client);
  await ensureReimbursementAttachmentsTable(client);
  await ensureReceiptsTable(client);
  
  console.log('[SQL] ✅ Reimbursement schema ensured');
}

module.exports = {
  ensureReimbursementSchema,
  ensureExpenseCategoriesTable,
  ensureReimbursementRequestsTable,
  ensureReimbursementAttachmentsTable,
  ensureReceiptsTable,
};
