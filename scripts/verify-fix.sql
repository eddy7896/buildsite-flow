-- Verify that current_user_id() function exists and works
SELECT public.current_user_id() as test_result;

-- Test the audit function
SELECT proname, pronamespace::regnamespace 
FROM pg_proc 
WHERE proname IN ('current_user_id', 'audit_trigger_function', 'decrypt_ssn');

