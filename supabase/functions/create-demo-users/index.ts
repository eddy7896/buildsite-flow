import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client for user management
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

    // Demo users to create
    const demoUsers = [
      {
        email: 'super@buildflow.com',
        password: 'super123',
        user_id: '00000000-0000-0000-0000-000000000001',
        full_name: 'Super Administrator',
        role: 'super_admin'
      },
      {
        email: 'admin@buildflow.com',
        password: 'admin123',
        user_id: '00000000-0000-0000-0000-000000000002',
        full_name: 'Demo Administrator',
        role: 'admin'
      },
      {
        email: 'hr@buildflow.com',
        password: 'hr123',
        user_id: '00000000-0000-0000-0000-000000000003',
        full_name: 'Demo HR Manager',
        role: 'hr'
      },
      {
        email: 'finance@buildflow.com',
        password: 'finance123',
        user_id: '00000000-0000-0000-0000-000000000004',
        full_name: 'Demo Finance Manager',
        role: 'finance_manager'
      },
      {
        email: 'employee@buildflow.com',
        password: 'employee123',
        user_id: '00000000-0000-0000-0000-000000000005',
        full_name: 'Demo Employee',
        role: 'employee'
      }
    ];

    const results = [];

    for (const demoUser of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(demoUser.user_id);
        
        if (existingUser.user) {
          console.log(`User ${demoUser.email} already exists, skipping creation`);
          results.push({
            email: demoUser.email,
            status: 'already_exists',
            user_id: demoUser.user_id
          });
          continue;
        }

        // Create auth user with fixed UUID
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: demoUser.email,
          password: demoUser.password,
          email_confirm: true, // Skip email confirmation for demo users
          user_metadata: {
            full_name: demoUser.full_name
          }
        });

        if (createError) {
          console.error(`Error creating user ${demoUser.email}:`, createError);
          results.push({
            email: demoUser.email,
            status: 'error',
            error: createError.message
          });
          continue;
        }

        // Update the user ID to match our fixed UUIDs (for consistency with profiles)
        if (newUser.user) {
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            newUser.user.id,
            {
              email: demoUser.email,
              user_metadata: {
                full_name: demoUser.full_name
              }
            }
          );

          if (updateError) {
            console.error(`Error updating user ${demoUser.email}:`, updateError);
          }

          // Update our database records to use the actual auth user ID
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ user_id: newUser.user.id })
            .eq('user_id', demoUser.user_id);

          if (profileError) {
            console.error(`Error updating profile for ${demoUser.email}:`, profileError);
          }

          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .update({ user_id: newUser.user.id })
            .eq('user_id', demoUser.user_id);

          if (roleError) {
            console.error(`Error updating role for ${demoUser.email}:`, roleError);
          }

          console.log(`Successfully created user ${demoUser.email} with ID ${newUser.user.id}`);
          results.push({
            email: demoUser.email,
            status: 'created',
            user_id: newUser.user.id
          });
        }

      } catch (error) {
        console.error(`Unexpected error for ${demoUser.email}:`, error);
        results.push({
          email: demoUser.email,
          status: 'error',
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo users processing completed',
        results: results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in create-demo-users function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});