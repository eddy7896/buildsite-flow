-- Add more comprehensive expense categories
-- This script adds additional expense categories to the database

-- Check if agency_id column exists, if not, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expense_categories' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.expense_categories ADD COLUMN agency_id UUID REFERENCES public.agencies(id);
    CREATE INDEX IF NOT EXISTS idx_expense_categories_agency_id ON public.expense_categories(agency_id);
  END IF;
END $$;

-- Get the first agency_id to use for categories
DO $$
DECLARE
  first_agency_id UUID;
BEGIN
  SELECT id INTO first_agency_id FROM public.agencies LIMIT 1;
  
  -- If no agency exists, we'll use NULL (categories will be global)
  -- Otherwise, add categories for the first agency
  
  -- Additional Expense Categories
  INSERT INTO public.expense_categories (name, description, is_active, agency_id, created_at)
  SELECT 
    name,
    description,
    true,
    first_agency_id,
    NOW()
  FROM (VALUES
    ('Equipment & Hardware', 'Computer hardware, printers, monitors, and other equipment'),
    ('Internet & Phone', 'Internet service, phone bills, and communication expenses'),
    ('Utilities', 'Electricity, water, gas, and other utility bills'),
    ('Rent & Office Space', 'Office rent, co-working space, and facility expenses'),
    ('Marketing & Advertising', 'Marketing campaigns, ads, promotional materials'),
    ('Professional Services', 'Legal, accounting, consulting, and other professional services'),
    ('Insurance', 'Business insurance, health insurance, liability insurance'),
    ('Vehicle & Fuel', 'Company vehicle expenses, fuel, maintenance, parking'),
    ('Entertainment', 'Client entertainment, team events, corporate hospitality'),
    ('Banking & Finance', 'Bank fees, transaction charges, financial services'),
    ('Taxes & Compliance', 'Tax payments, compliance fees, regulatory expenses'),
    ('Maintenance & Repairs', 'Office maintenance, equipment repairs, facility upkeep'),
    ('Subscriptions', 'Software subscriptions, service subscriptions, memberships'),
    ('Conference & Events', 'Conference fees, event tickets, trade show expenses'),
    ('Books & Publications', 'Business books, magazines, educational materials'),
    ('Gifts & Rewards', 'Employee gifts, client gifts, recognition awards'),
    ('Shipping & Postage', 'Courier services, shipping costs, postage'),
    ('Security', 'Security services, surveillance, access control systems'),
    ('Cleaning Services', 'Office cleaning, janitorial services'),
    ('Legal & Compliance', 'Legal fees, compliance consulting, regulatory expenses')
  ) AS new_categories(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.expense_categories ec 
    WHERE ec.name = new_categories.name 
    AND (ec.agency_id = first_agency_id OR (ec.agency_id IS NULL AND first_agency_id IS NULL))
  );

  -- Update existing categories to have agency_id if they don't have one
  UPDATE public.expense_categories
  SET agency_id = first_agency_id
  WHERE agency_id IS NULL AND first_agency_id IS NOT NULL;
END $$;

