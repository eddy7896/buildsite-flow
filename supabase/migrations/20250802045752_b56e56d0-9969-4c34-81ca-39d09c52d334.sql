-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  website TEXT,
  contact_person TEXT,
  contact_position TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and HR can manage clients"
ON public.clients
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'hr'::app_role) OR
  has_role(auth.uid(), 'finance_manager'::app_role)
);

-- Create function to generate client numbers
CREATE OR REPLACE FUNCTION generate_client_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  client_number TEXT;
BEGIN
  -- Get the next number by counting existing clients and adding 1
  SELECT COUNT(*) + 1 INTO next_num FROM public.clients;
  
  -- Format as CLT-XXX
  client_number := 'CLT-' || LPAD(next_num::TEXT, 3, '0');
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.clients WHERE client_number = client_number) LOOP
    next_num := next_num + 1;
    client_number := 'CLT-' || LPAD(next_num::TEXT, 3, '0');
  END LOOP;
  
  RETURN client_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_created_at ON public.clients(created_at);
CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_email ON public.clients(email);