import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string;
  profile_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with service role
    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, password, full_name, profile_id }: CreateUserRequest = await req.json();

    if (!email || !password || !profile_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, password, profile_id' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Creating user account for: ${email}`);

    // Create the user using service role
    const { data: userData, error: createUserError } = await supabaseServiceRole.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        full_name: full_name || '',
      },
      email_confirm: true, // Auto-confirm email
    });

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      return new Response(
        JSON.stringify({ error: createUserError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`User created successfully: ${userData.user.id}`);

    // Update the profile with the new user_id
    const { error: updateProfileError } = await supabaseServiceRole
      .from('profiles')
      .update({ user_id: userData.user.id })
      .eq('id', profile_id);

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError);
      // User was created but profile update failed
      return new Response(
        JSON.stringify({ 
          error: 'User created but profile update failed',
          user: userData.user 
        }),
        {
          status: 207, // Partial success
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Profile updated successfully for user: ${userData.user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData.user,
        message: 'User account created and profile updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Unexpected error in create-user-account function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);