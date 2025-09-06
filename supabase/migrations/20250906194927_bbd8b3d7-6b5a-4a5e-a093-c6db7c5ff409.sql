-- Create holidays table
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  holiday_type TEXT NOT NULL DEFAULT 'company',
  is_recurring BOOLEAN DEFAULT false,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view holidays in their agency"
ON public.holidays
FOR SELECT
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins and HR can manage holidays"
ON public.holidays
FOR ALL
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
)
WITH CHECK (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'hr'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Add updated_at trigger
CREATE TRIGGER update_holidays_updated_at
BEFORE UPDATE ON public.holidays
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();