-- Job Costing Tables
CREATE TABLE public.job_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  category_id UUID REFERENCES public.job_categories(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2) DEFAULT 0,
  estimated_cost DECIMAL(12,2),
  actual_cost DECIMAL(12,2) DEFAULT 0,
  budget DECIMAL(12,2),
  profit_margin DECIMAL(5,2),
  assigned_to UUID,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_cost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('labor', 'materials', 'equipment', 'overhead', 'other')),
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  vendor TEXT,
  date_incurred DATE DEFAULT CURRENT_DATE,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Quotations Tables
CREATE TABLE public.quotation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_content JSONB,
  is_active BOOLEAN DEFAULT true,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  template_id UUID REFERENCES public.quotation_templates(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  valid_until DATE,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
  total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100)) STORED,
  terms_conditions TEXT,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.quotation_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * (100 - COALESCE(discount_percentage, 0)) / 100) STORED,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Financial Accounting Tables
CREATE TABLE public.chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_account_id UUID REFERENCES public.chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  reference TEXT,
  total_debit DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
  description TEXT,
  debit_amount DECIMAL(12,2) DEFAULT 0,
  credit_amount DECIMAL(12,2) DEFAULT 0,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM Tables
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_number TEXT NOT NULL UNIQUE,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  lead_source_id UUID REFERENCES public.lead_sources(id),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_value DECIMAL(12,2),
  probability DECIMAL(3,0) DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  assigned_to UUID,
  notes TEXT,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  created_by UUID DEFAULT auth.uid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.sales_pipeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  probability_percentage DECIMAL(3,0) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_pipeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Job Costing
CREATE POLICY "Authenticated users can view job categories" ON public.job_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and HR can manage job categories" ON public.job_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view jobs" ON public.jobs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins, HR, and Finance can manage jobs" ON public.jobs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));
CREATE POLICY "Users can update jobs assigned to them" ON public.jobs FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Authenticated users can view job cost items" ON public.job_cost_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins, HR, and Finance can manage job cost items" ON public.job_cost_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for Quotations
CREATE POLICY "Authenticated users can view quotation templates" ON public.quotation_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and HR can manage quotation templates" ON public.quotation_templates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view quotations" ON public.quotations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins, HR, and Finance can manage quotations" ON public.quotations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Authenticated users can view quotation line items" ON public.quotation_line_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins, HR, and Finance can manage quotation line items" ON public.quotation_line_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for Financial Accounting
CREATE POLICY "Authenticated users can view chart of accounts" ON public.chart_of_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and Finance can manage chart of accounts" ON public.chart_of_accounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Authenticated users can view journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and Finance can manage journal entries" ON public.journal_entries FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Authenticated users can view journal entry lines" ON public.journal_entry_lines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and Finance can manage journal entry lines" ON public.journal_entry_lines FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for CRM
CREATE POLICY "Authenticated users can view lead sources" ON public.lead_sources FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and HR can manage lead sources" ON public.lead_sources FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and HR can manage leads" ON public.leads FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));
CREATE POLICY "Users can view and update leads assigned to them" ON public.leads FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Authenticated users can view CRM activities" ON public.crm_activities FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can manage their own CRM activities" ON public.crm_activities FOR ALL USING (created_by = auth.uid() OR assigned_to = auth.uid());
CREATE POLICY "Admins and HR can manage all CRM activities" ON public.crm_activities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

CREATE POLICY "Authenticated users can view sales pipeline" ON public.sales_pipeline FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins and HR can manage sales pipeline" ON public.sales_pipeline FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_job_categories_updated_at BEFORE UPDATE ON public.job_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotation_templates_updated_at BEFORE UPDATE ON public.quotation_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chart_of_accounts_updated_at BEFORE UPDATE ON public.chart_of_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default data
INSERT INTO public.job_categories (name, description) VALUES 
('Construction', 'Construction and building projects'),
('Maintenance', 'Maintenance and repair work'),
('Consulting', 'Consulting and advisory services'),
('Design', 'Design and planning services');

INSERT INTO public.lead_sources (name, description) VALUES 
('Website', 'Leads from company website'),
('Referral', 'Referrals from existing clients'),
('Cold Call', 'Cold calling prospects'),
('Trade Show', 'Trade shows and events'),
('Social Media', 'Social media platforms'),
('Email Campaign', 'Email marketing campaigns');

INSERT INTO public.sales_pipeline (name, stage_order, probability_percentage) VALUES 
('Initial Contact', 1, 10),
('Qualification', 2, 25),
('Proposal Sent', 3, 50),
('Negotiation', 4, 75),
('Closed Won', 5, 100);

INSERT INTO public.chart_of_accounts (account_code, account_name, account_type, description) VALUES 
('1000', 'Cash', 'asset', 'Cash on hand and in bank'),
('1100', 'Accounts Receivable', 'asset', 'Money owed by customers'),
('1200', 'Inventory', 'asset', 'Inventory and materials'),
('1500', 'Equipment', 'asset', 'Equipment and machinery'),
('2000', 'Accounts Payable', 'liability', 'Money owed to suppliers'),
('2100', 'Accrued Expenses', 'liability', 'Accrued expenses and liabilities'),
('3000', 'Owner Equity', 'equity', 'Owner equity and retained earnings'),
('4000', 'Revenue', 'revenue', 'Sales and service revenue'),
('5000', 'Cost of Goods Sold', 'expense', 'Direct costs of goods sold'),
('6000', 'Operating Expenses', 'expense', 'General operating expenses');