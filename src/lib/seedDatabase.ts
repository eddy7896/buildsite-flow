// Database Seeder - Initializes default data for the application

const SEED_VERSION = '1.0.0';
const SEED_KEY = 'buildflow_db_seeded';

export function initializeSeedData(): void {
  // Check if already seeded
  const seeded = localStorage.getItem(SEED_KEY);
  if (seeded === SEED_VERSION) {
    console.log('[DB] Database already seeded');
    return;
  }

  console.log('[DB] Seeding initial data...');
  
  try {
    // Get existing data or create new
    const existingData = localStorage.getItem('buildflow_db');
    const db = existingData ? JSON.parse(existingData) : {};

    // Seed agencies
    if (!db.agencies || db.agencies.length === 0) {
      db.agencies = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'BuildFlow Demo Agency',
          domain: 'buildflow.local',
          is_active: true,
          subscription_plan: 'enterprise',
          max_users: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
    }

    // Seed users (mock users for testing)
    if (!db.users || db.users.length === 0) {
      db.users = [
        { id: '550e8400-e29b-41d4-a716-446655440010', email: 'super@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440011', email: 'admin@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440012', email: 'hr@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440013', email: 'finance@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
        { id: '550e8400-e29b-41d4-a716-446655440014', email: 'employee@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: new Date().toISOString() },
      ];
    }

    // Seed profiles
    if (!db.profiles || db.profiles.length === 0) {
      db.profiles = [
        { id: 'p1', user_id: '550e8400-e29b-41d4-a716-446655440010', full_name: 'Super Administrator', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', department: 'Management', position: 'Super Admin', created_at: new Date().toISOString() },
        { id: 'p2', user_id: '550e8400-e29b-41d4-a716-446655440011', full_name: 'System Administrator', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', department: 'IT', position: 'Admin', created_at: new Date().toISOString() },
        { id: 'p3', user_id: '550e8400-e29b-41d4-a716-446655440012', full_name: 'HR Manager', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', department: 'Human Resources', position: 'HR Manager', created_at: new Date().toISOString() },
        { id: 'p4', user_id: '550e8400-e29b-41d4-a716-446655440013', full_name: 'Finance Manager', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', department: 'Finance', position: 'Finance Manager', created_at: new Date().toISOString() },
        { id: 'p5', user_id: '550e8400-e29b-41d4-a716-446655440014', full_name: 'John Employee', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', department: 'Development', position: 'Developer', created_at: new Date().toISOString() },
      ];
    }

    // Seed user roles
    if (!db.user_roles || db.user_roles.length === 0) {
      db.user_roles = [
        { id: 'r1', user_id: '550e8400-e29b-41d4-a716-446655440010', role: 'super_admin', agency_id: '550e8400-e29b-41d4-a716-446655440000', assigned_at: new Date().toISOString() },
        { id: 'r2', user_id: '550e8400-e29b-41d4-a716-446655440011', role: 'admin', agency_id: '550e8400-e29b-41d4-a716-446655440000', assigned_at: new Date().toISOString() },
        { id: 'r3', user_id: '550e8400-e29b-41d4-a716-446655440012', role: 'hr', agency_id: '550e8400-e29b-41d4-a716-446655440000', assigned_at: new Date().toISOString() },
        { id: 'r4', user_id: '550e8400-e29b-41d4-a716-446655440013', role: 'finance_manager', agency_id: '550e8400-e29b-41d4-a716-446655440000', assigned_at: new Date().toISOString() },
        { id: 'r5', user_id: '550e8400-e29b-41d4-a716-446655440014', role: 'employee', agency_id: '550e8400-e29b-41d4-a716-446655440000', assigned_at: new Date().toISOString() },
      ];
    }

    // Seed departments
    if (!db.departments || db.departments.length === 0) {
      db.departments = [
        { id: 'd1', name: 'Management', description: 'Executive Management Team', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'd2', name: 'Human Resources', description: 'HR and People Operations', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'd3', name: 'Finance', description: 'Finance and Accounting', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'd4', name: 'Development', description: 'Software Development', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'd5', name: 'Sales', description: 'Sales and Business Development', is_active: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
      ];
    }

    // Seed clients
    if (!db.clients || db.clients.length === 0) {
      db.clients = [
        { id: 'c1', client_number: 'CLI-001', name: 'Acme Corporation', company_name: 'Acme Corp', email: 'contact@acme.com', phone: '+1234567890', status: 'active', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'c2', client_number: 'CLI-002', name: 'TechStart Inc', company_name: 'TechStart', email: 'hello@techstart.io', phone: '+0987654321', status: 'active', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'c3', client_number: 'CLI-003', name: 'Global Services Ltd', company_name: 'Global Services', email: 'info@globalservices.com', phone: '+1122334455', status: 'active', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
      ];
    }

    // Seed projects
    if (!db.projects || db.projects.length === 0) {
      db.projects = [
        { id: 'proj1', name: 'Website Redesign', description: 'Complete website overhaul', status: 'in_progress', progress: 65, client_id: 'c1', budget: 50000, start_date: '2024-01-15', end_date: '2024-06-15', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'proj2', name: 'Mobile App Development', description: 'iOS and Android app', status: 'planning', progress: 10, client_id: 'c2', budget: 120000, start_date: '2024-03-01', end_date: '2024-12-31', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'proj3', name: 'CRM Integration', description: 'Salesforce integration project', status: 'completed', progress: 100, client_id: 'c3', budget: 35000, start_date: '2023-10-01', end_date: '2024-01-30', created_by: '550e8400-e29b-41d4-a716-446655440011', agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
      ];
    }

    // Seed leave types
    if (!db.leave_types || db.leave_types.length === 0) {
      db.leave_types = [
        { id: 'lt1', name: 'Annual Leave', description: 'Paid annual vacation days', max_days: 20, is_paid: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'lt2', name: 'Sick Leave', description: 'Medical leave', max_days: 10, is_paid: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'lt3', name: 'Personal Leave', description: 'Personal time off', max_days: 5, is_paid: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'lt4', name: 'Unpaid Leave', description: 'Leave without pay', max_days: 30, is_paid: false, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
      ];
    }

    // Seed holidays
    if (!db.holidays || db.holidays.length === 0) {
      db.holidays = [
        { id: 'h1', name: 'New Year Day', date: '2025-01-01', is_mandatory: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'h2', name: 'Independence Day', date: '2025-08-15', is_mandatory: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
        { id: 'h3', name: 'Christmas', date: '2025-12-25', is_mandatory: true, agency_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString() },
      ];
    }

    // Save to localStorage
    localStorage.setItem('buildflow_db', JSON.stringify(db));
    localStorage.setItem(SEED_KEY, SEED_VERSION);
    
    console.log('[DB] Seed data initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to seed database:', error);
  }
}

// Clear database (for development/testing)
export function clearDatabase(): void {
  localStorage.removeItem('buildflow_db');
  localStorage.removeItem(SEED_KEY);
  console.log('[DB] Database cleared');
}

// Reset database to seed state
export function resetDatabase(): void {
  clearDatabase();
  initializeSeedData();
  console.log('[DB] Database reset to initial state');
}

