-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100) - COALESCE(discount, 0)) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  client_id UUID,
  assigned_team TEXT,
  progress NUMERIC DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID DEFAULT auth.uid()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Admins, HR, and Finance can manage invoices" 
ON public.invoices 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Authenticated users can view invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for projects
CREATE POLICY "Admins, HR, and Finance can manage projects" 
ON public.projects 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Authenticated users can view projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();