-- Create company events table
CREATE TABLE public.company_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  all_day BOOLEAN DEFAULT false,
  location TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  color TEXT DEFAULT '#3b82f6',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  attendees JSONB DEFAULT '[]'::jsonb
);

-- Create holidays table
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_company_holiday BOOLEAN DEFAULT true,
  is_national_holiday BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create calendar settings table
CREATE TABLE public.calendar_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL,
  show_birthdays BOOLEAN DEFAULT true,
  show_leave_requests BOOLEAN DEFAULT true,
  show_company_events BOOLEAN DEFAULT true,
  show_holidays BOOLEAN DEFAULT true,
  default_view TEXT DEFAULT 'month',
  working_days JSONB DEFAULT '[1,2,3,4,5]'::jsonb,
  working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add birthday field to employee_details if not exists
ALTER TABLE public.employee_details 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Enable RLS
ALTER TABLE public.company_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_events
CREATE POLICY "Users can view events in their agency" 
ON public.company_events 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins and HR can manage events" 
ON public.company_events 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- RLS Policies for holidays
CREATE POLICY "Users can view holidays in their agency" 
ON public.holidays 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins and HR can manage holidays" 
ON public.holidays 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR 
   has_role(auth.uid(), 'hr'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- RLS Policies for calendar_settings
CREATE POLICY "Users can view calendar settings in their agency" 
ON public.calendar_settings 
FOR SELECT 
USING (agency_id = get_user_agency_id());

CREATE POLICY "Admins can manage calendar settings" 
ON public.calendar_settings 
FOR ALL 
USING (
  agency_id = get_user_agency_id() AND 
  (has_role(auth.uid(), 'admin'::app_role) OR
   has_role(auth.uid(), 'super_admin'::app_role))
);

-- Add triggers for updated_at
CREATE TRIGGER update_company_events_updated_at
  BEFORE UPDATE ON public.company_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at
  BEFORE UPDATE ON public.calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add agency_id trigger for automatic population
CREATE TRIGGER set_agency_id_company_events
  BEFORE INSERT ON public.company_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_holidays
  BEFORE INSERT ON public.holidays
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

CREATE TRIGGER set_agency_id_calendar_settings
  BEFORE INSERT ON public.calendar_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_agency_id();

-- Create indexes for better performance
CREATE INDEX idx_company_events_agency_date ON public.company_events(agency_id, start_date);
CREATE INDEX idx_holidays_agency_date ON public.holidays(agency_id, date);
CREATE INDEX idx_calendar_settings_agency ON public.calendar_settings(agency_id);