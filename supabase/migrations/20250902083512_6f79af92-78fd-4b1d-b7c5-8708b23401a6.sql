-- Add foreign key relationship between reimbursement_requests and profiles
-- First, we need to add a foreign key from reimbursement_requests.employee_id to profiles.user_id
ALTER TABLE public.reimbursement_requests 
ADD CONSTRAINT fk_reimbursement_requests_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;