-- Create some sample agencies for system dashboard testing
INSERT INTO agencies (id, name, domain, subscription_plan, max_users, is_active) VALUES
(gen_random_uuid(), 'Acme Construction', 'acme-construction.com', 'pro', 50, true),
(gen_random_uuid(), 'BuildRight Inc', 'buildright.com', 'enterprise', 100, true),
(gen_random_uuid(), 'Skyline Builders', 'skylinebuilders.com', 'basic', 25, true),
(gen_random_uuid(), 'Prime Development', 'primedevelopment.com', 'pro', 75, true),
(gen_random_uuid(), 'Modern Constructs', 'modernconstructs.com', 'basic', 20, false)
ON CONFLICT (id) DO NOTHING;