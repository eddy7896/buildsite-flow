import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-REIMBURSEMENT-NOTIFICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { reimbursementId, notificationType } = await req.json();

    if (!reimbursementId || !notificationType) {
      throw new Error("Reimbursement ID and notification type are required");
    }

    logStep("Processing notification", { reimbursementId, notificationType });

    // Get reimbursement details with employee info
    const { data: reimbursement, error: reimbursementError } = await supabaseAdmin
      .from("reimbursement_requests")
      .select(`
        *,
        profiles:employee_id (full_name, email),
        expense_categories (name),
        reviewer:reviewed_by (full_name)
      `)
      .eq("id", reimbursementId)
      .single();

    if (reimbursementError || !reimbursement) {
      throw new Error("Reimbursement request not found");
    }

    const employeeEmail = reimbursement.profiles?.email;
    const employeeName = reimbursement.profiles?.full_name || "Employee";

    if (!employeeEmail) {
      throw new Error("Employee email not found");
    }

    logStep("Found reimbursement details", { 
      employee: employeeName, 
      email: employeeEmail,
      status: reimbursement.status 
    });

    let subject = "";
    let htmlContent = "";

    // Generate email content based on notification type
    switch (notificationType) {
      case 'submitted':
        subject = "Reimbursement Request Submitted Successfully";
        htmlContent = `
          <h2>Reimbursement Request Submitted</h2>
          <p>Dear ${employeeName},</p>
          <p>Your reimbursement request has been submitted successfully and is now under review.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3>Request Details:</h3>
            <p><strong>Amount:</strong> ${reimbursement.currency} ${reimbursement.amount}</p>
            <p><strong>Category:</strong> ${reimbursement.expense_categories?.name}</p>
            <p><strong>Description:</strong> ${reimbursement.description}</p>
            <p><strong>Date:</strong> ${new Date(reimbursement.expense_date).toLocaleDateString()}</p>
          </div>
          <p>You will receive an email notification once your request has been reviewed.</p>
          <p>Best regards,<br>BuildFlow Team</p>
        `;
        break;

      case 'approved':
        subject = "Reimbursement Request Approved";
        htmlContent = `
          <h2 style="color: #22c55e;">Reimbursement Request Approved ✅</h2>
          <p>Dear ${employeeName},</p>
          <p>Great news! Your reimbursement request has been approved.</p>
          <div style="background-color: #f0fdf4; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #22c55e;">
            <h3>Approved Request:</h3>
            <p><strong>Amount:</strong> ${reimbursement.currency} ${reimbursement.amount}</p>
            <p><strong>Category:</strong> ${reimbursement.expense_categories?.name}</p>
            <p><strong>Approved by:</strong> ${reimbursement.reviewer?.full_name || "Finance Team"}</p>
            <p><strong>Approved on:</strong> ${new Date(reimbursement.reviewed_at).toLocaleDateString()}</p>
          </div>
          <p>Your reimbursement will be processed for payment shortly. You'll receive another notification once the payment has been completed.</p>
          <p>Best regards,<br>BuildFlow Team</p>
        `;
        break;

      case 'rejected':
        subject = "Reimbursement Request Rejected";
        htmlContent = `
          <h2 style="color: #ef4444;">Reimbursement Request Rejected</h2>
          <p>Dear ${employeeName},</p>
          <p>Unfortunately, your reimbursement request has been rejected.</p>
          <div style="background-color: #fef2f2; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ef4444;">
            <h3>Rejected Request:</h3>
            <p><strong>Amount:</strong> ${reimbursement.currency} ${reimbursement.amount}</p>
            <p><strong>Category:</strong> ${reimbursement.expense_categories?.name}</p>
            <p><strong>Rejected by:</strong> ${reimbursement.reviewer?.full_name || "Finance Team"}</p>
            <p><strong>Rejected on:</strong> ${new Date(reimbursement.reviewed_at).toLocaleDateString()}</p>
            ${reimbursement.rejection_reason ? `<p><strong>Reason:</strong> ${reimbursement.rejection_reason}</p>` : ''}
          </div>
          <p>If you have questions about this decision, please contact your manager or the finance team.</p>
          <p>Best regards,<br>BuildFlow Team</p>
        `;
        break;

      case 'paid':
        subject = "Reimbursement Payment Processed";
        htmlContent = `
          <h2 style="color: #3b82f6;">Reimbursement Payment Processed 💰</h2>
          <p>Dear ${employeeName},</p>
          <p>Your reimbursement payment has been processed successfully!</p>
          <div style="background-color: #eff6ff; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #3b82f6;">
            <h3>Payment Details:</h3>
            <p><strong>Amount:</strong> ${reimbursement.currency} ${reimbursement.amount}</p>
            <p><strong>Payment Reference:</strong> ${reimbursement.payment_reference}</p>
            <p><strong>Payment Date:</strong> ${new Date(reimbursement.paid_at).toLocaleDateString()}</p>
          </div>
          <p>The payment should appear in your account within 1-3 business days depending on your bank.</p>
          <p>Best regards,<br>BuildFlow Team</p>
        `;
        break;

      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "BuildFlow <noreply@buildflow.app>",
      to: [employeeEmail],
      subject: subject,
      html: htmlContent,
    });

    logStep("Email sent successfully", { messageId: emailResponse.data?.id });

    return new Response(JSON.stringify({
      success: true,
      message: "Notification sent successfully",
      emailId: emailResponse.data?.id
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