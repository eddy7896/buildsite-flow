-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reimbursement requests table
CREATE TABLE public.reimbursement_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  category_id UUID NOT NULL REFERENCES expense_categories(id),
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  business_purpose TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reimbursement attachments table
CREATE TABLE public.reimbursement_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reimbursement_id UUID NOT NULL REFERENCES reimbursement_requests(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default expense categories
INSERT INTO public.expense_categories (name, description) VALUES
('Travel', 'Transportation, lodging, and travel-related expenses'),
('Meals & Entertainment', 'Business meals and client entertainment'),
('Office Supplies', 'Office equipment, supplies, and materials'),
('Training & Education', 'Professional development and training costs'),
('Communication', 'Phone, internet, and communication services'),
('Other', 'Miscellaneous business expenses');

-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Enable RLS on all tables
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursement_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for expense_categories
CREATE POLICY "Everyone can view expense categories" 
ON public.expense_categories 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Finance can manage expense categories" 
ON public.expense_categories 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for reimbursement_requests
CREATE POLICY "Employees can view their own reimbursement requests" 
ON public.reimbursement_requests 
FOR SELECT 
USING (employee_id = auth.uid());

CREATE POLICY "Employees can create their own reimbursement requests" 
ON public.reimbursement_requests 
FOR INSERT 
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own draft reimbursement requests" 
ON public.reimbursement_requests 
FOR UPDATE 
USING (employee_id = auth.uid() AND status = 'draft');

CREATE POLICY "Finance and admins can view all reimbursement requests" 
ON public.reimbursement_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

CREATE POLICY "Finance and admins can update reimbursement requests" 
ON public.reimbursement_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- RLS Policies for reimbursement_attachments
CREATE POLICY "Employees can view attachments for their own requests" 
ON public.reimbursement_attachments 
FOR SELECT 
USING (
  reimbursement_id IN (
    SELECT id FROM reimbursement_requests WHERE employee_id = auth.uid()
  )
);

CREATE POLICY "Employees can manage attachments for their own requests" 
ON public.reimbursement_attachments 
FOR ALL 
USING (
  reimbursement_id IN (
    SELECT id FROM reimbursement_requests WHERE employee_id = auth.uid()
  )
);

CREATE POLICY "Finance and admins can view all attachments" 
ON public.reimbursement_attachments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role));

-- Storage policies for receipts bucket
CREATE POLICY "Employees can upload their own receipts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Employees can view their own receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Finance and admins can view all receipts" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'receipts' AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'finance_manager'::app_role))
);

-- Add trigger for updating timestamps
CREATE TRIGGER update_expense_categories_updated_at
BEFORE UPDATE ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reimbursement_requests_updated_at
BEFORE UPDATE ON public.reimbursement_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();