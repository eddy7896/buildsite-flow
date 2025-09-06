-- Create modern GST tables with better structure
CREATE TABLE public.gst_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.profiles(agency_id),
  gstin TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  business_type TEXT NOT NULL DEFAULT 'regular' CHECK (business_type IN ('regular', 'composition', 'casual', 'non_resident')),
  filing_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (filing_frequency IN ('monthly', 'quarterly', 'annual')),
  composition_scheme BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_agency_gst UNIQUE (agency_id)
);

-- Create GST returns table
CREATE TABLE public.gst_returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.profiles(agency_id),
  return_type TEXT NOT NULL CHECK (return_type IN ('GSTR1', 'GSTR3B', 'GSTR9', 'GSTR4')),
  filing_period DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filed', 'late', 'cancelled')),
  total_taxable_value NUMERIC(15,2) DEFAULT 0,
  total_tax_amount NUMERIC(15,2) DEFAULT 0,
  cgst_amount NUMERIC(15,2) DEFAULT 0,
  sgst_amount NUMERIC(15,2) DEFAULT 0,
  igst_amount NUMERIC(15,2) DEFAULT 0,
  cess_amount NUMERIC(15,2) DEFAULT 0,
  filed_date TIMESTAMPTZ,
  acknowledgment_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create GST transactions table
CREATE TABLE public.gst_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES public.profiles(agency_id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('sale', 'purchase', 'credit_note', 'debit_note')),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  customer_gstin TEXT,
  customer_name TEXT NOT NULL,
  place_of_supply TEXT,
  hsn_sac_code TEXT,
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL,
  taxable_value NUMERIC(15,2) NOT NULL,
  cgst_rate NUMERIC(5,2) DEFAULT 0,
  sgst_rate NUMERIC(5,2) DEFAULT 0,
  igst_rate NUMERIC(5,2) DEFAULT 0,
  cess_rate NUMERIC(5,2) DEFAULT 0,
  cgst_amount NUMERIC(15,2) DEFAULT 0,
  sgst_amount NUMERIC(15,2) DEFAULT 0,
  igst_amount NUMERIC(15,2) DEFAULT 0,
  cess_amount NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gst_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their agency GST settings"
  ON public.gst_settings FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can manage their agency GST returns"
  ON public.gst_returns FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

CREATE POLICY "Users can manage their agency GST transactions"
  ON public.gst_transactions FOR ALL
  USING (agency_id = get_user_agency_id())
  WITH CHECK (agency_id = get_user_agency_id());

-- Create updated_at triggers
CREATE TRIGGER update_gst_settings_updated_at
  BEFORE UPDATE ON public.gst_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_returns_updated_at
  BEFORE UPDATE ON public.gst_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gst_transactions_updated_at
  BEFORE UPDATE ON public.gst_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create utility function for calculating liability
CREATE OR REPLACE FUNCTION public.calculate_gst_liability(
  p_agency_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  total_taxable_value NUMERIC,
  total_cgst NUMERIC,
  total_sgst NUMERIC,
  total_igst NUMERIC,
  total_cess NUMERIC,
  total_tax NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(gt.taxable_value), 0) as total_taxable_value,
    COALESCE(SUM(gt.cgst_amount), 0) as total_cgst,
    COALESCE(SUM(gt.sgst_amount), 0) as total_sgst,
    COALESCE(SUM(gt.igst_amount), 0) as total_igst,
    COALESCE(SUM(gt.cess_amount), 0) as total_cess,
    COALESCE(SUM(gt.cgst_amount + gt.sgst_amount + gt.igst_amount + gt.cess_amount), 0) as total_tax
  FROM public.gst_transactions gt
  WHERE gt.agency_id = p_agency_id
    AND gt.invoice_date BETWEEN p_start_date AND p_end_date
    AND gt.transaction_type IN ('sale', 'debit_note');
END;
$$;