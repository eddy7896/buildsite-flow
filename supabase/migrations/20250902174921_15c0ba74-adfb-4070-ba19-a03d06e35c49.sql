-- Create GST settings table for agency-specific GST configuration
CREATE TABLE public.gst_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id),
  gstin TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  business_type TEXT NOT NULL DEFAULT 'regular',
  filing_frequency TEXT NOT NULL DEFAULT 'monthly',
  composition_scheme BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create GST filings table to track returns
CREATE TABLE public.gst_filings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id),
  filing_period DATE NOT NULL,
  return_type TEXT NOT NULL, -- GSTR1, GSTR3B, GSTR9, etc.
  due_date DATE NOT NULL,
  filed_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, filed, late, cancelled
  total_taxable_value NUMERIC DEFAULT 0,
  total_tax_amount NUMERIC DEFAULT 0,
  late_fee NUMERIC DEFAULT 0,
  interest NUMERIC DEFAULT 0,
  refund_claimed NUMERIC DEFAULT 0,
  filed_by UUID,
  acknowledgment_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agency_id, filing_period, return_type)
);

-- Create GST transactions table for detailed transaction tracking
CREATE TABLE public.gst_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.agencies(id),
  invoice_id UUID REFERENCES public.invoices(id),
  transaction_type TEXT NOT NULL, -- outward_supply, inward_supply, import, export
  supply_type TEXT NOT NULL, -- goods, services
  transaction_date DATE NOT NULL,
  gstin_counterparty TEXT,
  counterparty_name TEXT NOT NULL,
  hsn_sac_code TEXT,
  taxable_value NUMERIC NOT NULL DEFAULT 0,
  cgst_rate NUMERIC DEFAULT 0,
  sgst_rate NUMERIC DEFAULT 0,
  igst_rate NUMERIC DEFAULT 0,
  cess_rate NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  igst_amount NUMERIC DEFAULT 0,
  cess_amount NUMERIC DEFAULT 0,
  reverse_charge BOOLEAN DEFAULT false,
  place_of_supply TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create HSN/SAC codes master table
CREATE TABLE public.hsn_sac_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL, -- hsn, sac
  gst_rate NUMERIC NOT NULL DEFAULT 18,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(code)
);

-- Enable RLS on all tables
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsn_sac_codes ENABLE ROW LEVEL SECURITY;

-- RLS policies for gst_settings
CREATE POLICY "Users can view their agency GST settings" 
ON public.gst_settings 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Finance managers can manage GST settings" 
ON public.gst_settings 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'finance_manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- RLS policies for gst_filings
CREATE POLICY "Users can view their agency GST filings" 
ON public.gst_filings 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Finance managers can manage GST filings" 
ON public.gst_filings 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'finance_manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- RLS policies for gst_transactions
CREATE POLICY "Users can view their agency GST transactions" 
ON public.gst_transactions 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Finance managers can manage GST transactions" 
ON public.gst_transactions 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'finance_manager'::app_role) OR 
   has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- RLS policies for hsn_sac_codes
CREATE POLICY "Everyone can view HSN/SAC codes" 
ON public.hsn_sac_codes 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Finance managers can manage HSN/SAC codes" 
ON public.hsn_sac_codes 
FOR ALL 
USING (
  has_role(auth.uid(), 'finance_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Add GST fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN gstin TEXT,
ADD COLUMN place_of_supply TEXT,
ADD COLUMN hsn_sac_code TEXT,
ADD COLUMN cgst_rate NUMERIC DEFAULT 0,
ADD COLUMN sgst_rate NUMERIC DEFAULT 0,
ADD COLUMN igst_rate NUMERIC DEFAULT 0,
ADD COLUMN cgst_amount NUMERIC DEFAULT 0,
ADD COLUMN sgst_amount NUMERIC DEFAULT 0,
ADD COLUMN igst_amount NUMERIC DEFAULT 0;

-- Create function to calculate GST liability
CREATE OR REPLACE FUNCTION public.calculate_gst_liability(
  p_agency_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(
  total_taxable_value NUMERIC,
  total_cgst NUMERIC,
  total_sgst NUMERIC,
  total_igst NUMERIC,
  total_tax NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(gt.taxable_value), 0) as total_taxable_value,
    COALESCE(SUM(gt.cgst_amount), 0) as total_cgst,
    COALESCE(SUM(gt.sgst_amount), 0) as total_sgst,
    COALESCE(SUM(gt.igst_amount), 0) as total_igst,
    COALESCE(SUM(gt.cgst_amount + gt.sgst_amount + gt.igst_amount), 0) as total_tax
  FROM public.gst_transactions gt
  WHERE gt.agency_id = p_agency_id
    AND gt.transaction_date BETWEEN p_start_date AND p_end_date
    AND gt.transaction_type = 'outward_supply';
END;
$$;

-- Insert some default HSN/SAC codes
INSERT INTO public.hsn_sac_codes (code, description, type, gst_rate) VALUES
('998311', 'Business support services', 'sac', 18),
('998312', 'IT and software services', 'sac', 18),
('998313', 'Consulting services', 'sac', 18),
('998314', 'Marketing services', 'sac', 18),
('998315', 'Design services', 'sac', 18);

-- Create triggers for updated_at
CREATE TRIGGER update_gst_settings_updated_at
  BEFORE UPDATE ON public.gst_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_filings_updated_at
  BEFORE UPDATE ON public.gst_filings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_transactions_updated_at
  BEFORE UPDATE ON public.gst_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();