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

    const { reportType, dateRange, format = 'pdf' } = await req.json()

    console.log('Generating report:', { reportType, dateRange, format })

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

    let reportData: any = {}
    let fileName = ''

    switch (reportType) {
      case 'financial':
        reportData = await generateFinancialReport(supabase, profile.agency_id, dateRange)
        fileName = `financial-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      
      case 'projects':
        reportData = await generateProjectReport(supabase, profile.agency_id, dateRange)
        fileName = `project-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      
      case 'workforce':
        reportData = await generateWorkforceReport(supabase, profile.agency_id, dateRange)
        fileName = `workforce-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      
      case 'dashboard':
        reportData = await generateDashboardReport(supabase, profile.agency_id, dateRange)
        fileName = `dashboard-report-${new Date().toISOString().split('T')[0]}.${format}`
        break
      
      default:
        throw new Error('Invalid report type')
    }

    // Store report metadata
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        description: `${reportType} report generated on ${new Date().toLocaleDateString()}`,
        report_type: reportType,
        file_name: fileName,
        file_path: `reports/${fileName}`,
        parameters: { dateRange, format },
        generated_by: user.id,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      })
      .select()
      .single()

    if (reportError) {
      throw reportError
    }

    console.log('Report generated successfully:', report.id)

    return new Response(
      JSON.stringify({
        success: true,
        reportId: report.id,
        fileName,
        data: reportData
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )

  } catch (error) {
    console.error('Error generating report:', error)
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

async function generateFinancialReport(supabase: any, agencyId: string, dateRange: any) {
  const fromDate = dateRange?.from || new Date(new Date().getFullYear(), 0, 1)
  const toDate = dateRange?.to || new Date()

  // Fetch financial data
  const [
    { data: invoices },
    { data: reimbursements },
    { data: journalEntries }
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString()),
    supabase
      .from('reimbursement_requests')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString()),
    supabase
      .from('journal_entries')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('entry_date', fromDate.toISOString().split('T')[0])
      .lte('entry_date', toDate.toISOString().split('T')[0])
  ])

  const totalRevenue = invoices?.reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0) || 0
  const totalExpenses = reimbursements?.reduce((sum: number, reimb: any) => sum + (reimb.amount || 0), 0) || 0
  const netIncome = totalRevenue - totalExpenses

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      netIncome,
      profitMargin: totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0
    },
    invoices: invoices || [],
    expenses: reimbursements || [],
    journalEntries: journalEntries || [],
    generatedAt: new Date().toISOString(),
    period: { from: fromDate, to: toDate }
  }
}

async function generateProjectReport(supabase: any, agencyId: string, dateRange: any) {
  const fromDate = dateRange?.from || new Date(new Date().getFullYear(), 0, 1)
  const toDate = dateRange?.to || new Date()

  const { data: projects } = await supabase
    .from('jobs')
    .select(`
      *,
      clients(name, company_name),
      job_categories(name)
    `)
    .eq('agency_id', agencyId)
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())

  const statusCounts = projects?.reduce((acc: any, project: any) => {
    acc[project.status] = (acc[project.status] || 0) + 1
    return acc
  }, {}) || {}

  const totalBudget = projects?.reduce((sum: number, proj: any) => sum + (proj.budget || 0), 0) || 0
  const totalActualCost = projects?.reduce((sum: number, proj: any) => sum + (proj.actual_cost || 0), 0) || 0

  return {
    summary: {
      totalProjects: projects?.length || 0,
      statusBreakdown: statusCounts,
      totalBudget,
      totalActualCost,
      budgetVariance: totalBudget - totalActualCost
    },
    projects: projects || [],
    generatedAt: new Date().toISOString(),
    period: { from: fromDate, to: toDate }
  }
}

async function generateWorkforceReport(supabase: any, agencyId: string, dateRange: any) {
  const fromDate = dateRange?.from || new Date(new Date().getFullYear(), 0, 1)
  const toDate = dateRange?.to || new Date()

  const [
    { data: employees },
    { data: attendance },
    { data: leaveRequests }
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(`
        *,
        employee_details(*)
      `)
      .eq('agency_id', agencyId),
    supabase
      .from('attendance')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('date', fromDate.toISOString().split('T')[0])
      .lte('date', toDate.toISOString().split('T')[0]),
    supabase
      .from('leave_requests')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('start_date', fromDate.toISOString().split('T')[0])
      .lte('end_date', toDate.toISOString().split('T')[0])
  ])

  const departmentBreakdown = employees?.reduce((acc: any, emp: any) => {
    const dept = emp.department || 'Unassigned'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {}) || {}

  const totalWorkingHours = attendance?.reduce((sum: number, att: any) => sum + (att.total_hours || 0), 0) || 0
  const avgWorkingHours = attendance?.length ? totalWorkingHours / attendance.length : 0

  return {
    summary: {
      totalEmployees: employees?.length || 0,
      activeEmployees: employees?.filter((e: any) => e.is_active).length || 0,
      departmentBreakdown,
      totalWorkingHours,
      avgWorkingHours,
      totalLeaveRequests: leaveRequests?.length || 0
    },
    employees: employees || [],
    attendance: attendance || [],
    leaveRequests: leaveRequests || [],
    generatedAt: new Date().toISOString(),
    period: { from: fromDate, to: toDate }
  }
}

async function generateDashboardReport(supabase: any, agencyId: string, dateRange: any) {
  const [financial, projects, workforce] = await Promise.all([
    generateFinancialReport(supabase, agencyId, dateRange),
    generateProjectReport(supabase, agencyId, dateRange),
    generateWorkforceReport(supabase, agencyId, dateRange)
  ])

  return {
    executive_summary: {
      revenue: financial.summary.totalRevenue,
      expenses: financial.summary.totalExpenses,
      profit_margin: financial.summary.profitMargin,
      active_projects: projects.summary.totalProjects,
      total_employees: workforce.summary.totalEmployees,
      productivity_score: 85 // Mock metric
    },
    financial,
    projects,
    workforce,
    generatedAt: new Date().toISOString()
  }
}