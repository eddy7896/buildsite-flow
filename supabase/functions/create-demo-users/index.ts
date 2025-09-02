import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

// Helper functions for default values
const getDefaultDepartment = (role: string) => {
  switch (role) {
    case 'super_admin': return 'System Administration';
    case 'admin': return 'Administration';
    case 'hr': return 'Human Resources';
    case 'finance_manager': return 'Finance';
    case 'employee': return 'Construction';
    default: return 'General';
  }
};

const getDefaultPosition = (role: string) => {
  switch (role) {
    case 'super_admin': return 'Super Admin';
    case 'admin': return 'System Admin';
    case 'hr': return 'HR Manager';
    case 'finance_manager': return 'Finance Manager';
    case 'employee': return 'Site Worker';
    default: return 'Employee';
  }
};

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
        // Check if user already exists by email
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers.users?.find(u => u.email === demoUser.email);
        
        if (existingUser) {
          console.log(`User ${demoUser.email} already exists with ID ${existingUser.id}`);
          
          // Make sure profile and role exist for existing user
          const { data: agencyData } = await supabaseAdmin
            .from('agencies')
            .select('id')
            .limit(1)
            .single();

          const agencyId = agencyData?.id;

          // Upsert profile for existing user
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
              user_id: existingUser.id,
              full_name: demoUser.full_name,
              department: getDefaultDepartment(demoUser.role),
              position: getDefaultPosition(demoUser.role),
              agency_id: agencyId,
              is_active: true
            });

          if (profileError) {
            console.error(`Error upserting profile for ${demoUser.email}:`, profileError);
          }

          // Upsert role for existing user
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .upsert({
              user_id: existingUser.id,
              role: demoUser.role
            });

          if (roleError) {
            console.error(`Error upserting role for ${demoUser.email}:`, roleError);
          }

          results.push({
            email: demoUser.email,
            status: 'updated',
            user_id: existingUser.id
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
          // Delete old records with hardcoded UUIDs first
          await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', demoUser.user_id);

          await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('user_id', demoUser.user_id);

          // Get agency ID for the user
          const { data: agencyData } = await supabaseAdmin
            .from('agencies')
            .select('id')
            .limit(1)
            .single();

          const agencyId = agencyData?.id;

          // Create new profile with correct auth user ID
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              user_id: newUser.user.id,
              full_name: demoUser.full_name,
              department: getDefaultDepartment(demoUser.role),
              position: getDefaultPosition(demoUser.role),
              agency_id: agencyId,
              is_active: true
            });

          if (profileError) {
            console.error(`Error creating profile for ${demoUser.email}:`, profileError);
          }

          // Create new role with correct auth user ID
          const { error: roleError } = await supabaseAdmin
            .from('user_roles')
            .insert({
              user_id: newUser.user.id,
              role: demoUser.role
            });

          if (roleError) {
            console.error(`Error creating role for ${demoUser.email}:`, roleError);
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