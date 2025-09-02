-- First, create agencies for existing users
INSERT INTO agencies (id, name, created_at)
SELECT 
  gen_random_uuid() as id,
  'Default Agency' as name,
  now() as created_at
WHERE NOT EXISTS (SELECT 1 FROM agencies);

-- Update profiles to assign them to the default agency
UPDATE profiles 
SET agency_id = (SELECT id FROM agencies LIMIT 1)
WHERE agency_id IS NULL;

-- Make agency_id NOT NULL in profiles for future data integrity
ALTER TABLE profiles ALTER COLUMN agency_id SET NOT NULL;