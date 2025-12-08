import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { Download, Printer, Mail, X, Building, MapPin, Phone, Mail as MailIcon, Calendar, FileText } from 'lucide-react';

interface Quotation {
  id: string;
  quote_number: string;
  client_id: string;
  template_id?: string | null;
  title: string;
  description?: string;
  status: string;
  valid_until: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  terms_conditions?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
  billing_country?: string;
  tax_id?: string;
}

interface LineItem {
  id: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  line_total: number;
  sort_order: number;
}

interface AgencyInfo {
  agency_name?: string;
  logo_url?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_id?: string;
}

interface QuotationPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotationId: string | null;
}

const QuotationPreviewDialog: React.FC<QuotationPreviewDialogProps> = ({
  isOpen,
  onClose,
  quotationId,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo>({});

  useEffect(() => {
    if (isOpen && quotationId) {
      fetchQuotationData();
    }
  }, [isOpen, quotationId]);

  const fetchQuotationData = async () => {
    try {
      setLoading(true);

      // Fetch quotation
      const { data: quotationData, error: quotationError } = await db
        .from('quotations')
        .select('*')
        .eq('id', quotationId)
        .single();

      if (quotationError) throw quotationError;
      if (!quotationData) {
        toast({
          title: 'Error',
          description: 'Quotation not found',
          variant: 'destructive',
        });
        return;
      }

      setQuotation(quotationData);

      // Fetch client
      if (quotationData.client_id) {
        const { data: clientData, error: clientError } = await db
          .from('clients')
          .select('*')
          .eq('id', quotationData.client_id)
          .single();

        if (!clientError && clientData) {
          setClient(clientData);
        }
      }

      // Fetch line items
      const { data: lineItemsData, error: lineItemsError } = await db
        .from('quotation_line_items')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('sort_order', { ascending: true });

      if (!lineItemsError && lineItemsData) {
        setLineItems(lineItemsData);
      }

      // Fetch agency info
      const { data: agencyData, error: agencyError } = await db
        .from('agency_settings')
        .select('*')
        .limit(1)
        .single();

      if (!agencyError && agencyData) {
        setAgencyInfo({
          agency_name: agencyData.agency_name,
          logo_url: agencyData.logo_url,
          address: agencyData.address,
          city: agencyData.city,
          state: agencyData.state,
          postal_code: agencyData.postal_code,
          country: agencyData.country,
          phone: agencyData.phone,
          email: agencyData.email,
          website: agencyData.website,
          tax_id: agencyData.tax_id,
        });
      }
    } catch (error: any) {
      console.error('Error fetching quotation data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load quotation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = document.getElementById('quotation-preview-content');
    if (!content) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation ${quotation?.quote_number}</title>
          <style>
            @page {
              margin: 1cm;
            }
            @media print {
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 12px; }
              .no-print { display: none !important; }
              .print-break { page-break-after: always; }
            }
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .header { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .logo { max-width: 150px; max-height: 80px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .totals { float: right; margin-top: 20px; }
            .totals table { width: 300px; border: none; }
            .totals td { padding: 5px 10px; border: none; }
            .totals .total-row { font-weight: bold; font-size: 1.2em; border-top: 2px solid #000; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading quotation...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!quotation) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Quotation not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; padding: 0; }
          .quotation-content { padding: 0 !important; }
        }
      `}</style>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b no-print">
          <div className="flex justify-between items-center">
            <DialogTitle>Quotation Preview</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div id="quotation-preview-content" className="px-6 py-6 bg-white quotation-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div className="flex-1">
              {agencyInfo.logo_url && (
                <img
                  src={agencyInfo.logo_url}
                  alt="Agency Logo"
                  className="h-16 mb-4 object-contain"
                />
              )}
              <h2 className="text-2xl font-bold mb-2">
                {agencyInfo.agency_name || 'Agency Name'}
              </h2>
              <div className="text-sm text-muted-foreground space-y-1">
                {agencyInfo.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {agencyInfo.address}
                      {agencyInfo.city && `, ${agencyInfo.city}`}
                      {agencyInfo.state && `, ${agencyInfo.state}`}
                      {agencyInfo.postal_code && ` ${agencyInfo.postal_code}`}
                      {agencyInfo.country && `, ${agencyInfo.country}`}
                    </span>
                  </div>
                )}
                {agencyInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{agencyInfo.phone}</span>
                  </div>
                )}
                {agencyInfo.email && (
                  <div className="flex items-center gap-2">
                    <MailIcon className="h-4 w-4" />
                    <span>{agencyInfo.email}</span>
                  </div>
                )}
                {agencyInfo.website && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{agencyInfo.website}</span>
                  </div>
                )}
                {agencyInfo.tax_id && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Tax ID: {agencyInfo.tax_id}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-bold mb-2">QUOTATION</h1>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Quote #: {quotation.quote_number}</p>
                <p className="text-muted-foreground">
                  Date: {formatDate(quotation.created_at)}
                </p>
                <Badge className={getStatusColor(quotation.status)}>
                  {quotation.status.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {/* Client Information */}
          {client && (
            <div className="mb-8 grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">BILL TO:</h3>
                <div className="space-y-1">
                  <p className="font-semibold">
                    {client.company_name || client.name}
                  </p>
                  {client.contact_person && (
                    <p className="text-sm">Attn: {client.contact_person}</p>
                  )}
                  {(client.billing_address || client.address) && (
                    <p className="text-sm text-muted-foreground">
                      {client.billing_address || client.address}
                      {client.billing_city && `, ${client.billing_city}`}
                      {client.billing_state && `, ${client.billing_state}`}
                      {client.billing_postal_code && ` ${client.billing_postal_code}`}
                      {client.billing_country && `, ${client.billing_country}`}
                    </p>
                  )}
                  {client.contact_email && (
                    <p className="text-sm text-muted-foreground">
                      <MailIcon className="h-3 w-3 inline mr-1" />
                      {client.contact_email}
                    </p>
                  )}
                  {client.contact_phone && (
                    <p className="text-sm text-muted-foreground">
                      <Phone className="h-3 w-3 inline mr-1" />
                      {client.contact_phone}
                    </p>
                  )}
                  {client.tax_id && (
                    <p className="text-sm text-muted-foreground">
                      Tax ID: {client.tax_id}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">QUOTATION DETAILS:</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Title:</span>{' '}
                    <span className="font-medium">{quotation.title}</span>
                  </p>
                  {quotation.valid_until && (
                    <p>
                      <span className="text-muted-foreground">Valid Until:</span>{' '}
                      <span className="font-medium">{formatDate(quotation.valid_until)}</span>
                    </p>
                  )}
                  {quotation.description && (
                    <p className="text-muted-foreground mt-2">{quotation.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="mb-6">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-3 text-left font-semibold">Item</th>
                  <th className="border border-border p-3 text-left font-semibold">Description</th>
                  <th className="border border-border p-3 text-center font-semibold">Qty</th>
                  <th className="border border-border p-3 text-right font-semibold">Unit Price</th>
                  <th className="border border-border p-3 text-center font-semibold">Disc. %</th>
                  <th className="border border-border p-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? (
                  lineItems.map((item, index) => (
                    <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                      <td className="border border-border p-3">{item.item_name}</td>
                      <td className="border border-border p-3 text-sm text-muted-foreground">
                        {item.description || '-'}
                      </td>
                      <td className="border border-border p-3 text-center">{item.quantity}</td>
                      <td className="border border-border p-3 text-right">{formatCurrency(item.unit_price)}</td>
                      <td className="border border-border p-3 text-center">
                        {item.discount_percentage > 0 ? `${item.discount_percentage}%` : '-'}
                      </td>
                      <td className="border border-border p-3 text-right font-medium">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="border border-border p-6 text-center text-muted-foreground">
                      No line items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-full max-w-md">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="p-2 text-right text-muted-foreground">Subtotal:</td>
                    <td className="p-2 text-right font-medium">{formatCurrency(quotation.subtotal)}</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-right text-muted-foreground">
                      Tax ({quotation.tax_rate}%):
                    </td>
                    <td className="p-2 text-right font-medium">{formatCurrency(quotation.tax_amount)}</td>
                  </tr>
                  <tr className="border-t-2 border-foreground">
                    <td className="p-2 text-right font-bold text-lg">Total Amount:</td>
                    <td className="p-2 text-right font-bold text-lg">{formatCurrency(quotation.total_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Terms & Conditions */}
          {quotation.terms_conditions && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Terms & Conditions:</h3>
              <p className="text-sm whitespace-pre-line">{quotation.terms_conditions}</p>
            </div>
          )}

          {/* Notes */}
          {quotation.notes && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold mb-2 text-blue-900">Notes:</h3>
              <p className="text-sm text-blue-800 whitespace-pre-line">{quotation.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            <p>Thank you for your business!</p>
            {quotation.valid_until && (
              <p className="mt-2">
                This quotation is valid until {formatDate(quotation.valid_until)}
              </p>
            )}
            <p className="mt-2">
              Generated on {formatDate(quotation.created_at)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default QuotationPreviewDialog;

