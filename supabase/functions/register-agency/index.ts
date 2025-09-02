import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistrationRequest {
  agencyName: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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
    );

    const body: RegistrationRequest = await req.json();
    const { agencyName, domain, adminName, adminEmail, adminPassword } = body;

    // Validate required fields
    if (!agencyName || !domain || !adminName || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if domain already exists
    const { data: existingAgency } = await supabaseAdmin
      .from('agencies')
      .select('id')
      .eq('domain', domain)
      .single();

    if (existingAgency) {
      return new Response(
        JSON.stringify({ error: 'Domain already exists. Please choose a different one.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: 'super_admin'
      }
    });

    if (userError) {
      console.error('User creation error:', userError);
      return new Response(
        JSON.stringify({ error: `Failed to create admin user: ${userError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Create the agency
    const { data: agencyData, error: agencyError } = await supabaseAdmin
      .from('agencies')
      .insert([{
        name: agencyName,
        domain: domain,
        is_active: true
      }])
      .select()
      .single();

    if (agencyError) {
      console.error('Agency creation error:', agencyError);
      // Clean up user if agency creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Failed to create agency: ${agencyError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const agencyId = agencyData.id;

    // Create user profile with agency_id
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        user_id: userId,
        full_name: adminName,
        agency_id: agencyId,
        is_active: true
      }]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Clean up user and agency if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('agencies').delete().eq('id', agencyId);
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign super_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: userId,
        role: 'super_admin',
        agency_id: agencyId,
        assigned_by: userId
      }]);

    if (roleError) {
      console.error('Role assignment error:', roleError);
      // Clean up user, agency, and profile if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('agencies').delete().eq('id', agencyId);
      return new Response(
        JSON.stringify({ error: `Failed to assign super admin role: ${roleError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create default agency settings
    const { error: settingsError } = await supabaseAdmin
      .from('agency_settings')
      .insert([{
        agency_id: agencyId,
        agency_name: agencyName,
        domain: domain,
        default_currency: 'US'
      }]);

    if (settingsError) {
      console.error('Agency settings creation error:', settingsError);
      // Note: We don't clean up here as the core functionality is complete
      // Agency settings can be created later if needed
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Agency and admin user created successfully',
        agencyId: agencyId,
        userId: userId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});