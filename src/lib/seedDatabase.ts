// Comprehensive Database Seeder - All Tables with Realistic Data

const SEED_VERSION = '3.0.0';
const SEED_KEY = 'buildflow_db_seeded';

// Helper functions
const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const date = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};
const datetime = (daysOffset: number, hours = 9, minutes = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

// Agency IDs
const AGENCY_ID = '550e8400-e29b-41d4-a716-446655440000';
const AGENCY_2_ID = '550e8400-e29b-41d4-a716-446655440001';

// User IDs
const SUPER_ADMIN_ID = '550e8400-e29b-41d4-a716-446655440010';
const ADMIN_ID = '550e8400-e29b-41d4-a716-446655440011';
const HR_ID = '550e8400-e29b-41d4-a716-446655440012';
const FINANCE_ID = '550e8400-e29b-41d4-a716-446655440013';
const EMPLOYEE_1_ID = '550e8400-e29b-41d4-a716-446655440014';
const EMPLOYEE_2_ID = '550e8400-e29b-41d4-a716-446655440015';
const EMPLOYEE_3_ID = '550e8400-e29b-41d4-a716-446655440016';
const PM_ID = '550e8400-e29b-41d4-a716-446655440017';
const SALES_ID = '550e8400-e29b-41d4-a716-446655440018';
const DEV_LEAD_ID = '550e8400-e29b-41d4-a716-446655440019';

// NOTE: This file is deprecated. Use SQL seed files instead.
// Seed data should be loaded via SQL scripts (seed_initial_data.sql) using psql or the backend API.

export function initializeSeedData(): void {
  console.warn('[DB] initializeSeedData() is deprecated. Use SQL seed files instead.');
  // Seed data is now managed via PostgreSQL database using SQL scripts
  // Run: psql -U postgres -d buildflow_db -f seed_initial_data.sql
  // Or: npm run seed:db
}
    db.agencies = [
      {
        id: AGENCY_ID,
        name: 'TechBuild Solutions',
        domain: 'techbuild.local',
        is_active: true,
        subscription_plan: 'enterprise',
        max_users: 100,
        created_at: datetime(-365),
        updated_at: now()
      },
      {
        id: AGENCY_2_ID,
        name: 'ConstructPro Inc',
        domain: 'constructpro.local',
        is_active: true,
        subscription_plan: 'professional',
        max_users: 50,
        created_at: datetime(-180),
        updated_at: now()
      }
    ];

    db.agency_settings = [
      {
        id: uuid(),
        agency_id: AGENCY_ID,
        agency_name: 'TechBuild Solutions',
        logo_url: '/placeholder.svg',
        domain: 'techbuild.local',
        default_currency: 'IN',
        currency: 'INR',
        primary_color: '#3b82f6',
        secondary_color: '#1e40af',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        fiscal_year_start: '04-01',
        working_hours_start: '09:00',
        working_hours_end: '18:00',
        working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        created_at: datetime(-365),
        updated_at: now()
      }
    ];

    // ==================== USER PREFERENCES ====================
    db.user_preferences = [
      {
        id: uuid(),
        user_id: SUPER_ADMIN_ID,
        email_notifications: true,
        push_notifications: true,
        task_reminders: true,
        leave_notifications: true,
        payroll_notifications: true,
        project_updates: true,
        system_alerts: true,
        marketing_emails: false,
        created_at: datetime(-365),
        updated_at: now()
      },
      {
        id: uuid(),
        user_id: ADMIN_ID,
        email_notifications: true,
        push_notifications: false,
        task_reminders: true,
        leave_notifications: true,
        payroll_notifications: true,
        project_updates: true,
        system_alerts: true,
        marketing_emails: false,
        created_at: datetime(-360),
        updated_at: now()
      },
      {
        id: uuid(),
        user_id: HR_ID,
        email_notifications: true,
        push_notifications: true,
        task_reminders: true,
        leave_notifications: true,
        payroll_notifications: true,
        project_updates: true,
        system_alerts: true,
        marketing_emails: true,
        created_at: datetime(-350),
        updated_at: now()
      },
      {
        id: uuid(),
        user_id: FINANCE_ID,
        email_notifications: true,
        push_notifications: false,
        task_reminders: true,
        leave_notifications: false,
        payroll_notifications: true,
        project_updates: false,
        system_alerts: true,
        marketing_emails: false,
        created_at: datetime(-340),
        updated_at: now()
      },
      {
        id: uuid(),
        user_id: EMPLOYEE_1_ID,
        email_notifications: true,
        push_notifications: false,
        task_reminders: true,
        leave_notifications: true,
        payroll_notifications: true,
        project_updates: true,
        system_alerts: true,
        marketing_emails: false,
        created_at: datetime(-330),
        updated_at: now()
      }
    ];

    // ==================== USERS ====================
    db.users = [
      { id: SUPER_ADMIN_ID, email: 'super@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-365) },
      { id: ADMIN_ID, email: 'admin@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-360) },
      { id: HR_ID, email: 'hr@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-350) },
      { id: FINANCE_ID, email: 'finance@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-340) },
      { id: EMPLOYEE_1_ID, email: 'employee@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-330) },
      { id: EMPLOYEE_2_ID, email: 'sarah.johnson@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-320) },
      { id: EMPLOYEE_3_ID, email: 'mike.chen@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-310) },
      { id: PM_ID, email: 'pm@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-300) },
      { id: SALES_ID, email: 'sales@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-290) },
      { id: DEV_LEAD_ID, email: 'devlead@buildflow.local', password_hash: '$2a$10$hash', is_active: true, email_confirmed: true, created_at: datetime(-280) },
    ];

    // ==================== PROFILES ====================
    db.profiles = [
      { id: uuid(), user_id: SUPER_ADMIN_ID, full_name: 'Rajesh Kumar', phone: '+91 98765 43210', department: 'Management', position: 'CEO & Founder', hire_date: date(-365), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-365) },
      { id: uuid(), user_id: ADMIN_ID, full_name: 'Priya Sharma', phone: '+91 98765 43211', department: 'IT', position: 'System Administrator', hire_date: date(-360), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-360) },
      { id: uuid(), user_id: HR_ID, full_name: 'Anita Desai', phone: '+91 98765 43212', department: 'Human Resources', position: 'HR Director', hire_date: date(-350), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-350) },
      { id: uuid(), user_id: FINANCE_ID, full_name: 'Vikram Mehta', phone: '+91 98765 43213', department: 'Finance', position: 'CFO', hire_date: date(-340), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-340) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, full_name: 'Amit Patel', phone: '+91 98765 43214', department: 'Development', position: 'Senior Developer', hire_date: date(-330), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-330) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, full_name: 'Sarah Johnson', phone: '+91 98765 43215', department: 'Development', position: 'Full Stack Developer', hire_date: date(-320), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-320) },
      { id: uuid(), user_id: EMPLOYEE_3_ID, full_name: 'Mike Chen', phone: '+91 98765 43216', department: 'Development', position: 'Backend Developer', hire_date: date(-310), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-310) },
      { id: uuid(), user_id: PM_ID, full_name: 'David Rodriguez', phone: '+91 98765 43217', department: 'Project Management', position: 'Senior Project Manager', hire_date: date(-300), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-300) },
      { id: uuid(), user_id: SALES_ID, full_name: 'Lisa Thompson', phone: '+91 98765 43218', department: 'Sales', position: 'Sales Manager', hire_date: date(-290), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-290) },
      { id: uuid(), user_id: DEV_LEAD_ID, full_name: 'Alex Williams', phone: '+91 98765 43219', department: 'Development', position: 'Tech Lead', hire_date: date(-280), is_active: true, agency_id: AGENCY_ID, avatar_url: null, created_at: datetime(-280) },
    ];

    // ==================== USER ROLES ====================
    db.user_roles = [
      { id: uuid(), user_id: SUPER_ADMIN_ID, role: 'super_admin', agency_id: AGENCY_ID, assigned_at: datetime(-365) },
      { id: uuid(), user_id: ADMIN_ID, role: 'admin', agency_id: AGENCY_ID, assigned_at: datetime(-360) },
      { id: uuid(), user_id: HR_ID, role: 'hr', agency_id: AGENCY_ID, assigned_at: datetime(-350) },
      { id: uuid(), user_id: FINANCE_ID, role: 'finance_manager', agency_id: AGENCY_ID, assigned_at: datetime(-340) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, role: 'employee', agency_id: AGENCY_ID, assigned_at: datetime(-330) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, role: 'employee', agency_id: AGENCY_ID, assigned_at: datetime(-320) },
      { id: uuid(), user_id: EMPLOYEE_3_ID, role: 'employee', agency_id: AGENCY_ID, assigned_at: datetime(-310) },
      { id: uuid(), user_id: PM_ID, role: 'admin', agency_id: AGENCY_ID, assigned_at: datetime(-300) },
      { id: uuid(), user_id: SALES_ID, role: 'employee', agency_id: AGENCY_ID, assigned_at: datetime(-290) },
      { id: uuid(), user_id: DEV_LEAD_ID, role: 'admin', agency_id: AGENCY_ID, assigned_at: datetime(-280) },
    ];

    // ==================== DEPARTMENTS ====================
    const DEPT_MGMT = uuid();
    const DEPT_HR = uuid();
    const DEPT_FINANCE = uuid();
    const DEPT_DEV = uuid();
    const DEPT_SALES = uuid();
    const DEPT_PM = uuid();
    const DEPT_MARKETING = uuid();
    const DEPT_SUPPORT = uuid();

    db.departments = [
      { id: DEPT_MGMT, name: 'Executive Management', description: 'C-Suite and Executive Leadership', manager_id: SUPER_ADMIN_ID, budget: 5000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_HR, name: 'Human Resources', description: 'Employee Relations, Recruitment & Training', manager_id: HR_ID, budget: 1500000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_FINANCE, name: 'Finance & Accounting', description: 'Financial Operations, Budgeting & Reporting', manager_id: FINANCE_ID, budget: 2000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_DEV, name: 'Software Development', description: 'Product Development & Engineering', manager_id: DEV_LEAD_ID, budget: 8000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_SALES, name: 'Sales & Business Development', description: 'Client Acquisition & Revenue Growth', manager_id: SALES_ID, budget: 3000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_PM, name: 'Project Management', description: 'Project Delivery & Client Success', manager_id: PM_ID, budget: 2500000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_MARKETING, name: 'Marketing', description: 'Brand, Digital Marketing & Communications', manager_id: null, budget: 2000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: DEPT_SUPPORT, name: 'Customer Support', description: 'Client Support & Success', manager_id: null, budget: 1000000, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== TEAM ASSIGNMENTS ====================
    db.team_assignments = [
      { id: uuid(), user_id: SUPER_ADMIN_ID, department_id: DEPT_MGMT, position_title: 'CEO', role_in_department: 'manager', start_date: date(-365), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), user_id: ADMIN_ID, department_id: DEPT_DEV, position_title: 'System Administrator', role_in_department: 'lead', start_date: date(-360), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-360) },
      { id: uuid(), user_id: HR_ID, department_id: DEPT_HR, position_title: 'HR Director', role_in_department: 'manager', start_date: date(-350), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-350) },
      { id: uuid(), user_id: FINANCE_ID, department_id: DEPT_FINANCE, position_title: 'CFO', role_in_department: 'manager', start_date: date(-340), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-340) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, department_id: DEPT_DEV, position_title: 'Senior Developer', role_in_department: 'member', start_date: date(-330), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-330) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, department_id: DEPT_DEV, position_title: 'Full Stack Developer', role_in_department: 'member', start_date: date(-320), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-320) },
      { id: uuid(), user_id: EMPLOYEE_3_ID, department_id: DEPT_DEV, position_title: 'Backend Developer', role_in_department: 'member', start_date: date(-310), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-310) },
      { id: uuid(), user_id: PM_ID, department_id: DEPT_PM, position_title: 'Senior PM', role_in_department: 'manager', start_date: date(-300), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: SALES_ID, department_id: DEPT_SALES, position_title: 'Sales Manager', role_in_department: 'manager', start_date: date(-290), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-290) },
      { id: uuid(), user_id: DEV_LEAD_ID, department_id: DEPT_DEV, position_title: 'Tech Lead', role_in_department: 'lead', start_date: date(-280), is_active: true, agency_id: AGENCY_ID, created_at: datetime(-280) },
    ];

    // ==================== EMPLOYEE DETAILS ====================
    db.employee_details = [
      { id: uuid(), user_id: SUPER_ADMIN_ID, employee_id: 'EMP001', first_name: 'Rajesh', last_name: 'Kumar', date_of_birth: '1975-05-15', nationality: 'Indian', marital_status: 'Married', address: '123 MG Road, Mumbai, Maharashtra 400001', employment_type: 'full_time', work_location: 'Mumbai HQ', skills: ['Leadership', 'Strategy', 'Business Development'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), user_id: ADMIN_ID, employee_id: 'EMP002', first_name: 'Priya', last_name: 'Sharma', date_of_birth: '1988-08-22', nationality: 'Indian', marital_status: 'Single', address: '456 IT Park, Bangalore, Karnataka 560001', employment_type: 'full_time', work_location: 'Bangalore Office', skills: ['System Administration', 'Cloud', 'DevOps', 'Security'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-360) },
      { id: uuid(), user_id: HR_ID, employee_id: 'EMP003', first_name: 'Anita', last_name: 'Desai', date_of_birth: '1985-03-10', nationality: 'Indian', marital_status: 'Married', address: '789 Business District, Pune, Maharashtra 411001', employment_type: 'full_time', work_location: 'Mumbai HQ', skills: ['HR Management', 'Recruitment', 'Training', 'Employee Relations'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-350) },
      { id: uuid(), user_id: FINANCE_ID, employee_id: 'EMP004', first_name: 'Vikram', last_name: 'Mehta', date_of_birth: '1980-11-28', nationality: 'Indian', marital_status: 'Married', address: '321 Financial Hub, Mumbai, Maharashtra 400051', employment_type: 'full_time', work_location: 'Mumbai HQ', skills: ['Financial Planning', 'Taxation', 'Accounting', 'Budgeting'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-340) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, employee_id: 'EMP005', first_name: 'Amit', last_name: 'Patel', date_of_birth: '1992-07-14', nationality: 'Indian', marital_status: 'Single', address: '567 Tech Valley, Hyderabad, Telangana 500001', employment_type: 'full_time', work_location: 'Remote', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-330) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, employee_id: 'EMP006', first_name: 'Sarah', last_name: 'Johnson', date_of_birth: '1994-01-25', nationality: 'American', marital_status: 'Single', address: '890 Developer Lane, San Francisco, CA 94102', employment_type: 'full_time', work_location: 'Remote', skills: ['React', 'Vue.js', 'Python', 'Django', 'MongoDB'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-320) },
      { id: uuid(), user_id: EMPLOYEE_3_ID, employee_id: 'EMP007', first_name: 'Mike', last_name: 'Chen', date_of_birth: '1990-09-08', nationality: 'Chinese', marital_status: 'Married', address: '234 Code Street, Singapore 018956', employment_type: 'full_time', work_location: 'Singapore Office', skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'Docker'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-310) },
      { id: uuid(), user_id: PM_ID, employee_id: 'EMP008', first_name: 'David', last_name: 'Rodriguez', date_of_birth: '1987-04-18', nationality: 'Spanish', marital_status: 'Married', address: '678 Project Ave, Barcelona, Spain 08001', employment_type: 'full_time', work_location: 'Remote', skills: ['Project Management', 'Agile', 'Scrum', 'JIRA', 'Client Management'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: SALES_ID, employee_id: 'EMP009', first_name: 'Lisa', last_name: 'Thompson', date_of_birth: '1989-12-03', nationality: 'British', marital_status: 'Single', address: '901 Sales Drive, London, UK EC1A 1BB', employment_type: 'full_time', work_location: 'London Office', skills: ['Sales', 'Negotiation', 'CRM', 'Business Development', 'Presentations'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-290) },
      { id: uuid(), user_id: DEV_LEAD_ID, employee_id: 'EMP010', first_name: 'Alex', last_name: 'Williams', date_of_birth: '1986-06-20', nationality: 'Australian', marital_status: 'Married', address: '432 Tech Boulevard, Sydney, NSW 2000', employment_type: 'full_time', work_location: 'Sydney Office', skills: ['Architecture', 'System Design', 'Team Leadership', 'React', 'Node.js', 'AWS'], is_active: true, agency_id: AGENCY_ID, created_at: datetime(-280) },
    ];

    // ==================== EMPLOYEE SALARY DETAILS ====================
    db.employee_salary_details = [
      { id: uuid(), employee_id: 'EMP001', salary: 5000000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'HDFC Bank', bank_account: 'XXXX1234', created_by: SUPER_ADMIN_ID, created_at: datetime(-365) },
      { id: uuid(), employee_id: 'EMP002', salary: 1800000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'ICICI Bank', bank_account: 'XXXX2345', created_by: SUPER_ADMIN_ID, created_at: datetime(-360) },
      { id: uuid(), employee_id: 'EMP003', salary: 2400000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'SBI', bank_account: 'XXXX3456', created_by: SUPER_ADMIN_ID, created_at: datetime(-350) },
      { id: uuid(), employee_id: 'EMP004', salary: 4500000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'Axis Bank', bank_account: 'XXXX4567', created_by: SUPER_ADMIN_ID, created_at: datetime(-340) },
      { id: uuid(), employee_id: 'EMP005', salary: 1500000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'HDFC Bank', bank_account: 'XXXX5678', created_by: SUPER_ADMIN_ID, created_at: datetime(-330) },
      { id: uuid(), employee_id: 'EMP006', salary: 1400000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'Yes Bank', bank_account: 'XXXX6789', created_by: SUPER_ADMIN_ID, created_at: datetime(-320) },
      { id: uuid(), employee_id: 'EMP007', salary: 1600000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'Kotak Bank', bank_account: 'XXXX7890', created_by: SUPER_ADMIN_ID, created_at: datetime(-310) },
      { id: uuid(), employee_id: 'EMP008', salary: 2200000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'ICICI Bank', bank_account: 'XXXX8901', created_by: SUPER_ADMIN_ID, created_at: datetime(-300) },
      { id: uuid(), employee_id: 'EMP009', salary: 2000000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'HDFC Bank', bank_account: 'XXXX9012', created_by: SUPER_ADMIN_ID, created_at: datetime(-290) },
      { id: uuid(), employee_id: 'EMP010', salary: 2800000, currency: 'INR', pay_frequency: 'monthly', bank_name: 'SBI', bank_account: 'XXXX0123', created_by: SUPER_ADMIN_ID, created_at: datetime(-280) },
    ];

    // ==================== CLIENTS ====================
    const CLIENT_1 = uuid();
    const CLIENT_2 = uuid();
    const CLIENT_3 = uuid();
    const CLIENT_4 = uuid();
    const CLIENT_5 = uuid();
    const CLIENT_6 = uuid();

    db.clients = [
      { id: CLIENT_1, client_number: 'CLI-001', name: 'Tata Consultancy Services', company_name: 'TCS', industry: 'IT Services', email: 'projects@tcs.com', phone: '+91 22 6778 9999', address: 'TCS House, Raveline Street', city: 'Mumbai', state: 'Maharashtra', postal_code: '400001', country: 'India', website: 'https://www.tcs.com', contact_person: 'Rajiv Menon', contact_position: 'VP - Partnerships', contact_email: 'rajiv.menon@tcs.com', contact_phone: '+91 98765 11111', status: 'active', tax_id: '27AAACT2727Q1ZW', payment_terms: 'Net 30', notes: 'Strategic partner for enterprise solutions', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: CLIENT_2, client_number: 'CLI-002', name: 'Infosys Limited', company_name: 'Infosys', industry: 'IT Services', email: 'vendor@infosys.com', phone: '+91 80 2852 0261', address: 'Electronics City', city: 'Bangalore', state: 'Karnataka', postal_code: '560100', country: 'India', website: 'https://www.infosys.com', contact_person: 'Sanjay Nair', contact_position: 'Director - Procurement', contact_email: 'sanjay.nair@infosys.com', contact_phone: '+91 98765 22222', status: 'active', tax_id: '29AABCI1234Q1ZG', payment_terms: 'Net 45', notes: 'Long-term client for digital transformation projects', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-280) },
      { id: CLIENT_3, client_number: 'CLI-003', name: 'Reliance Industries', company_name: 'RIL', industry: 'Conglomerate', email: 'it@ril.com', phone: '+91 22 2278 5000', address: 'Maker Chambers IV', city: 'Mumbai', state: 'Maharashtra', postal_code: '400021', country: 'India', website: 'https://www.ril.com', contact_person: 'Amit Shah', contact_position: 'IT Head', contact_email: 'amit.shah@ril.com', contact_phone: '+91 98765 33333', status: 'active', tax_id: '27AAACR5055K1ZJ', payment_terms: 'Net 30', notes: 'Enterprise client for digital initiatives', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-260) },
      { id: CLIENT_4, client_number: 'CLI-004', name: 'HDFC Bank', company_name: 'HDFC Bank', industry: 'Banking', email: 'tech@hdfcbank.com', phone: '+91 22 3976 0000', address: 'HDFC Bank House', city: 'Mumbai', state: 'Maharashtra', postal_code: '400013', country: 'India', website: 'https://www.hdfcbank.com', contact_person: 'Priyanka Gupta', contact_position: 'Chief Digital Officer', contact_email: 'priyanka.gupta@hdfcbank.com', contact_phone: '+91 98765 44444', status: 'active', tax_id: '27AAACH0001Q1ZQ', payment_terms: 'Net 15', notes: 'Banking sector digital transformation', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-240) },
      { id: CLIENT_5, client_number: 'CLI-005', name: 'Wipro Limited', company_name: 'Wipro', industry: 'IT Services', email: 'partnerships@wipro.com', phone: '+91 80 2844 0011', address: 'Doddakannelli', city: 'Bangalore', state: 'Karnataka', postal_code: '560035', country: 'India', website: 'https://www.wipro.com', contact_person: 'Kiran Reddy', contact_position: 'Manager - Alliances', contact_email: 'kiran.reddy@wipro.com', contact_phone: '+91 98765 55555', status: 'active', tax_id: '29AABCW0001Q1ZX', payment_terms: 'Net 30', notes: 'Technology partnership for cloud solutions', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-220) },
      { id: CLIENT_6, client_number: 'CLI-006', name: 'Flipkart Internet', company_name: 'Flipkart', industry: 'E-commerce', email: 'tech-partners@flipkart.com', phone: '+91 80 4366 3100', address: 'Embassy Tech Village', city: 'Bangalore', state: 'Karnataka', postal_code: '560103', country: 'India', website: 'https://www.flipkart.com', contact_person: 'Meera Krishnan', contact_position: 'Engineering Director', contact_email: 'meera.k@flipkart.com', contact_phone: '+91 98765 66666', status: 'active', tax_id: '29AABCF0001Q1ZY', payment_terms: 'Net 30', notes: 'E-commerce platform development', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-200) },
    ];

    // ==================== PROJECTS ====================
    const PROJ_1 = uuid();
    const PROJ_2 = uuid();
    const PROJ_3 = uuid();
    const PROJ_4 = uuid();
    const PROJ_5 = uuid();
    const PROJ_6 = uuid();

    db.projects = [
      { id: PROJ_1, name: 'TCS Digital Workspace', description: 'Enterprise digital workspace solution with collaboration tools, document management, and workflow automation', status: 'in_progress', progress: 65, client_id: CLIENT_1, budget: 4500000, start_date: date(-120), end_date: date(60), assigned_team: [DEV_LEAD_ID, EMPLOYEE_1_ID, EMPLOYEE_2_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-120) },
      { id: PROJ_2, name: 'Infosys Cloud Migration', description: 'Complete cloud migration project moving legacy systems to AWS with microservices architecture', status: 'in_progress', progress: 45, client_id: CLIENT_2, budget: 8500000, start_date: date(-90), end_date: date(90), assigned_team: [EMPLOYEE_3_ID, DEV_LEAD_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-90) },
      { id: PROJ_3, name: 'RIL Mobile App', description: 'Customer-facing mobile application for Reliance retail with payment integration and loyalty program', status: 'planning', progress: 15, client_id: CLIENT_3, budget: 6000000, start_date: date(-30), end_date: date(150), assigned_team: [EMPLOYEE_1_ID, EMPLOYEE_2_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-30) },
      { id: PROJ_4, name: 'HDFC Bank Chatbot', description: 'AI-powered customer service chatbot with natural language processing and banking integrations', status: 'completed', progress: 100, client_id: CLIENT_4, budget: 3500000, start_date: date(-180), end_date: date(-30), assigned_team: [DEV_LEAD_ID, EMPLOYEE_1_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-180) },
      { id: PROJ_5, name: 'Wipro Analytics Dashboard', description: 'Real-time business analytics dashboard with data visualization and reporting capabilities', status: 'in_progress', progress: 80, client_id: CLIENT_5, budget: 2500000, start_date: date(-60), end_date: date(15), assigned_team: [EMPLOYEE_2_ID, EMPLOYEE_3_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-60) },
      { id: PROJ_6, name: 'Flipkart Inventory System', description: 'Advanced inventory management system with predictive analytics and supply chain optimization', status: 'on_hold', progress: 30, client_id: CLIENT_6, budget: 5500000, start_date: date(-45), end_date: date(120), assigned_team: [DEV_LEAD_ID], created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-45) },
    ];

    // ==================== TASKS ====================
    db.tasks = [
      // TCS Digital Workspace Tasks
      { id: uuid(), project_id: PROJ_1, title: 'Setup AWS Infrastructure', description: 'Configure VPC, EC2 instances, RDS, and S3 buckets for the project', assignee_id: EMPLOYEE_1_ID, created_by: PM_ID, status: 'completed', priority: 'high', due_date: date(-90), estimated_hours: 40, actual_hours: 35, completed_at: datetime(-85), agency_id: AGENCY_ID, created_at: datetime(-120) },
      { id: uuid(), project_id: PROJ_1, title: 'Develop Authentication Module', description: 'Implement SSO with OAuth2 and SAML support', assignee_id: DEV_LEAD_ID, created_by: PM_ID, status: 'completed', priority: 'high', due_date: date(-75), estimated_hours: 60, actual_hours: 55, completed_at: datetime(-70), agency_id: AGENCY_ID, created_at: datetime(-115) },
      { id: uuid(), project_id: PROJ_1, title: 'Build Document Management UI', description: 'Create React components for document upload, preview, and sharing', assignee_id: EMPLOYEE_2_ID, created_by: PM_ID, status: 'in_progress', priority: 'medium', due_date: date(15), estimated_hours: 80, actual_hours: 45, agency_id: AGENCY_ID, created_at: datetime(-100) },
      { id: uuid(), project_id: PROJ_1, title: 'Implement Workflow Engine', description: 'Build customizable workflow automation engine with approval chains', assignee_id: EMPLOYEE_1_ID, created_by: PM_ID, status: 'in_progress', priority: 'high', due_date: date(30), estimated_hours: 100, actual_hours: 25, agency_id: AGENCY_ID, created_at: datetime(-80) },
      { id: uuid(), project_id: PROJ_1, title: 'Integration Testing', description: 'End-to-end testing of all modules', assignee_id: EMPLOYEE_3_ID, created_by: PM_ID, status: 'pending', priority: 'medium', due_date: date(45), estimated_hours: 40, agency_id: AGENCY_ID, created_at: datetime(-60) },
      
      // Infosys Cloud Migration Tasks
      { id: uuid(), project_id: PROJ_2, title: 'Legacy System Analysis', description: 'Document existing system architecture and dependencies', assignee_id: DEV_LEAD_ID, created_by: PM_ID, status: 'completed', priority: 'high', due_date: date(-70), estimated_hours: 30, actual_hours: 28, completed_at: datetime(-68), agency_id: AGENCY_ID, created_at: datetime(-90) },
      { id: uuid(), project_id: PROJ_2, title: 'Database Migration Strategy', description: 'Plan PostgreSQL to Aurora migration with zero downtime', assignee_id: EMPLOYEE_3_ID, created_by: PM_ID, status: 'in_progress', priority: 'high', due_date: date(5), estimated_hours: 50, actual_hours: 30, agency_id: AGENCY_ID, created_at: datetime(-85) },
      { id: uuid(), project_id: PROJ_2, title: 'Containerize Applications', description: 'Dockerize all microservices and setup Kubernetes clusters', assignee_id: EMPLOYEE_3_ID, created_by: PM_ID, status: 'in_progress', priority: 'medium', due_date: date(30), estimated_hours: 80, actual_hours: 20, agency_id: AGENCY_ID, created_at: datetime(-75) },
      { id: uuid(), project_id: PROJ_2, title: 'CI/CD Pipeline Setup', description: 'Implement Jenkins pipelines with automated testing', assignee_id: EMPLOYEE_1_ID, created_by: PM_ID, status: 'pending', priority: 'medium', due_date: date(45), estimated_hours: 40, agency_id: AGENCY_ID, created_at: datetime(-60) },

      // Analytics Dashboard Tasks
      { id: uuid(), project_id: PROJ_5, title: 'Design Dashboard Layout', description: 'Create wireframes and mockups for the dashboard', assignee_id: EMPLOYEE_2_ID, created_by: PM_ID, status: 'completed', priority: 'high', due_date: date(-45), estimated_hours: 20, actual_hours: 18, completed_at: datetime(-43), agency_id: AGENCY_ID, created_at: datetime(-60) },
      { id: uuid(), project_id: PROJ_5, title: 'Build Chart Components', description: 'Implement recharts based visualization components', assignee_id: EMPLOYEE_2_ID, created_by: PM_ID, status: 'completed', priority: 'high', due_date: date(-30), estimated_hours: 40, actual_hours: 42, completed_at: datetime(-28), agency_id: AGENCY_ID, created_at: datetime(-55) },
      { id: uuid(), project_id: PROJ_5, title: 'API Integration', description: 'Connect dashboard to backend data services', assignee_id: EMPLOYEE_3_ID, created_by: PM_ID, status: 'in_progress', priority: 'medium', due_date: date(5), estimated_hours: 30, actual_hours: 20, agency_id: AGENCY_ID, created_at: datetime(-45) },
    ];

    // ==================== INVOICES ====================
    db.invoices = [
      { id: uuid(), invoice_number: 'INV-2024-001', client_id: CLIENT_4, title: 'HDFC Bank Chatbot - Phase 1', description: 'Initial development and deployment of AI chatbot', status: 'paid', issue_date: date(-150), due_date: date(-120), subtotal: 1500000, tax_rate: 18, discount: 0, total_amount: 1770000, notes: 'Payment received via RTGS', created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-150) },
      { id: uuid(), invoice_number: 'INV-2024-002', client_id: CLIENT_4, title: 'HDFC Bank Chatbot - Phase 2', description: 'NLP enhancements and banking integrations', status: 'paid', issue_date: date(-90), due_date: date(-60), subtotal: 2000000, tax_rate: 18, discount: 100000, total_amount: 2242000, notes: 'Includes 5% early payment discount', created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-90) },
      { id: uuid(), invoice_number: 'INV-2024-003', client_id: CLIENT_1, title: 'TCS Digital Workspace - Milestone 1', description: 'Infrastructure setup and authentication module', status: 'paid', issue_date: date(-75), due_date: date(-45), subtotal: 1500000, tax_rate: 18, discount: 0, total_amount: 1770000, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-75) },
      { id: uuid(), invoice_number: 'INV-2024-004', client_id: CLIENT_2, title: 'Infosys Cloud Migration - Analysis', description: 'System analysis and migration strategy', status: 'sent', issue_date: date(-30), due_date: date(0), subtotal: 1200000, tax_rate: 18, discount: 0, total_amount: 1416000, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-30) },
      { id: uuid(), invoice_number: 'INV-2024-005', client_id: CLIENT_1, title: 'TCS Digital Workspace - Milestone 2', description: 'Document management and workflow engine', status: 'draft', issue_date: date(-5), due_date: date(25), subtotal: 1800000, tax_rate: 18, discount: 0, total_amount: 2124000, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-5) },
      { id: uuid(), invoice_number: 'INV-2024-006', client_id: CLIENT_5, title: 'Wipro Analytics Dashboard', description: 'Complete dashboard development', status: 'sent', issue_date: date(-10), due_date: date(20), subtotal: 2500000, tax_rate: 18, discount: 0, total_amount: 2950000, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-10) },
    ];

    // ==================== QUOTATIONS ====================
    db.quotations = [
      { id: uuid(), quote_number: 'QUO-2024-001', client_id: CLIENT_3, title: 'RIL Mobile App Development', description: 'Complete mobile application with payment integration', status: 'accepted', valid_until: date(30), subtotal: 6000000, tax_rate: 18, tax_amount: 1080000, total_amount: 7080000, terms_conditions: 'Payment terms: 30% advance, 40% on milestone, 30% on delivery', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-45) },
      { id: uuid(), quote_number: 'QUO-2024-002', client_id: CLIENT_6, title: 'Flipkart Inventory System', description: 'Inventory management with predictive analytics', status: 'pending', valid_until: date(45), subtotal: 5500000, tax_rate: 18, tax_amount: 990000, total_amount: 6490000, terms_conditions: 'Payment terms: Net 30', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-30) },
      { id: uuid(), quote_number: 'QUO-2024-003', client_id: CLIENT_2, title: 'Additional Cloud Services', description: 'Extended cloud support and maintenance', status: 'sent', valid_until: date(60), subtotal: 2400000, tax_rate: 18, tax_amount: 432000, total_amount: 2832000, created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-15) },
    ];

    // ==================== JOBS & CATEGORIES ====================
    const JOB_CAT_1 = uuid();
    const JOB_CAT_2 = uuid();
    const JOB_CAT_3 = uuid();
    const JOB_CAT_4 = uuid();

    db.job_categories = [
      { id: JOB_CAT_1, name: 'Software Development', description: 'Custom software development projects', billable_rate: 5000, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: JOB_CAT_2, name: 'Cloud Services', description: 'Cloud infrastructure and migration', billable_rate: 6000, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: JOB_CAT_3, name: 'Consulting', description: 'Technical and business consulting', billable_rate: 8000, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: JOB_CAT_4, name: 'Support & Maintenance', description: 'Ongoing support and maintenance', billable_rate: 3500, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    db.jobs = [
      { id: uuid(), job_number: 'JOB-001', client_id: CLIENT_1, category_id: JOB_CAT_1, title: 'Frontend Development', description: 'React component development for TCS project', status: 'in_progress', start_date: date(-100), end_date: date(20), estimated_hours: 200, actual_hours: 120, estimated_cost: 1000000, actual_cost: 600000, budget: 1200000, assigned_to: EMPLOYEE_2_ID, created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-100) },
      { id: uuid(), job_number: 'JOB-002', client_id: CLIENT_2, category_id: JOB_CAT_2, title: 'AWS Migration', description: 'Cloud migration services for Infosys', status: 'in_progress', start_date: date(-80), end_date: date(60), estimated_hours: 300, actual_hours: 100, estimated_cost: 1800000, actual_cost: 600000, budget: 2000000, assigned_to: EMPLOYEE_3_ID, created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-80) },
      { id: uuid(), job_number: 'JOB-003', client_id: CLIENT_4, category_id: JOB_CAT_1, title: 'Chatbot AI Development', description: 'NLP model training and integration', status: 'completed', start_date: date(-150), end_date: date(-40), estimated_hours: 250, actual_hours: 240, estimated_cost: 1250000, actual_cost: 1200000, budget: 1300000, profit_margin: 8, assigned_to: DEV_LEAD_ID, created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-150) },
    ];

    // ==================== LEADS ====================
    const LEAD_SOURCE_1 = uuid();
    const LEAD_SOURCE_2 = uuid();
    const LEAD_SOURCE_3 = uuid();

    db.lead_sources = [
      { id: LEAD_SOURCE_1, name: 'Website', description: 'Inbound through website contact form', is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LEAD_SOURCE_2, name: 'Referral', description: 'Client and partner referrals', is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LEAD_SOURCE_3, name: 'LinkedIn', description: 'LinkedIn outreach and campaigns', is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    db.leads = [
      { id: uuid(), lead_number: 'LEAD-001', company_name: 'Mahindra Tech', contact_name: 'Suresh Prabhu', email: 'suresh.prabhu@mahindratech.com', phone: '+91 98765 77777', lead_source_id: LEAD_SOURCE_1, status: 'qualified', priority: 'high', estimated_value: 5000000, probability: 70, expected_close_date: date(30), assigned_to: SALES_ID, notes: 'Interested in ERP implementation', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-20) },
      { id: uuid(), lead_number: 'LEAD-002', company_name: 'Bajaj Finserv', contact_name: 'Neha Sharma', email: 'neha.sharma@bajajfinserv.com', phone: '+91 98765 88888', lead_source_id: LEAD_SOURCE_2, status: 'contacted', priority: 'medium', estimated_value: 3500000, probability: 40, expected_close_date: date(60), assigned_to: SALES_ID, notes: 'Referred by HDFC Bank', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-15) },
      { id: uuid(), lead_number: 'LEAD-003', company_name: 'Zomato', contact_name: 'Arjun Kapoor', email: 'arjun.k@zomato.com', phone: '+91 98765 99999', lead_source_id: LEAD_SOURCE_3, status: 'new', priority: 'high', estimated_value: 8000000, probability: 30, expected_close_date: date(90), assigned_to: SALES_ID, notes: 'Looking for delivery optimization platform', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-5) },
      { id: uuid(), lead_number: 'LEAD-004', company_name: 'Swiggy', contact_name: 'Priya Rajan', email: 'priya.r@swiggy.com', phone: '+91 98765 00001', lead_source_id: LEAD_SOURCE_1, status: 'qualified', priority: 'high', estimated_value: 7500000, probability: 60, expected_close_date: date(45), assigned_to: SALES_ID, notes: 'Competitive analysis with Zomato', created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-10) },
    ];

    // ==================== ATTENDANCE ====================
    // Generate attendance for last 30 days for each employee
    const employees = [EMPLOYEE_1_ID, EMPLOYEE_2_ID, EMPLOYEE_3_ID, PM_ID, SALES_ID, DEV_LEAD_ID];
    db.attendance = [];
    
    for (let i = 30; i >= 1; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayOfWeek = d.getDay();
      
      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      for (const empId of employees) {
        const checkInHour = 8 + Math.floor(Math.random() * 2);
        const checkInMinute = Math.floor(Math.random() * 60);
        const checkOutHour = 17 + Math.floor(Math.random() * 3);
        const checkOutMinute = Math.floor(Math.random() * 60);
        const totalHours = (checkOutHour + checkOutMinute/60) - (checkInHour + checkInMinute/60);
        
        db.attendance.push({
          id: uuid(),
          employee_id: empId,
          date: date(-i),
          check_in_time: datetime(-i, checkInHour, checkInMinute),
          check_out_time: datetime(-i, checkOutHour, checkOutMinute),
          total_hours: Math.round(totalHours * 100) / 100,
          overtime_hours: totalHours > 9 ? Math.round((totalHours - 9) * 100) / 100 : 0,
          status: 'present',
          location: 'Office / Remote',
          agency_id: AGENCY_ID,
          created_at: datetime(-i)
        });
      }
    }

    // ==================== LEAVE TYPES ====================
    const LT_ANNUAL = uuid();
    const LT_SICK = uuid();
    const LT_PERSONAL = uuid();
    const LT_UNPAID = uuid();
    const LT_MATERNITY = uuid();
    const LT_PATERNITY = uuid();

    db.leave_types = [
      { id: LT_ANNUAL, name: 'Annual Leave', description: 'Paid annual vacation days', max_days: 24, is_paid: true, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LT_SICK, name: 'Sick Leave', description: 'Medical leave with doctor certificate', max_days: 12, is_paid: true, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LT_PERSONAL, name: 'Personal Leave', description: 'Personal time off', max_days: 6, is_paid: true, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LT_UNPAID, name: 'Unpaid Leave', description: 'Leave without pay', max_days: 30, is_paid: false, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LT_MATERNITY, name: 'Maternity Leave', description: 'Maternity leave for new mothers', max_days: 180, is_paid: true, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: LT_PATERNITY, name: 'Paternity Leave', description: 'Paternity leave for new fathers', max_days: 15, is_paid: true, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== LEAVE BALANCES ====================
    db.leave_balances = employees.map(empId => ({
      id: uuid(),
      employee_id: empId,
      leave_type_id: LT_ANNUAL,
      year: new Date().getFullYear(),
      total_days: 24,
      used_days: Math.floor(Math.random() * 8),
      pending_days: Math.floor(Math.random() * 3),
      agency_id: AGENCY_ID,
      created_at: datetime(-365)
    }));

    // ==================== LEAVE REQUESTS ====================
    db.leave_requests = [
      { id: uuid(), employee_id: EMPLOYEE_1_ID, leave_type_id: LT_ANNUAL, start_date: date(-60), end_date: date(-55), total_days: 5, reason: 'Family vacation', status: 'approved', approved_by: HR_ID, approved_at: datetime(-65), agency_id: AGENCY_ID, created_at: datetime(-70) },
      { id: uuid(), employee_id: EMPLOYEE_2_ID, leave_type_id: LT_SICK, start_date: date(-30), end_date: date(-28), total_days: 2, reason: 'Fever and cold', status: 'approved', approved_by: HR_ID, approved_at: datetime(-31), agency_id: AGENCY_ID, created_at: datetime(-32) },
      { id: uuid(), employee_id: EMPLOYEE_3_ID, leave_type_id: LT_PERSONAL, start_date: date(10), end_date: date(11), total_days: 2, reason: 'Personal work', status: 'pending', agency_id: AGENCY_ID, created_at: datetime(-5) },
      { id: uuid(), employee_id: PM_ID, leave_type_id: LT_ANNUAL, start_date: date(20), end_date: date(30), total_days: 10, reason: 'International travel', status: 'pending', agency_id: AGENCY_ID, created_at: datetime(-3) },
    ];

    // ==================== PAYROLL PERIODS ====================
    const PP_1 = uuid();
    const PP_2 = uuid();
    const PP_3 = uuid();

    db.payroll_periods = [
      { id: PP_1, name: 'October 2024', start_date: date(-60), end_date: date(-30), status: 'closed', agency_id: AGENCY_ID, created_at: datetime(-60) },
      { id: PP_2, name: 'November 2024', start_date: date(-30), end_date: date(0), status: 'closed', agency_id: AGENCY_ID, created_at: datetime(-30) },
      { id: PP_3, name: 'December 2024', start_date: date(0), end_date: date(30), status: 'open', agency_id: AGENCY_ID, created_at: datetime(-1) },
    ];

    // ==================== PAYROLL ====================
    db.payroll = employees.map(empId => ({
      id: uuid(),
      employee_id: empId,
      payroll_period_id: PP_2,
      base_salary: empId === DEV_LEAD_ID ? 233333 : empId === PM_ID ? 183333 : 125000,
      overtime_pay: Math.floor(Math.random() * 15000),
      bonuses: Math.floor(Math.random() * 25000),
      deductions: Math.floor(Math.random() * 5000),
      gross_pay: 0, // Will be calculated
      tax_deductions: 0, // Will be calculated
      net_pay: 0, // Will be calculated
      hours_worked: 176 + Math.floor(Math.random() * 20),
      overtime_hours: Math.floor(Math.random() * 15),
      status: 'processed',
      created_by: FINANCE_ID,
      agency_id: AGENCY_ID,
      created_at: datetime(-5)
    })).map(p => {
      p.gross_pay = p.base_salary + p.overtime_pay + p.bonuses - p.deductions;
      p.tax_deductions = Math.round(p.gross_pay * 0.25);
      p.net_pay = p.gross_pay - p.tax_deductions;
      return p;
    });

    // ==================== REIMBURSEMENT CATEGORIES ====================
    const RC_TRAVEL = uuid();
    const RC_MEALS = uuid();
    const RC_OFFICE = uuid();
    const RC_TRAINING = uuid();

    db.reimbursement_categories = [
      { id: RC_TRAVEL, name: 'Travel & Transportation', description: 'Business travel expenses', max_amount: 50000, requires_receipt: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: RC_MEALS, name: 'Meals & Entertainment', description: 'Client meetings and team lunches', max_amount: 5000, requires_receipt: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: RC_OFFICE, name: 'Office Supplies', description: 'Work from home and office supplies', max_amount: 10000, requires_receipt: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: RC_TRAINING, name: 'Training & Certifications', description: 'Professional development', max_amount: 100000, requires_receipt: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== REIMBURSEMENT REQUESTS ====================
    db.reimbursement_requests = [
      { id: uuid(), employee_id: EMPLOYEE_1_ID, category_id: RC_TRAVEL, amount: 15000, currency: 'INR', expense_date: date(-20), description: 'Client visit to Mumbai office', business_purpose: 'TCS project meeting', status: 'approved', submitted_at: datetime(-18), reviewed_by: FINANCE_ID, reviewed_at: datetime(-15), payment_date: date(-10), agency_id: AGENCY_ID, created_at: datetime(-18) },
      { id: uuid(), employee_id: EMPLOYEE_2_ID, category_id: RC_TRAINING, amount: 45000, currency: 'INR', expense_date: date(-45), description: 'AWS Solutions Architect certification', business_purpose: 'Professional development for cloud projects', status: 'approved', submitted_at: datetime(-43), reviewed_by: FINANCE_ID, reviewed_at: datetime(-40), payment_date: date(-35), agency_id: AGENCY_ID, created_at: datetime(-43) },
      { id: uuid(), employee_id: PM_ID, category_id: RC_MEALS, amount: 3500, currency: 'INR', expense_date: date(-10), description: 'Team lunch after project milestone', business_purpose: 'Team celebration for HDFC project completion', status: 'pending', submitted_at: datetime(-8), agency_id: AGENCY_ID, created_at: datetime(-8) },
      { id: uuid(), employee_id: SALES_ID, category_id: RC_TRAVEL, amount: 28000, currency: 'INR', expense_date: date(-15), description: 'Flight and hotel for Bangalore client meeting', business_purpose: 'New client acquisition - Wipro', status: 'approved', submitted_at: datetime(-13), reviewed_by: FINANCE_ID, reviewed_at: datetime(-10), agency_id: AGENCY_ID, created_at: datetime(-13) },
    ];

    // ==================== HOLIDAYS ====================
    db.holidays = [
      { id: uuid(), name: 'New Year Day', date: '2025-01-01', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Republic Day', date: '2025-01-26', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Holi', date: '2025-03-14', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Good Friday', date: '2025-04-18', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Independence Day', date: '2025-08-15', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Gandhi Jayanti', date: '2025-10-02', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Diwali', date: '2025-10-20', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Diwali Holiday', date: '2025-10-21', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Christmas', date: '2025-12-25', is_company_holiday: false, is_national_holiday: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Company Foundation Day', date: '2025-03-15', is_company_holiday: true, is_national_holiday: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== COMPANY EVENTS ====================
    db.company_events = [
      { id: uuid(), title: 'Quarterly All-Hands Meeting', description: 'Q4 2024 company-wide update and celebrations', start_date: datetime(5, 10, 0), end_date: datetime(5, 12, 0), location: 'Mumbai HQ - Conference Hall', event_type: 'meeting', all_day: false, created_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-10) },
      { id: uuid(), title: 'Annual Day Celebration', description: 'TechBuild Solutions Annual Day with awards ceremony', start_date: datetime(30, 17, 0), end_date: datetime(30, 22, 0), location: 'Grand Hyatt Mumbai', event_type: 'celebration', all_day: false, created_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-30) },
      { id: uuid(), title: 'Tech Talk: AI in Business', description: 'Internal knowledge sharing session on AI applications', start_date: datetime(15, 15, 0), end_date: datetime(15, 17, 0), location: 'Virtual - Zoom', event_type: 'training', all_day: false, created_by: DEV_LEAD_ID, agency_id: AGENCY_ID, created_at: datetime(-5) },
    ];

    // ==================== NOTIFICATIONS ====================
    db.notifications = [
      // Super Admin notifications
      { id: uuid(), user_id: SUPER_ADMIN_ID, title: 'System Health Check', message: 'Monthly system health check completed. All services running optimally.', type: 'in_app', category: 'system', priority: 'normal', read_at: datetime(-2), created_at: datetime(-3) },
      { id: uuid(), user_id: SUPER_ADMIN_ID, title: 'New User Registration', message: '3 new users have registered this week. Review their access permissions.', type: 'in_app', category: 'alert', priority: 'high', read_at: null, created_at: datetime(-1) },
      { id: uuid(), user_id: SUPER_ADMIN_ID, title: 'Backup Completed', message: 'Weekly database backup completed successfully.', type: 'in_app', category: 'system', priority: 'low', read_at: null, created_at: datetime(0) },
      
      // Admin notifications
      { id: uuid(), user_id: ADMIN_ID, title: 'New Employee Onboarding', message: 'Sarah Johnson has completed onboarding. Please assign department and role.', type: 'in_app', category: 'reminder', priority: 'normal', read_at: datetime(-5), created_at: datetime(-7) },
      { id: uuid(), user_id: ADMIN_ID, title: 'License Renewal Due', message: 'Software license renewal due in 15 days. Review and approve.', type: 'in_app', category: 'alert', priority: 'high', read_at: null, created_at: datetime(-2) },
      
      // HR notifications
      { id: uuid(), user_id: HR_ID, title: 'Leave Requests Pending', message: 'You have 5 pending leave requests awaiting approval.', type: 'in_app', category: 'approval', priority: 'high', read_at: null, created_at: datetime(-1) },
      { id: uuid(), user_id: HR_ID, title: 'Attendance Alert', message: 'Low attendance alert for 2 employees this week.', type: 'in_app', category: 'alert', priority: 'normal', read_at: null, created_at: datetime(0) },
      
      // Finance notifications
      { id: uuid(), user_id: FINANCE_ID, title: 'Pending Reimbursements', message: 'You have 4 pending reimbursement requests totaling ₹45,000.', type: 'in_app', category: 'approval', priority: 'high', read_at: null, created_at: datetime(-3) },
      { id: uuid(), user_id: FINANCE_ID, title: 'Invoice Overdue', message: 'Invoice INV-2024-0089 for Axis Bank is 7 days overdue.', type: 'in_app', category: 'alert', priority: 'urgent', read_at: null, created_at: datetime(-1) },
      
      // Employee notifications
      { id: uuid(), user_id: EMPLOYEE_1_ID, title: 'Leave Request Approved', message: 'Your annual leave request from Dec 25-27 has been approved.', type: 'in_app', category: 'update', priority: 'normal', read_at: datetime(-10), created_at: datetime(-12) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, title: 'Task Assigned', message: 'You have been assigned to "API Integration" task in TCS Digital Workspace project.', type: 'in_app', category: 'update', priority: 'normal', read_at: null, created_at: datetime(-2) },
      
      // PM notifications
      { id: uuid(), user_id: PM_ID, title: 'Project Milestone Completed', message: 'HDFC Bank Chatbot project Phase 1 has been marked as completed.', type: 'in_app', category: 'update', priority: 'normal', read_at: datetime(-25), created_at: datetime(-30) },
      { id: uuid(), user_id: PM_ID, title: 'Resource Allocation Request', message: 'Request for 2 additional developers for Smart City project received.', type: 'in_app', category: 'approval', priority: 'high', read_at: null, created_at: datetime(-1) },
      
      // Sales notifications
      { id: uuid(), user_id: SALES_ID, title: 'New Lead Assigned', message: 'A new enterprise lead from Zomato has been assigned to you.', type: 'in_app', category: 'update', priority: 'high', read_at: null, created_at: datetime(-5) },
      { id: uuid(), user_id: SALES_ID, title: 'Follow-up Reminder', message: 'Follow-up due for Tech Mahindra proposal sent 3 days ago.', type: 'in_app', category: 'reminder', priority: 'normal', read_at: null, created_at: datetime(-1) },
      
      // Dev Lead notifications
      { id: uuid(), user_id: DEV_LEAD_ID, title: 'Code Review Required', message: 'Frontend PR #234 requires your review - React component optimization.', type: 'in_app', category: 'approval', priority: 'normal', read_at: null, created_at: datetime(-1) },
      { id: uuid(), user_id: DEV_LEAD_ID, title: 'Sprint Planning', message: 'Sprint 24 planning meeting scheduled for tomorrow at 10 AM.', type: 'in_app', category: 'reminder', priority: 'normal', read_at: null, created_at: datetime(0) },
    ];

    // ==================== GST SETTINGS ====================
    db.gst_settings = [
      { id: uuid(), agency_id: AGENCY_ID, gstin: '27AAACT0001Q1ZW', legal_name: 'TechBuild Solutions Private Limited', trade_name: 'TechBuild Solutions', address: '123 MG Road, Mumbai', state_code: '27', state_name: 'Maharashtra', is_active: true, created_at: datetime(-365) },
    ];

    // ==================== HSN/SAC CODES ====================
    db.hsn_sac_codes = [
      { id: uuid(), code: '998314', description: 'IT consulting and support services', type: 'SAC', gst_rate: 18, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), code: '998313', description: 'IT infrastructure and network management', type: 'SAC', gst_rate: 18, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), code: '998315', description: 'Hosting and IT infrastructure provisioning', type: 'SAC', gst_rate: 18, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), code: '998316', description: 'IT design and development services', type: 'SAC', gst_rate: 18, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== CHART OF ACCOUNTS ====================
    db.chart_of_accounts = [
      { id: uuid(), account_code: '1000', account_name: 'Cash and Bank', account_type: 'asset', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '1100', account_name: 'Accounts Receivable', account_type: 'asset', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '2000', account_name: 'Accounts Payable', account_type: 'liability', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '3000', account_name: 'Owner\'s Equity', account_type: 'equity', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '4000', account_name: 'Service Revenue', account_type: 'revenue', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '5000', account_name: 'Operating Expenses', account_type: 'expense', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '5100', account_name: 'Salaries & Wages', account_type: 'expense', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), account_code: '5200', account_name: 'Rent & Utilities', account_type: 'expense', parent_id: null, is_active: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== AUDIT LOGS ====================
    db.audit_logs = [
      { id: uuid(), table_name: 'projects', action: 'INSERT', user_id: PM_ID, record_id: PROJ_1, old_values: null, new_values: { name: 'TCS Digital Workspace', status: 'in_progress' }, created_at: datetime(-120) },
      { id: uuid(), table_name: 'invoices', action: 'UPDATE', user_id: FINANCE_ID, record_id: 'inv-001', old_values: { status: 'sent' }, new_values: { status: 'paid' }, created_at: datetime(-115) },
      { id: uuid(), table_name: 'leave_requests', action: 'UPDATE', user_id: HR_ID, record_id: 'leave-001', old_values: { status: 'pending' }, new_values: { status: 'approved' }, created_at: datetime(-65) },
    ];

    // ==================== PERMISSIONS ====================
    const PERM_VIEW_USERS = uuid();
    const PERM_MANAGE_USERS = uuid();
    const PERM_VIEW_REPORTS = uuid();
    const PERM_MANAGE_INVOICES = uuid();
    const PERM_APPROVE_LEAVE = uuid();
    const PERM_MANAGE_PROJECTS = uuid();
    const PERM_VIEW_PAYROLL = uuid();
    const PERM_MANAGE_PAYROLL = uuid();

    db.permissions = [
      { id: PERM_VIEW_USERS, name: 'view_users', description: 'View user profiles and details', category: 'users', is_active: true, created_at: datetime(-365) },
      { id: PERM_MANAGE_USERS, name: 'manage_users', description: 'Create, edit, and delete users', category: 'users', is_active: true, created_at: datetime(-365) },
      { id: PERM_VIEW_REPORTS, name: 'view_reports', description: 'View analytics and reports', category: 'reports', is_active: true, created_at: datetime(-365) },
      { id: PERM_MANAGE_INVOICES, name: 'manage_invoices', description: 'Create, edit, and delete invoices', category: 'finance', is_active: true, created_at: datetime(-365) },
      { id: PERM_APPROVE_LEAVE, name: 'approve_leave', description: 'Approve or reject leave requests', category: 'hr', is_active: true, created_at: datetime(-365) },
      { id: PERM_MANAGE_PROJECTS, name: 'manage_projects', description: 'Create, edit, and manage projects', category: 'projects', is_active: true, created_at: datetime(-365) },
      { id: PERM_VIEW_PAYROLL, name: 'view_payroll', description: 'View payroll information', category: 'payroll', is_active: true, created_at: datetime(-365) },
      { id: PERM_MANAGE_PAYROLL, name: 'manage_payroll', description: 'Process and manage payroll', category: 'payroll', is_active: true, created_at: datetime(-365) },
    ];

    // ==================== ROLE PERMISSIONS ====================
    db.role_permissions = [
      // Super Admin has all permissions
      { id: uuid(), role: 'super_admin', permission_id: PERM_VIEW_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_MANAGE_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_VIEW_REPORTS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_MANAGE_INVOICES, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_APPROVE_LEAVE, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_MANAGE_PROJECTS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_VIEW_PAYROLL, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'super_admin', permission_id: PERM_MANAGE_PAYROLL, granted: true, created_at: datetime(-365) },
      // Admin
      { id: uuid(), role: 'admin', permission_id: PERM_VIEW_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'admin', permission_id: PERM_MANAGE_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'admin', permission_id: PERM_VIEW_REPORTS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'admin', permission_id: PERM_MANAGE_PROJECTS, granted: true, created_at: datetime(-365) },
      // HR
      { id: uuid(), role: 'hr', permission_id: PERM_VIEW_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'hr', permission_id: PERM_MANAGE_USERS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'hr', permission_id: PERM_APPROVE_LEAVE, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'hr', permission_id: PERM_VIEW_PAYROLL, granted: true, created_at: datetime(-365) },
      // Finance Manager
      { id: uuid(), role: 'finance_manager', permission_id: PERM_VIEW_REPORTS, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'finance_manager', permission_id: PERM_MANAGE_INVOICES, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'finance_manager', permission_id: PERM_VIEW_PAYROLL, granted: true, created_at: datetime(-365) },
      { id: uuid(), role: 'finance_manager', permission_id: PERM_MANAGE_PAYROLL, granted: true, created_at: datetime(-365) },
      // Employee
      { id: uuid(), role: 'employee', permission_id: PERM_VIEW_USERS, granted: true, created_at: datetime(-365) },
    ];

    // ==================== SUBSCRIPTION PLANS ====================
    const PLAN_FREE = uuid();
    const PLAN_STARTER = uuid();
    const PLAN_PROFESSIONAL = uuid();
    const PLAN_ENTERPRISE = uuid();

    db.subscription_plans = [
      { id: PLAN_FREE, name: 'Free', description: 'Basic features for small teams', price: 0, billing_cycle: 'monthly', max_users: 5, is_active: true, created_at: datetime(-365) },
      { id: PLAN_STARTER, name: 'Starter', description: 'Essential features for growing teams', price: 2999, billing_cycle: 'monthly', max_users: 15, is_active: true, created_at: datetime(-365) },
      { id: PLAN_PROFESSIONAL, name: 'Professional', description: 'Advanced features for professional teams', price: 7999, billing_cycle: 'monthly', max_users: 50, is_active: true, created_at: datetime(-365) },
      { id: PLAN_ENTERPRISE, name: 'Enterprise', description: 'Full features with unlimited users', price: 19999, billing_cycle: 'monthly', max_users: 999, is_active: true, created_at: datetime(-365) },
    ];

    // ==================== PLAN FEATURES ====================
    const FEAT_PROJECTS = uuid();
    const FEAT_INVOICES = uuid();
    const FEAT_CRM = uuid();
    const FEAT_ANALYTICS = uuid();
    const FEAT_API = uuid();

    db.plan_features = [
      { id: FEAT_PROJECTS, name: 'Project Management', description: 'Create and manage projects', code: 'projects', is_active: true, created_at: datetime(-365) },
      { id: FEAT_INVOICES, name: 'Invoicing', description: 'Create and send invoices', code: 'invoicing', is_active: true, created_at: datetime(-365) },
      { id: FEAT_CRM, name: 'CRM', description: 'Customer relationship management', code: 'crm', is_active: true, created_at: datetime(-365) },
      { id: FEAT_ANALYTICS, name: 'Advanced Analytics', description: 'Detailed analytics and reports', code: 'analytics', is_active: true, created_at: datetime(-365) },
      { id: FEAT_API, name: 'API Access', description: 'REST API access', code: 'api', is_active: true, created_at: datetime(-365) },
    ];

    // ==================== PLAN FEATURE MAPPINGS ====================
    db.plan_feature_mappings = [
      { id: uuid(), plan_id: PLAN_FREE, feature_id: FEAT_PROJECTS, enabled: true, limit_value: 3, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_STARTER, feature_id: FEAT_PROJECTS, enabled: true, limit_value: 10, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_STARTER, feature_id: FEAT_INVOICES, enabled: true, limit_value: 50, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_PROFESSIONAL, feature_id: FEAT_PROJECTS, enabled: true, limit_value: 100, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_PROFESSIONAL, feature_id: FEAT_INVOICES, enabled: true, limit_value: 500, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_PROFESSIONAL, feature_id: FEAT_CRM, enabled: true, limit_value: 1000, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_PROFESSIONAL, feature_id: FEAT_ANALYTICS, enabled: true, limit_value: null, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_ENTERPRISE, feature_id: FEAT_PROJECTS, enabled: true, limit_value: null, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_ENTERPRISE, feature_id: FEAT_INVOICES, enabled: true, limit_value: null, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_ENTERPRISE, feature_id: FEAT_CRM, enabled: true, limit_value: null, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_ENTERPRISE, feature_id: FEAT_ANALYTICS, enabled: true, limit_value: null, created_at: datetime(-365) },
      { id: uuid(), plan_id: PLAN_ENTERPRISE, feature_id: FEAT_API, enabled: true, limit_value: null, created_at: datetime(-365) },
    ];

    // ==================== DOCUMENT FOLDERS ====================
    const FOLDER_HR = uuid();
    const FOLDER_FINANCE = uuid();
    const FOLDER_PROJECTS = uuid();
    const FOLDER_CONTRACTS = uuid();

    db.document_folders = [
      { id: FOLDER_HR, name: 'HR Documents', description: 'Human resources documents', parent_id: null, created_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: FOLDER_FINANCE, name: 'Financial Documents', description: 'Financial and accounting documents', parent_id: null, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: FOLDER_PROJECTS, name: 'Project Files', description: 'Project-related documents', parent_id: null, created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: FOLDER_CONTRACTS, name: 'Contracts', description: 'Client and vendor contracts', parent_id: null, created_by: ADMIN_ID, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== DOCUMENTS ====================
    db.documents = [
      { id: uuid(), folder_id: FOLDER_HR, name: 'Employee Handbook 2024.pdf', file_type: 'application/pdf', file_size: 2500000, file_path: '/documents/hr/employee-handbook-2024.pdf', uploaded_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), folder_id: FOLDER_HR, name: 'Leave Policy.docx', file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', file_size: 150000, file_path: '/documents/hr/leave-policy.docx', uploaded_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-290) },
      { id: uuid(), folder_id: FOLDER_FINANCE, name: 'Q3 2024 Report.xlsx', file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', file_size: 850000, file_path: '/documents/finance/q3-2024-report.xlsx', uploaded_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-60) },
      { id: uuid(), folder_id: FOLDER_PROJECTS, name: 'TCS Project Proposal.pdf', file_type: 'application/pdf', file_size: 3200000, file_path: '/documents/projects/tcs-proposal.pdf', uploaded_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-120) },
      { id: uuid(), folder_id: FOLDER_CONTRACTS, name: 'TCS Master Service Agreement.pdf', file_type: 'application/pdf', file_size: 1800000, file_path: '/documents/contracts/tcs-msa.pdf', uploaded_by: ADMIN_ID, agency_id: AGENCY_ID, created_at: datetime(-150) },
    ];

    // ==================== MESSAGE THREADS ====================
    const THREAD_1 = uuid();
    const THREAD_2 = uuid();
    const THREAD_3 = uuid();

    db.message_threads = [
      { id: THREAD_1, subject: 'TCS Project Updates', type: 'group', created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-90), updated_at: now() },
      { id: THREAD_2, subject: 'Leave Request Query', type: 'direct', created_by: EMPLOYEE_1_ID, agency_id: AGENCY_ID, created_at: datetime(-30), updated_at: datetime(-28) },
      { id: THREAD_3, subject: 'Q4 Budget Discussion', type: 'group', created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-45), updated_at: datetime(-40) },
    ];

    // ==================== THREAD PARTICIPANTS ====================
    db.thread_participants = [
      { id: uuid(), thread_id: THREAD_1, user_id: PM_ID, joined_at: datetime(-90), last_read_at: now() },
      { id: uuid(), thread_id: THREAD_1, user_id: DEV_LEAD_ID, joined_at: datetime(-90), last_read_at: datetime(-2) },
      { id: uuid(), thread_id: THREAD_1, user_id: EMPLOYEE_1_ID, joined_at: datetime(-90), last_read_at: datetime(-5) },
      { id: uuid(), thread_id: THREAD_2, user_id: EMPLOYEE_1_ID, joined_at: datetime(-30), last_read_at: datetime(-28) },
      { id: uuid(), thread_id: THREAD_2, user_id: HR_ID, joined_at: datetime(-30), last_read_at: datetime(-28) },
      { id: uuid(), thread_id: THREAD_3, user_id: FINANCE_ID, joined_at: datetime(-45), last_read_at: datetime(-40) },
      { id: uuid(), thread_id: THREAD_3, user_id: SUPER_ADMIN_ID, joined_at: datetime(-45), last_read_at: datetime(-42) },
    ];

    // ==================== MESSAGES ====================
    db.messages = [
      { id: uuid(), thread_id: THREAD_1, sender_id: PM_ID, content: 'Team, we have completed milestone 1 for the TCS project. Great work everyone!', created_at: datetime(-85) },
      { id: uuid(), thread_id: THREAD_1, sender_id: DEV_LEAD_ID, content: 'Thanks! The team put in extra effort. We should celebrate.', created_at: datetime(-84) },
      { id: uuid(), thread_id: THREAD_1, sender_id: EMPLOYEE_1_ID, content: 'Looking forward to milestone 2. The infrastructure is solid now.', created_at: datetime(-83) },
      { id: uuid(), thread_id: THREAD_1, sender_id: PM_ID, content: 'Starting sprint planning for milestone 2 tomorrow at 10 AM.', created_at: datetime(-80) },
      { id: uuid(), thread_id: THREAD_2, sender_id: EMPLOYEE_1_ID, content: 'Hi, I wanted to check on my leave request for next week.', created_at: datetime(-30) },
      { id: uuid(), thread_id: THREAD_2, sender_id: HR_ID, content: 'I have approved your leave request. You should receive the notification.', created_at: datetime(-29) },
      { id: uuid(), thread_id: THREAD_3, sender_id: FINANCE_ID, content: 'Q4 budget review meeting scheduled for next week. Please review the attached projections.', created_at: datetime(-45) },
      { id: uuid(), thread_id: THREAD_3, sender_id: SUPER_ADMIN_ID, content: 'Looks good. Let\'s discuss the marketing budget increase in detail.', created_at: datetime(-44) },
    ];

    // ==================== DASHBOARD WIDGETS ====================
    db.dashboard_widgets = [
      { id: uuid(), user_id: SUPER_ADMIN_ID, widget_type: 'revenue_chart', title: 'Revenue Overview', position: 0, width: 2, height: 1, settings: { period: 'monthly' }, is_visible: true, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: SUPER_ADMIN_ID, widget_type: 'project_status', title: 'Project Status', position: 1, width: 1, height: 1, settings: {}, is_visible: true, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: SUPER_ADMIN_ID, widget_type: 'team_activity', title: 'Team Activity', position: 2, width: 1, height: 1, settings: {}, is_visible: true, agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: PM_ID, widget_type: 'task_overview', title: 'My Tasks', position: 0, width: 2, height: 1, settings: {}, is_visible: true, agency_id: AGENCY_ID, created_at: datetime(-280) },
    ];

    // ==================== CUSTOM REPORTS ====================
    db.custom_reports = [
      { id: uuid(), name: 'Monthly Revenue Analysis', description: 'Detailed monthly revenue breakdown by client', report_type: 'financial', query_config: { metrics: ['revenue', 'expenses'], groupBy: 'client' }, created_by: FINANCE_ID, agency_id: AGENCY_ID, created_at: datetime(-200) },
      { id: uuid(), name: 'Employee Performance', description: 'Employee task completion and attendance report', report_type: 'hr', query_config: { metrics: ['tasks_completed', 'attendance_rate'] }, created_by: HR_ID, agency_id: AGENCY_ID, created_at: datetime(-180) },
      { id: uuid(), name: 'Project Profitability', description: 'Project cost vs revenue analysis', report_type: 'project', query_config: { metrics: ['budget', 'actual_cost', 'profit_margin'] }, created_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-150) },
    ];

    // ==================== ROLE CHANGE REQUESTS ====================
    db.role_change_requests = [
      { id: uuid(), user_id: EMPLOYEE_2_ID, current_role: 'employee', requested_role: 'admin', reason: 'Need admin access for project management responsibilities', status: 'pending', requested_by: PM_ID, agency_id: AGENCY_ID, created_at: datetime(-10) },
      { id: uuid(), user_id: SALES_ID, current_role: 'employee', requested_role: 'admin', reason: 'Promoted to Sales Director, requires admin permissions', status: 'approved', requested_by: SUPER_ADMIN_ID, approved_by: SUPER_ADMIN_ID, approved_at: datetime(-20), agency_id: AGENCY_ID, created_at: datetime(-25) },
    ];

    // ==================== REIMBURSEMENT WORKFLOW STATES ====================
    db.reimbursement_workflow_states = [
      { id: uuid(), name: 'Submitted', description: 'Request submitted for review', order_index: 1, is_initial: true, is_final: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Manager Review', description: 'Pending manager approval', order_index: 2, is_initial: false, is_final: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Finance Review', description: 'Pending finance team approval', order_index: 3, is_initial: false, is_final: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Approved', description: 'Request approved for payment', order_index: 4, is_initial: false, is_final: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Paid', description: 'Payment processed', order_index: 5, is_initial: false, is_final: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Rejected', description: 'Request rejected', order_index: 6, is_initial: false, is_final: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== EXPENSE CATEGORIES ====================
    db.expense_categories = [
      { id: uuid(), name: 'Travel', description: 'Travel and transportation expenses', max_amount: 100000, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Meals', description: 'Food and beverages during business', max_amount: 5000, requires_approval: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Office Supplies', description: 'Office and stationery items', max_amount: 10000, requires_approval: false, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Software', description: 'Software and subscriptions', max_amount: 50000, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Training', description: 'Training and certification fees', max_amount: 200000, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'Equipment', description: 'Hardware and equipment', max_amount: 100000, requires_approval: true, agency_id: AGENCY_ID, created_at: datetime(-365) },
    ];

    // ==================== RECEIPTS ====================
    db.receipts = [
      { id: uuid(), employee_id: EMPLOYEE_1_ID, file_name: 'travel_receipt_001.pdf', file_path: '/receipts/travel_receipt_001.pdf', file_type: 'application/pdf', file_size: 125000, amount: 15000, merchant_name: 'Air India', expense_date: date(-20), status: 'verified', agency_id: AGENCY_ID, created_at: datetime(-18) },
      { id: uuid(), employee_id: EMPLOYEE_2_ID, file_name: 'aws_cert_receipt.pdf', file_path: '/receipts/aws_cert_receipt.pdf', file_type: 'application/pdf', file_size: 95000, amount: 45000, merchant_name: 'AWS Training', expense_date: date(-45), status: 'verified', agency_id: AGENCY_ID, created_at: datetime(-43) },
      { id: uuid(), employee_id: PM_ID, file_name: 'team_lunch.jpg', file_path: '/receipts/team_lunch.jpg', file_type: 'image/jpeg', file_size: 850000, amount: 3500, merchant_name: 'Restaurant XYZ', expense_date: date(-10), status: 'pending', agency_id: AGENCY_ID, created_at: datetime(-8) },
    ];

    // ==================== REIMBURSEMENT ATTACHMENTS ====================
    db.reimbursement_attachments = [
      { id: uuid(), reimbursement_id: db.reimbursement_requests[0].id, file_name: 'travel_receipt.pdf', file_path: '/attachments/travel_receipt.pdf', file_type: 'application/pdf', file_size: 125000, uploaded_at: datetime(-18) },
      { id: uuid(), reimbursement_id: db.reimbursement_requests[1].id, file_name: 'certification_invoice.pdf', file_path: '/attachments/certification_invoice.pdf', file_type: 'application/pdf', file_size: 95000, uploaded_at: datetime(-43) },
    ];

    // ==================== QUOTATION LINE ITEMS ====================
    const QUOTE_1_ID = db.quotations[0].id;
    const QUOTE_2_ID = db.quotations[1].id;

    db.quotation_line_items = [
      { id: uuid(), quotation_id: QUOTE_1_ID, description: 'Mobile App Development - iOS', quantity: 1, unit_price: 2500000, discount: 0, tax_rate: 18, total: 2950000, created_at: datetime(-45) },
      { id: uuid(), quotation_id: QUOTE_1_ID, description: 'Mobile App Development - Android', quantity: 1, unit_price: 2500000, discount: 0, tax_rate: 18, total: 2950000, created_at: datetime(-45) },
      { id: uuid(), quotation_id: QUOTE_1_ID, description: 'Payment Gateway Integration', quantity: 1, unit_price: 500000, discount: 0, tax_rate: 18, total: 590000, created_at: datetime(-45) },
      { id: uuid(), quotation_id: QUOTE_1_ID, description: 'Loyalty Program Module', quantity: 1, unit_price: 500000, discount: 0, tax_rate: 18, total: 590000, created_at: datetime(-45) },
      { id: uuid(), quotation_id: QUOTE_2_ID, description: 'Inventory Management System', quantity: 1, unit_price: 3000000, discount: 0, tax_rate: 18, total: 3540000, created_at: datetime(-30) },
      { id: uuid(), quotation_id: QUOTE_2_ID, description: 'Predictive Analytics Module', quantity: 1, unit_price: 2000000, discount: 0, tax_rate: 18, total: 2360000, created_at: datetime(-30) },
      { id: uuid(), quotation_id: QUOTE_2_ID, description: 'Supply Chain Optimization', quantity: 1, unit_price: 500000, discount: 0, tax_rate: 18, total: 590000, created_at: datetime(-30) },
    ];

    // ==================== JOB COST ITEMS ====================
    const JOB_1_ID = db.jobs[0].id;
    const JOB_2_ID = db.jobs[1].id;

    db.job_cost_items = [
      { id: uuid(), job_id: JOB_1_ID, description: 'Developer Labor - Week 1-4', cost_type: 'labor', quantity: 160, unit_cost: 2500, total_cost: 400000, billable: true, created_at: datetime(-80) },
      { id: uuid(), job_id: JOB_1_ID, description: 'AWS Cloud Services', cost_type: 'infrastructure', quantity: 1, unit_cost: 50000, total_cost: 50000, billable: true, created_at: datetime(-75) },
      { id: uuid(), job_id: JOB_1_ID, description: 'Third-party Libraries', cost_type: 'software', quantity: 1, unit_cost: 25000, total_cost: 25000, billable: false, created_at: datetime(-70) },
      { id: uuid(), job_id: JOB_2_ID, description: 'Cloud Architect Consulting', cost_type: 'labor', quantity: 80, unit_cost: 5000, total_cost: 400000, billable: true, created_at: datetime(-60) },
      { id: uuid(), job_id: JOB_2_ID, description: 'Migration Tools License', cost_type: 'software', quantity: 1, unit_cost: 100000, total_cost: 100000, billable: true, created_at: datetime(-55) },
    ];

    // ==================== CRM ACTIVITIES ====================
    db.crm_activities = [
      { id: uuid(), lead_id: db.leads[0].id, activity_type: 'call', subject: 'Initial Discovery Call', description: 'Discussed ERP requirements and timeline', outcome: 'positive', scheduled_at: datetime(-15), completed_at: datetime(-15), created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-15) },
      { id: uuid(), lead_id: db.leads[0].id, activity_type: 'email', subject: 'Follow-up with Proposal', description: 'Sent detailed proposal document', outcome: 'pending', scheduled_at: datetime(-10), completed_at: datetime(-10), created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-10) },
      { id: uuid(), lead_id: db.leads[1].id, activity_type: 'meeting', subject: 'Demo Presentation', description: 'Product demo for finance team', outcome: 'positive', scheduled_at: datetime(-12), completed_at: datetime(-12), created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-12) },
      { id: uuid(), lead_id: db.leads[2].id, activity_type: 'call', subject: 'Initial Contact', description: 'First call to discuss requirements', outcome: null, scheduled_at: datetime(2), completed_at: null, created_by: SALES_ID, agency_id: AGENCY_ID, created_at: datetime(-5) },
    ];

    // ==================== FEATURE FLAGS ====================
    db.feature_flags = [
      { id: uuid(), name: 'ai_features', description: 'Enable AI-powered features', is_enabled: true, rollout_percentage: 100, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'dark_mode', description: 'Enable dark mode theme', is_enabled: true, rollout_percentage: 100, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'advanced_analytics', description: 'Enable advanced analytics dashboard', is_enabled: true, rollout_percentage: 100, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'beta_features', description: 'Enable beta features', is_enabled: false, rollout_percentage: 0, agency_id: AGENCY_ID, created_at: datetime(-365) },
      { id: uuid(), name: 'realtime_collaboration', description: 'Enable real-time collaboration', is_enabled: true, rollout_percentage: 50, agency_id: AGENCY_ID, created_at: datetime(-180) },
    ];

    // ==================== GST RETURNS ====================
    db.gst_returns = [
      { id: uuid(), agency_id: AGENCY_ID, return_type: 'GSTR-1', period: '2024-10', status: 'filed', filing_date: date(-25), due_date: date(-20), total_taxable_value: 5000000, total_tax: 900000, created_at: datetime(-30) },
      { id: uuid(), agency_id: AGENCY_ID, return_type: 'GSTR-3B', period: '2024-10', status: 'filed', filing_date: date(-15), due_date: date(-10), total_taxable_value: 5000000, total_tax: 900000, created_at: datetime(-20) },
      { id: uuid(), agency_id: AGENCY_ID, return_type: 'GSTR-1', period: '2024-11', status: 'pending', filing_date: null, due_date: date(10), total_taxable_value: 6500000, total_tax: 1170000, created_at: datetime(-5) },
    ];

    // ==================== EMPLOYEE FILES ====================
    db.employee_files = [
      { id: uuid(), employee_id: 'EMP001', file_name: 'pan_card.pdf', file_path: '/employee_docs/emp001/pan_card.pdf', file_type: 'application/pdf', file_size: 250000, category: 'identity', uploaded_by: HR_ID, created_at: datetime(-365) },
      { id: uuid(), employee_id: 'EMP001', file_name: 'offer_letter.pdf', file_path: '/employee_docs/emp001/offer_letter.pdf', file_type: 'application/pdf', file_size: 350000, category: 'employment', uploaded_by: HR_ID, created_at: datetime(-365) },
      { id: uuid(), employee_id: 'EMP005', file_name: 'resume.pdf', file_path: '/employee_docs/emp005/resume.pdf', file_type: 'application/pdf', file_size: 180000, category: 'employment', uploaded_by: HR_ID, created_at: datetime(-330) },
      { id: uuid(), employee_id: 'EMP006', file_name: 'degree_certificate.pdf', file_path: '/employee_docs/emp006/degree_certificate.pdf', file_type: 'application/pdf', file_size: 420000, category: 'education', uploaded_by: HR_ID, created_at: datetime(-320) },
    ];

    // ==================== FILE STORAGE ====================
    db.file_storage = [
      { id: uuid(), bucket_name: 'documents', file_path: '/documents/hr/employee-handbook-2024.pdf', file_name: 'Employee Handbook 2024.pdf', file_size: 2500000, mime_type: 'application/pdf', uploaded_by: HR_ID, created_at: datetime(-300) },
      { id: uuid(), bucket_name: 'documents', file_path: '/documents/finance/q3-2024-report.xlsx', file_name: 'Q3 2024 Report.xlsx', file_size: 850000, mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', uploaded_by: FINANCE_ID, created_at: datetime(-60) },
      { id: uuid(), bucket_name: 'avatars', file_path: '/avatars/user_001.jpg', file_name: 'user_001.jpg', file_size: 150000, mime_type: 'image/jpeg', uploaded_by: SUPER_ADMIN_ID, created_at: datetime(-365) },
    ];

    // ==================== INVOICE ITEMS ====================
    const INV_1_ID = db.invoices[0].id;
    const INV_2_ID = db.invoices[1].id;

    db.invoice_items = [
      { id: uuid(), invoice_id: INV_1_ID, description: 'AI Chatbot Development - Phase 1', quantity: 1, unit_price: 1000000, discount: 0, tax_rate: 18, total: 1180000, created_at: datetime(-150) },
      { id: uuid(), invoice_id: INV_1_ID, description: 'NLP Model Training', quantity: 1, unit_price: 500000, discount: 0, tax_rate: 18, total: 590000, created_at: datetime(-150) },
      { id: uuid(), invoice_id: INV_2_ID, description: 'Banking Integrations', quantity: 1, unit_price: 1200000, discount: 50000, tax_rate: 18, total: 1357000, created_at: datetime(-90) },
      { id: uuid(), invoice_id: INV_2_ID, description: 'NLP Enhancements', quantity: 1, unit_price: 800000, discount: 50000, tax_rate: 18, total: 885000, created_at: datetime(-90) },
    ];

    // ==================== PROJECT TEAM MEMBERS ====================
    db.project_team_members = [
      { id: uuid(), project_id: PROJ_1, user_id: DEV_LEAD_ID, role: 'lead', allocation_percentage: 80, start_date: date(-120), agency_id: AGENCY_ID, created_at: datetime(-120) },
      { id: uuid(), project_id: PROJ_1, user_id: EMPLOYEE_1_ID, role: 'developer', allocation_percentage: 100, start_date: date(-115), agency_id: AGENCY_ID, created_at: datetime(-115) },
      { id: uuid(), project_id: PROJ_1, user_id: EMPLOYEE_2_ID, role: 'developer', allocation_percentage: 100, start_date: date(-100), agency_id: AGENCY_ID, created_at: datetime(-100) },
      { id: uuid(), project_id: PROJ_2, user_id: EMPLOYEE_3_ID, role: 'lead', allocation_percentage: 100, start_date: date(-90), agency_id: AGENCY_ID, created_at: datetime(-90) },
      { id: uuid(), project_id: PROJ_2, user_id: DEV_LEAD_ID, role: 'architect', allocation_percentage: 20, start_date: date(-90), agency_id: AGENCY_ID, created_at: datetime(-90) },
      { id: uuid(), project_id: PROJ_5, user_id: EMPLOYEE_2_ID, role: 'developer', allocation_percentage: 50, start_date: date(-60), agency_id: AGENCY_ID, created_at: datetime(-60) },
      { id: uuid(), project_id: PROJ_5, user_id: EMPLOYEE_3_ID, role: 'developer', allocation_percentage: 50, start_date: date(-60), agency_id: AGENCY_ID, created_at: datetime(-60) },
    ];

    // ==================== TIME ENTRIES ====================
    db.time_entries = [
      { id: uuid(), user_id: EMPLOYEE_1_ID, project_id: PROJ_1, task_id: db.tasks[0].id, date: date(-10), hours: 8, description: 'Completed AWS infrastructure setup', billable: true, approved: true, agency_id: AGENCY_ID, created_at: datetime(-10) },
      { id: uuid(), user_id: EMPLOYEE_1_ID, project_id: PROJ_1, task_id: db.tasks[3].id, date: date(-9), hours: 6, description: 'Working on workflow engine', billable: true, approved: true, agency_id: AGENCY_ID, created_at: datetime(-9) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, project_id: PROJ_1, task_id: db.tasks[2].id, date: date(-8), hours: 7, description: 'Document management UI components', billable: true, approved: false, agency_id: AGENCY_ID, created_at: datetime(-8) },
      { id: uuid(), user_id: EMPLOYEE_3_ID, project_id: PROJ_2, task_id: db.tasks[6].id, date: date(-7), hours: 8, description: 'Database migration planning', billable: true, approved: true, agency_id: AGENCY_ID, created_at: datetime(-7) },
      { id: uuid(), user_id: EMPLOYEE_2_ID, project_id: PROJ_5, task_id: db.tasks[10].id, date: date(-6), hours: 5, description: 'Dashboard chart components', billable: true, approved: true, agency_id: AGENCY_ID, created_at: datetime(-6) },
    ];

    // ==================== ACTIVITY LOGS ====================
    db.activity_logs = [
      { id: uuid(), user_id: PM_ID, action: 'created', entity_type: 'project', entity_id: PROJ_1, details: { project_name: 'TCS Digital Workspace' }, ip_address: '192.168.1.100', agency_id: AGENCY_ID, created_at: datetime(-120) },
      { id: uuid(), user_id: FINANCE_ID, action: 'sent', entity_type: 'invoice', entity_id: db.invoices[0].id, details: { invoice_number: 'INV-2024-001' }, ip_address: '192.168.1.101', agency_id: AGENCY_ID, created_at: datetime(-150) },
      { id: uuid(), user_id: HR_ID, action: 'approved', entity_type: 'leave_request', entity_id: db.leave_requests[0].id, details: { employee: 'Amit Patel' }, ip_address: '192.168.1.102', agency_id: AGENCY_ID, created_at: datetime(-65) },
      { id: uuid(), user_id: SALES_ID, action: 'created', entity_type: 'client', entity_id: CLIENT_1, details: { client_name: 'TCS' }, ip_address: '192.168.1.103', agency_id: AGENCY_ID, created_at: datetime(-300) },
      { id: uuid(), user_id: SUPER_ADMIN_ID, action: 'login', entity_type: 'session', entity_id: uuid(), details: { device: 'Chrome on Windows' }, ip_address: '192.168.1.100', agency_id: AGENCY_ID, created_at: datetime(-1) },
    ];

    // ==================== SYSTEM SETTINGS ====================
    db.system_settings = [
      { id: uuid(), setting_key: 'maintenance_mode', setting_value: 'false', category: 'system', description: 'Enable maintenance mode', created_at: datetime(-365), updated_at: now() },
      { id: uuid(), setting_key: 'max_upload_size', setting_value: '10485760', category: 'storage', description: 'Maximum file upload size in bytes', created_at: datetime(-365), updated_at: now() },
      { id: uuid(), setting_key: 'session_timeout', setting_value: '3600', category: 'security', description: 'Session timeout in seconds', created_at: datetime(-365), updated_at: now() },
      { id: uuid(), setting_key: 'email_provider', setting_value: 'sendgrid', category: 'email', description: 'Email service provider', created_at: datetime(-365), updated_at: now() },
    ];

    // NOTE: This function is deprecated. Data should be seeded via SQL scripts.
    // Use: psql -U postgres -d buildflow_db -f seed_initial_data.sql
    // Or: npm run seed:db
    
    console.warn('[DB] initializeSeedData() is deprecated. Use SQL seed files instead.');
    console.log('[DB] To seed the database, run: npm run seed:db');
  } catch (error) {
    console.error('[DB] Failed to seed database:', error);
  }
}

// Clear database (for development/testing)
// NOTE: This function is deprecated. Use SQL TRUNCATE commands instead.
export function clearDatabase(): void {
  console.warn('[DB] clearDatabase() is deprecated. Use SQL TRUNCATE commands instead.');
}

// Reset database to seed state
// NOTE: This function is deprecated. Use SQL seed files instead.
export function resetDatabase(): void {
  console.warn('[DB] resetDatabase() is deprecated. Use SQL seed files instead.');
  // To reset database, run: psql -U postgres -d buildflow_db -f seed_initial_data.sql
}
