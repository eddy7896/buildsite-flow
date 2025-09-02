import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateDemoDataRequest {
  agencyId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { agencyId }: GenerateDemoDataRequest = await req.json();

    if (!agencyId) {
      return new Response(
        JSON.stringify({ error: 'Agency ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating demo data for agency: ${agencyId}`);

    // Generate demo clients
    const demoClients = [
      {
        agency_id: agencyId,
        client_number: 'CLT-001',
        name: 'Tech Innovations Inc',
        company_name: 'Tech Innovations Inc',
        industry: 'Technology',
        email: 'contact@techinnovations.com',
        phone: '+1-555-0123',
        address: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        postal_code: '94105',
        country: 'USA',
        website: 'https://techinnovations.com',
        contact_person: 'John Smith',
        contact_position: 'CTO',
        contact_email: 'john.smith@techinnovations.com',
        contact_phone: '+1-555-0124',
        status: 'active',
        payment_terms: 30,
        notes: 'Demo client - high-value technology company'
      },
      {
        agency_id: agencyId,
        client_number: 'CLT-002',
        name: 'Green Energy Solutions',
        company_name: 'Green Energy Solutions LLC',
        industry: 'Renewable Energy',
        email: 'info@greenenergy.com',
        phone: '+1-555-0125',
        address: '456 Solar Avenue',
        city: 'Austin',
        state: 'TX',
        postal_code: '73301',
        country: 'USA',
        website: 'https://greenenergy.com',
        contact_person: 'Sarah Johnson',
        contact_position: 'Project Manager',
        contact_email: 'sarah.johnson@greenenergy.com',
        contact_phone: '+1-555-0126',
        status: 'active',
        payment_terms: 45,
        notes: 'Demo client - sustainable energy projects'
      },
      {
        agency_id: agencyId,
        client_number: 'CLT-003',
        name: 'Modern Retail Co',
        company_name: 'Modern Retail Co',
        industry: 'Retail',
        email: 'contact@modernretail.com',
        phone: '+1-555-0127',
        address: '789 Commerce Blvd',
        city: 'New York',
        state: 'NY',
        postal_code: '10001',
        country: 'USA',
        website: 'https://modernretail.com',
        contact_person: 'Mike Davis',
        contact_position: 'Operations Director',
        contact_email: 'mike.davis@modernretail.com',
        contact_phone: '+1-555-0128',
        status: 'active',
        payment_terms: 30,
        notes: 'Demo client - e-commerce and retail solutions'
      }
    ];

    // Insert demo clients
    const { data: clientsData, error: clientsError } = await supabaseAdmin
      .from('clients')
      .insert(demoClients)
      .select();

    if (clientsError) {
      console.error('Error creating demo clients:', clientsError);
      throw clientsError;
    }

    console.log(`Created ${clientsData?.length} demo clients`);

    // Generate demo projects/jobs
    const demoJobs = [
      {
        agency_id: agencyId,
        client_id: clientsData![0].id,
        job_number: 'JOB-001',
        title: 'Mobile App Development',
        description: 'Develop a cross-platform mobile application for inventory management',
        status: 'in_progress',
        start_date: '2024-01-15',
        end_date: '2024-04-15',
        estimated_hours: 320,
        actual_hours: 180,
        estimated_cost: 48000,
        actual_cost: 27000,
        budget: 50000,
        profit_margin: 25
      },
      {
        agency_id: agencyId,
        client_id: clientsData![1].id,
        job_number: 'JOB-002',
        title: 'Solar Panel Installation System',
        description: 'Design and implement monitoring system for solar panel installations',
        status: 'planning',
        start_date: '2024-02-01',
        end_date: '2024-05-01',
        estimated_hours: 280,
        actual_hours: 45,
        estimated_cost: 42000,
        actual_cost: 6750,
        budget: 45000,
        profit_margin: 20
      },
      {
        agency_id: agencyId,
        client_id: clientsData![2].id,
        job_number: 'JOB-003',
        title: 'E-commerce Platform Upgrade',
        description: 'Modernize existing e-commerce platform with new features and improved UX',
        status: 'completed',
        start_date: '2023-11-01',
        end_date: '2024-01-31',
        estimated_hours: 240,
        actual_hours: 260,
        estimated_cost: 36000,
        actual_cost: 39000,
        budget: 40000,
        profit_margin: 15
      }
    ];

    const { data: jobsData, error: jobsError } = await supabaseAdmin
      .from('jobs')
      .insert(demoJobs)
      .select();

    if (jobsError) {
      console.error('Error creating demo jobs:', jobsError);
      throw jobsError;
    }

    console.log(`Created ${jobsData?.length} demo jobs`);

    // Generate demo leads
    const demoLeads = [
      {
        agency_id: agencyId,
        lead_number: 'LEAD-001',
        company_name: 'Healthcare Plus',
        contact_name: 'Dr. Emily Chen',
        email: 'emily.chen@healthcareplus.com',
        phone: '+1-555-0129',
        address: '321 Medical Center Dr',
        status: 'qualified',
        priority: 'high',
        estimated_value: 75000,
        probability: 70,
        expected_close_date: '2024-03-15',
        notes: 'Demo lead - interested in healthcare management system'
      },
      {
        agency_id: agencyId,
        lead_number: 'LEAD-002',
        company_name: 'Logistics Pro',
        contact_name: 'Robert Wilson',
        email: 'robert.wilson@logisticspro.com',
        phone: '+1-555-0130',
        address: '654 Distribution Way',
        status: 'contacted',
        priority: 'medium',
        estimated_value: 45000,
        probability: 40,
        expected_close_date: '2024-04-01',
        notes: 'Demo lead - warehouse management solution needed'
      },
      {
        agency_id: agencyId,
        lead_number: 'LEAD-003',
        company_name: 'Education First',
        contact_name: 'Lisa Thompson',
        email: 'lisa.thompson@educationfirst.com',
        phone: '+1-555-0131',
        address: '987 Academic Lane',
        status: 'new',
        priority: 'low',
        estimated_value: 25000,
        probability: 20,
        expected_close_date: '2024-05-01',
        notes: 'Demo lead - student information system upgrade'
      }
    ];

    const { data: leadsData, error: leadsError } = await supabaseAdmin
      .from('leads')
      .insert(demoLeads)
      .select();

    if (leadsError) {
      console.error('Error creating demo leads:', leadsError);
      throw leadsError;
    }

    console.log(`Created ${leadsData?.length} demo leads`);

    // Generate demo quotations
    const demoQuotations = [
      {
        agency_id: agencyId,
        client_id: clientsData![0].id,
        quote_number: 'QUO-001',
        title: 'Mobile App Development Quote',
        description: 'Quotation for cross-platform mobile application development',
        subtotal: 48000,
        tax_rate: 8.25,
        tax_amount: 3960,
        total_amount: 51960,
        status: 'approved',
        valid_until: '2024-03-01',
        terms_conditions: 'Standard terms and conditions apply',
        notes: 'Demo quotation - approved and converted to project'
      },
      {
        agency_id: agencyId,
        client_id: clientsData![1].id,
        quote_number: 'QUO-002',
        title: 'Solar Monitoring System Quote',
        description: 'Quotation for solar panel monitoring system implementation',
        subtotal: 42000,
        tax_rate: 8.25,
        tax_amount: 3465,
        total_amount: 45465,
        status: 'pending',
        valid_until: '2024-03-15',
        terms_conditions: 'Standard terms and conditions apply',
        notes: 'Demo quotation - pending client approval'
      }
    ];

    const { data: quotationsData, error: quotationsError } = await supabaseAdmin
      .from('quotations')
      .insert(demoQuotations)
      .select();

    if (quotationsError) {
      console.error('Error creating demo quotations:', quotationsError);
      throw quotationsError;
    }

    console.log(`Created ${quotationsData?.length} demo quotations`);

    // Generate demo expense categories
    const demoExpenseCategories = [
      {
        name: 'Office Supplies',
        description: 'General office supplies and materials',
        is_active: true
      },
      {
        name: 'Travel & Transportation',
        description: 'Business travel, flights, hotels, and transportation costs',
        is_active: true
      },
      {
        name: 'Software & Licenses',
        description: 'Software subscriptions and license fees',
        is_active: true
      },
      {
        name: 'Marketing & Advertising',
        description: 'Marketing campaigns and advertising expenses',
        is_active: true
      },
      {
        name: 'Training & Education',
        description: 'Employee training and professional development',
        is_active: true
      }
    ];

    const { error: categoriesError } = await supabaseAdmin
      .from('expense_categories')
      .insert(demoExpenseCategories);

    if (categoriesError) {
      console.error('Error creating demo expense categories:', categoriesError);
      throw categoriesError;
    }

    console.log(`Created ${demoExpenseCategories.length} demo expense categories`);

    // Generate demo lead sources
    const demoLeadSources = [
      {
        name: 'Website Contact Form',
        description: 'Leads generated through website contact form',
        is_active: true
      },
      {
        name: 'Referral',
        description: 'Leads from client referrals',
        is_active: true
      },
      {
        name: 'Social Media',
        description: 'Leads from social media platforms',
        is_active: true
      },
      {
        name: 'Trade Shows',
        description: 'Leads from industry trade shows and events',
        is_active: true
      },
      {
        name: 'Cold Outreach',
        description: 'Leads from cold email and phone campaigns',
        is_active: true
      }
    ];

    const { error: sourcesError } = await supabaseAdmin
      .from('lead_sources')
      .insert(demoLeadSources);

    if (sourcesError) {
      console.error('Error creating demo lead sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`Created ${demoLeadSources.length} demo lead sources`);

    // Generate demo job categories
    const demoJobCategories = [
      {
        name: 'Web Development',
        description: 'Website and web application development projects'
      },
      {
        name: 'Mobile Development',
        description: 'Mobile application development for iOS and Android'
      },
      {
        name: 'System Integration',
        description: 'Integration of existing systems and third-party services'
      },
      {
        name: 'Consulting',
        description: 'Technical consulting and advisory services'
      },
      {
        name: 'Maintenance & Support',
        description: 'Ongoing maintenance and technical support'
      }
    ];

    const { error: jobCategoriesError } = await supabaseAdmin
      .from('job_categories')
      .insert(demoJobCategories);

    if (jobCategoriesError) {
      console.error('Error creating demo job categories:', jobCategoriesError);
      throw jobCategoriesError;
    }

    console.log(`Created ${demoJobCategories.length} demo job categories`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Demo data generated successfully',
        summary: {
          clients: clientsData?.length || 0,
          jobs: jobsData?.length || 0,
          leads: leadsData?.length || 0,
          quotations: quotationsData?.length || 0,
          expenseCategories: demoExpenseCategories.length,
          leadSources: demoLeadSources.length,
          jobCategories: demoJobCategories.length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error generating demo data:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to generate demo data' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});