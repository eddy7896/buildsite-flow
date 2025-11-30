-- Fix missing get_user_agency_id function
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT agency_id 
  FROM public.profiles 
  WHERE user_id = public.current_user_id()
$$;
