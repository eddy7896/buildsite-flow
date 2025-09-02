import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  email: string;
  role: string;
  position?: string;
  department?: string;
  phone?: string;
}

// Generate a random password
function generateRandomPassword(length: number = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // lowercase  
  password += "0123456789"[Math.floor(Math.random() * 10)]; // number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authenticated user's info
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Get the current user and their agency
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's profile to find their agency
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('agency_id, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.agency_id) {
      return new Response(
        JSON.stringify({ error: 'User profile or agency not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get agency information
    const { data: agency, error: agencyError } = await supabaseClient
      .from('agencies')
      .select('name, domain')
      .eq('id', profile.agency_id)
      .single();

    if (agencyError || !agency) {
      return new Response(
        JSON.stringify({ error: 'Agency not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user has super_admin role
    const { data: userRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !userRole) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Only super admins can create users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: CreateUserRequest = await req.json();
    const { fullName, email, role, position, department, phone } = body;

    // Validate required fields
    if (!fullName || !email || !role) {
      return new Response(
        JSON.stringify({ error: 'Full name, email, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate random password
    const generatedPassword = generateRandomPassword();

    // Create the user with admin privileges
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
        force_password_reset: true // Flag to force password reset on first login
      }
    });

    if (createUserError) {
      console.error('User creation error:', createUserError);
      return new Response(
        JSON.stringify({ error: `Failed to create user: ${createUserError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const newUserId = newUser.user.id;

    // Create user profile
    const { error: profileCreateError } = await supabaseAdmin
      .from('profiles')
      .insert([{
        user_id: newUserId,
        full_name: fullName,
        phone: phone || null,
        department: department || null,
        position: position || null,
        agency_id: profile.agency_id,
        is_active: true
      }]);

    if (profileCreateError) {
      console.error('Profile creation error:', profileCreateError);
      // Clean up user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileCreateError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign user role
    const { error: roleAssignError } = await supabaseAdmin
      .from('user_roles')
      .insert([{
        user_id: newUserId,
        role: role,
        agency_id: profile.agency_id,
        assigned_by: user.id
      }]);

    if (roleAssignError) {
      console.error('Role assignment error:', roleAssignError);
      // Clean up user and profile if role assignment fails
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return new Response(
        JSON.stringify({ error: `Failed to assign user role: ${roleAssignError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send welcome email
    try {
      const { error: emailError } = await supabaseClient.functions.invoke('send-welcome-email', {
        body: {
          userName: fullName,
          agencyName: agency.name,
          email: email,
          password: generatedPassword,
          userRole: role
        }
      });

      if (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the user creation if email fails, just log it
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Continue without failing
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User created successfully',
        userId: newUserId,
        email: email,
        temporaryPassword: generatedPassword, // Return for admin to see one time
        userRole: role
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