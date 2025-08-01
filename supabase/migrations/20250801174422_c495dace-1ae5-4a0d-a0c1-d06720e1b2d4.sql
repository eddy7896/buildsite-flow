-- Create agency_settings table for storing agency information
CREATE TABLE public.agency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for agency settings
CREATE POLICY "Admins can manage agency settings" 
ON public.agency_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "All authenticated users can view agency settings" 
ON public.agency_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agency_settings_updated_at
BEFORE UPDATE ON public.agency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default agency settings
INSERT INTO public.agency_settings (agency_name, logo_url) 
VALUES ('Your Agency Name', NULL);