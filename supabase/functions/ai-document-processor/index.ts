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

    // Get the uploaded document from form data
    const formData = await req.formData()
    const file = formData.get('document') as File

    if (!file) {
      throw new Error('No document provided')
    }

    console.log('Processing document:', file.name, file.type, file.size)

    // Get user from token
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Store the file in Supabase storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`ai-processing/${fileName}`, file)

    if (uploadError) {
      throw uploadError
    }

    // Process document based on type
    const documentType = detectDocumentType(file.name, file.type)
    const extractedData = await processDocument(file, documentType)

    // Save processing result to database
    const { data: docRecord, error: dbError } = await supabase
      .from('processed_documents')
      .insert({
        filename: file.name,
        type: documentType,
        status: 'completed',
        file_path: uploadData.path,
        extracted_data: extractedData,
        processed_by: user.id,
        file_size: file.size
      })
      .select()
      .single()

    if (dbError) {
      throw dbError
    }

    console.log('Document processed successfully:', docRecord.id)

    return new Response(
      JSON.stringify({
        success: true,
        document: docRecord,
        extractedData
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    )

  } catch (error) {
    console.error('Error processing document:', error)
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

function detectDocumentType(filename: string, mimeType: string): string {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  if (filename.toLowerCase().includes('invoice') || filename.toLowerCase().includes('bill')) {
    return 'invoice'
  }
  if (filename.toLowerCase().includes('contract') || filename.toLowerCase().includes('agreement')) {
    return 'contract'
  }
  if (filename.toLowerCase().includes('receipt') || filename.toLowerCase().includes('expense')) {
    return 'receipt'
  }
  if (filename.toLowerCase().includes('report')) {
    return 'report'
  }
  
  // Default based on file type
  if (mimeType.includes('pdf') || extension === 'pdf') {
    return 'report'
  }
  
  return 'document'
}

async function processDocument(file: File, type: string): Promise<any> {
  // In a real implementation, this would use OCR and NLP services
  // For demo purposes, we'll return mock extracted data
  
  const baseData = {
    filename: file.name,
    size: file.size,
    type: file.type,
    processed_at: new Date().toISOString()
  }

  switch (type) {
    case 'invoice':
      return {
        ...baseData,
        amount: Math.round(Math.random() * 50000 + 1000),
        currency: 'USD',
        invoice_number: `INV-${Math.floor(Math.random() * 10000)}`,
        vendor: getRandomVendor(),
        date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tax_amount: Math.round(Math.random() * 5000),
        line_items: [
          { description: 'Web Development Services', amount: Math.round(Math.random() * 30000 + 5000) },
          { description: 'UI/UX Design', amount: Math.round(Math.random() * 15000 + 2000) }
        ]
      }

    case 'contract':
      return {
        ...baseData,
        parties: ['BuildFlow Agency', getRandomClient()],
        contract_value: Math.round(Math.random() * 100000 + 10000),
        duration: `${Math.floor(Math.random() * 12 + 1)} months`,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: '30 days',
        scope: 'Full-stack web application development and maintenance',
        key_deliverables: [
          'Custom web application',
          'Mobile responsive design',
          'API integration',
          '6 months maintenance'
        ]
      }

    case 'receipt':
      return {
        ...baseData,
        amount: Math.round(Math.random() * 500 + 10),
        vendor: getRandomVendor(),
        category: getRandomExpenseCategory(),
        date: new Date().toISOString().split('T')[0],
        payment_method: Math.random() > 0.5 ? 'Credit Card' : 'Cash',
        tax_amount: Math.round(Math.random() * 50),
        items: [
          { description: 'Office supplies', amount: Math.round(Math.random() * 200 + 20) },
          { description: 'Software license', amount: Math.round(Math.random() * 300 + 50) }
        ]
      }

    case 'report':
      return {
        ...baseData,
        title: 'Monthly Performance Report',
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        key_metrics: {
          revenue: Math.round(Math.random() * 100000 + 50000),
          projects_completed: Math.floor(Math.random() * 20 + 5),
          client_satisfaction: (Math.random() * 2 + 3).toFixed(1),
          team_utilization: Math.round(Math.random() * 30 + 70)
        },
        summary: 'Strong performance across all key metrics with notable improvements in client satisfaction and project delivery times.',
        recommendations: [
          'Increase marketing spend in Q2',
          'Hire 2 additional developers',
          'Implement automated testing workflows'
        ]
      }

    default:
      return {
        ...baseData,
        content_summary: 'Document processed successfully',
        word_count: Math.floor(Math.random() * 5000 + 500),
        language: 'English',
        confidence: Math.round(Math.random() * 20 + 80)
      }
  }
}

function getRandomVendor(): string {
  const vendors = [
    'Office Depot',
    'Adobe Systems',
    'Microsoft Corporation',
    'Amazon Web Services',
    'GitHub Inc',
    'Figma Inc',
    'Slack Technologies',
    'Zoom Video Communications'
  ]
  return vendors[Math.floor(Math.random() * vendors.length)]
}

function getRandomClient(): string {
  const clients = [
    'Tech Startup Inc',
    'E-commerce Solutions Ltd',
    'Digital Marketing Pro',
    'Healthcare Innovation Co',
    'Financial Services Group',
    'Manufacturing Solutions LLC',
    'Retail Chain Corp',
    'Education Platform Ltd'
  ]
  return clients[Math.floor(Math.random() * clients.length)]
}

function getRandomExpenseCategory(): string {
  const categories = [
    'Office Supplies',
    'Software & Tools',
    'Travel & Transportation',
    'Meals & Entertainment',
    'Equipment & Hardware',
    'Professional Services',
    'Marketing & Advertising',
    'Training & Development'
  ]
  return categories[Math.floor(Math.random() * categories.length)]
}