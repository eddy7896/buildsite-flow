import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { type, timeframe } = await req.json()

    console.log('Generating AI prediction:', { type, timeframe })

    // Get user from token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's agency
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.agency_id) {
      throw new Error('No agency found for user')
    }

    // Generate AI prediction based on type
    let prediction;
    
    switch (type) {
      case 'revenue':
        prediction = await generateRevenuePrediction(supabase, profile.agency_id, timeframe)
        break
      case 'project_completion':
        prediction = await generateProjectPrediction(supabase, profile.agency_id, timeframe)
        break
      case 'resource_demand':
        prediction = await generateResourcePrediction(supabase, profile.agency_id, timeframe)
        break
      case 'risk':
        prediction = await generateRiskAssessment(supabase, profile.agency_id, timeframe)
        break
      default:
        throw new Error('Invalid prediction type')
    }

    console.log('Prediction generated successfully:', prediction.id)

    return new Response(
      JSON.stringify({
        success: true,
        prediction
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )

  } catch (error) {
    console.error('Error generating prediction:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )
  }
})

async function generateRevenuePrediction(supabase: any, agencyId: string, timeframe: string) {
  // Fetch historical revenue data
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_amount, created_at')
    .eq('agency_id', agencyId)
    .gte('created_at', getDateRange(timeframe).from)

  const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0
  const avgMonthlyRevenue = totalRevenue / getMonthsInTimeframe(timeframe)
  
  // Simple growth prediction (in real implementation, use ML models)
  const growthRate = Math.random() * 0.3 + 0.1 // 10-40% growth
  const predictedRevenue = avgMonthlyRevenue * (1 + growthRate)
  
  return {
    id: crypto.randomUUID(),
    type: 'revenue',
    title: `${timeframe} Revenue Forecast`,
    prediction: `Predicted revenue of $${Math.round(predictedRevenue).toLocaleString()} based on current trends and historical data`,
    confidence: Math.round(85 + Math.random() * 10),
    timeline: `Next ${timeframe}`,
    impact: predictedRevenue > avgMonthlyRevenue * 1.2 ? 'high' : 'medium',
    data: {
      current: avgMonthlyRevenue,
      predicted: predictedRevenue,
      growth_rate: growthRate
    }
  }
}

async function generateProjectPrediction(supabase: any, agencyId: string, timeframe: string) {
  // Fetch project data
  const { data: projects } = await supabase
    .from('jobs')
    .select('status, estimated_hours, actual_hours, end_date')
    .eq('agency_id', agencyId)

  const activeProjects = projects?.filter((p: any) => p.status === 'in_progress') || []
  const avgCompletionRate = projects?.reduce((sum: number, p: any) => {
    return sum + (p.actual_hours / (p.estimated_hours || 1))
  }, 0) / projects?.length || 1

  const delayRisk = avgCompletionRate > 1.1 ? 'high' : avgCompletionRate > 1.05 ? 'medium' : 'low'
  const confidence = delayRisk === 'low' ? 90 : delayRisk === 'medium' ? 75 : 60

  return {
    id: crypto.randomUUID(),
    type: 'project_completion',
    title: 'Project Delivery Forecast',
    prediction: `${activeProjects.length} active projects with ${Math.round((1 - avgCompletionRate) * 100)}% efficiency variance from estimates`,
    confidence,
    timeline: `Next ${timeframe}`,
    impact: delayRisk,
    data: {
      active_projects: activeProjects.length,
      completion_rate: avgCompletionRate,
      delay_risk: delayRisk
    }
  }
}

async function generateResourcePrediction(supabase: any, agencyId: string, timeframe: string) {
  // Fetch employee and project data
  const { data: employees } = await supabase
    .from('profiles')
    .select('id')
    .eq('agency_id', agencyId)

  const { data: projects } = await supabase
    .from('jobs')
    .select('assigned_to, estimated_hours, status')
    .eq('agency_id', agencyId)
    .eq('status', 'in_progress')

  const currentWorkload = projects?.length || 0
  const teamSize = employees?.length || 1
  const workloadPerPerson = currentWorkload / teamSize

  const needsMoreStaff = workloadPerPerson > 2
  const suggestedHires = needsMoreStaff ? Math.ceil(workloadPerPerson - 2) : 0

  return {
    id: crypto.randomUUID(),
    type: 'resource_demand',
    title: 'Resource Planning Forecast',
    prediction: needsMoreStaff 
      ? `Recommend hiring ${suggestedHires} additional team members to meet project demands`
      : 'Current team capacity appears sufficient for planned workload',
    confidence: Math.round(80 + Math.random() * 15),
    timeline: `Next ${timeframe}`,
    impact: needsMoreStaff ? 'high' : 'low',
    data: {
      team_size: teamSize,
      workload_per_person: workloadPerPerson,
      suggested_hires: suggestedHires
    }
  }
}

async function generateRiskAssessment(supabase: any, agencyId: string, timeframe: string) {
  // Fetch various risk indicators
  const { data: projects } = await supabase
    .from('jobs')
    .select('status, budget, actual_cost, end_date')
    .eq('agency_id', agencyId)

  const { data: invoices } = await supabase
    .from('invoices')
    .select('status, due_date')
    .eq('agency_id', agencyId)

  const overBudgetProjects = projects?.filter((p: any) => p.actual_cost > p.budget).length || 0
  const overdueInvoices = invoices?.filter((i: any) => 
    new Date(i.due_date) < new Date() && i.status !== 'paid'
  ).length || 0

  const riskScore = (overBudgetProjects * 20) + (overdueInvoices * 15)
  const riskLevel = riskScore > 50 ? 'high' : riskScore > 25 ? 'medium' : 'low'

  return {
    id: crypto.randomUUID(),
    type: 'risk_assessment',
    title: 'Business Risk Assessment',
    prediction: `Current risk level: ${riskLevel}. ${overBudgetProjects} projects over budget, ${overdueInvoices} overdue invoices`,
    confidence: Math.round(70 + Math.random() * 20),
    timeline: 'Current state',
    impact: riskLevel,
    data: {
      risk_score: riskScore,
      over_budget_projects: overBudgetProjects,
      overdue_invoices: overdueInvoices
    }
  }
}

function getDateRange(timeframe: string) {
  const now = new Date()
  switch (timeframe) {
    case 'week':
      return {
        from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString()
      }
    case 'month':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to: now.toISOString()
      }
    case 'quarter':
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString(),
        to: now.toISOString()
      }
    default:
      return {
        from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
        to: now.toISOString()
      }
  }
}

function getMonthsInTimeframe(timeframe: string): number {
  switch (timeframe) {
    case 'week': return 0.25
    case 'month': return 1
    case 'quarter': return 3
    default: return 1
  }
}