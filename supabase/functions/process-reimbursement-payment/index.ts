import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REIMBURSEMENT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    // Check if user has finance permissions
    const { data: userRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const hasFinanceAccess = userRoles?.some(r => 
      ['finance_manager', 'cfo', 'admin', 'super_admin'].includes(r.role)
    );

    if (!hasFinanceAccess) {
      throw new Error("Insufficient permissions to process payments");
    }

    // Parse request body
    const { reimbursementId, paymentMethod = 'bank_transfer', notes } = await req.json();

    if (!reimbursementId) {
      throw new Error("Reimbursement ID is required");
    }

    logStep("Processing payment", { reimbursementId, paymentMethod });

    // Get reimbursement details
    const { data: reimbursement, error: reimbursementError } = await supabaseAdmin
      .from("reimbursement_requests")
      .select(`
        *,
        profiles:employee_id (full_name, email)
      `)
      .eq("id", reimbursementId)
      .eq("status", "approved")
      .single();

    if (reimbursementError || !reimbursement) {
      throw new Error("Reimbursement request not found or not approved");
    }

    logStep("Found reimbursement", { 
      amount: reimbursement.amount, 
      employee: reimbursement.profiles?.full_name 
    });

    let paymentReference = `REIMB-${reimbursementId.slice(-8)}`;
    let stripePaymentIntentId = null;

    // Process Stripe payment if method is stripe
    if (paymentMethod === 'stripe') {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2023-10-16",
      });

      // Create payment intent for reimbursement
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(reimbursement.amount * 100), // Convert to cents
        currency: reimbursement.currency?.toLowerCase() || 'usd',
        description: `Reimbursement payment for ${reimbursement.profiles?.full_name}`,
        metadata: {
          reimbursement_id: reimbursementId,
          employee_id: reimbursement.employee_id,
          type: 'reimbursement'
        }
      });

      stripePaymentIntentId = paymentIntent.id;
      paymentReference = paymentIntent.id;
      logStep("Stripe payment intent created", { paymentIntentId: paymentIntent.id });
    }

    // Record payment in database
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("reimbursement_payments")
      .insert({
        reimbursement_id: reimbursementId,
        amount: reimbursement.amount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        stripe_payment_intent_id: stripePaymentIntentId,
        processed_by: user.id,
        notes: notes
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    // Update reimbursement status to paid
    const { error: updateError } = await supabaseAdmin
      .from("reimbursement_requests")
      .update({
        status: "paid",
        payment_reference: paymentReference,
        paid_at: new Date().toISOString()
      })
      .eq("id", reimbursementId);

    if (updateError) {
      throw new Error(`Failed to update reimbursement status: ${updateError.message}`);
    }

    logStep("Payment processed successfully", { paymentId: payment.id });

    // Create notification for employee
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: reimbursement.employee_id,
        type: 'in_app',
        category: 'payment',
        title: 'Reimbursement Paid',
        message: `Your reimbursement of $${reimbursement.amount} has been processed and paid.`,
        metadata: {
          reimbursement_id: reimbursementId,
          payment_reference: paymentReference,
          amount: reimbursement.amount
        },
        priority: 'normal'
      });

    logStep("Employee notification created");

    return new Response(JSON.stringify({
      success: true,
      payment: {
        id: payment.id,
        reference: paymentReference,
        amount: reimbursement.amount,
        method: paymentMethod,
        stripe_payment_intent_id: stripePaymentIntentId
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});