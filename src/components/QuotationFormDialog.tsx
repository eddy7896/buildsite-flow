import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { generateUUID } from '@/lib/uuid';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QuotationLineItem {
  id: string;
  quotation_id?: string;
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  line_total?: number;
  sort_order?: number;
}

interface Quotation {
  id?: string;
  quote_number?: string;
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
  created_by?: string;
  agency_id?: string;
}

interface Client {
  id: string;
  name: string;
  company_name?: string;
}

interface QuotationTemplate {
  id: string;
  name: string;
  description?: string;
  template_content?: any;
}

interface QuotationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  onQuotationSaved: () => void;
}

const QuotationFormDialog: React.FC<QuotationFormDialogProps> = ({ isOpen, onClose, quotation, onQuotationSaved }) => {
  const { toast } = useToast();
  const auth = useAuth();
  const user = auth?.user;
  const profile = auth?.profile;
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([]);
  const [formData, setFormData] = useState<Quotation>({
    client_id: quotation?.client_id || '',
    title: quotation?.title || '',
    description: quotation?.description || '',
    status: quotation?.status || 'draft',
    valid_until: quotation?.valid_until || '',
    subtotal: Number(quotation?.subtotal) || 0,
    tax_rate: Number(quotation?.tax_rate) || 18,
    tax_amount: Number(quotation?.tax_amount) || 0,
    total_amount: Number(quotation?.total_amount) || 0,
    terms_conditions: quotation?.terms_conditions || '',
    notes: quotation?.notes || '',
    template_id: quotation?.template_id || null,
  });

  // Update formData when quotation prop changes
  useEffect(() => {
    if (quotation && quotation.id) {
      // Format date for HTML date input (YYYY-MM-DD)
      let formattedDate = '';
      if (quotation.valid_until) {
        try {
          const date = new Date(quotation.valid_until);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error formatting date:', e);
        }
      }

      setFormData({
        client_id: quotation.client_id || '',
        title: quotation.title || '',
        description: quotation.description || '',
        status: quotation.status || 'draft',
        valid_until: formattedDate,
        subtotal: Number(quotation.subtotal) || 0,
        tax_rate: Number(quotation.tax_rate) || 18,
        tax_amount: Number(quotation.tax_amount) || 0,
        total_amount: Number(quotation.total_amount) || 0,
        terms_conditions: quotation.terms_conditions || '',
        notes: quotation.notes || '',
        template_id: quotation.template_id || null,
      });
    } else if (!quotation) {
      // Reset form for new quotation
      setFormData({
        client_id: '',
        title: '',
        description: '',
        status: 'draft',
        valid_until: '',
        subtotal: 0,
        tax_rate: 18,
        tax_amount: 0,
        total_amount: 0,
        terms_conditions: '',
        notes: '',
        template_id: null,
      });
    }
  }, [quotation]);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTemplates();
      if (quotation?.id) {
        fetchLineItems(quotation.id);
      } else {
        // Add one empty line item for new quotations
        setLineItems([{
          id: generateUUID(),
          item_name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percentage: 0,
          sort_order: 0,
        }]);
      }
    }
  }, [isOpen, quotation?.id]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await db
        .from('clients')
        .select('id, name, company_name')
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clients',
        variant: 'destructive',
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await db
        .from('quotation_templates')
        .select('id, name, description, template_content')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchLineItems = async (quotationId: string) => {
    try {
      const { data, error } = await db
        .from('quotation_line_items')
        .select('*')
        .eq('quotation_id', quotationId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setLineItems(data && data.length > 0 ? data : [{
        id: generateUUID(),
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        sort_order: 0,
      }]);
    } catch (error: any) {
      console.error('Error fetching line items:', error);
      setLineItems([{
        id: generateUUID(),
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percentage: 0,
        sort_order: 0,
      }]);
    }
  };

  const calculateLineTotal = (item: QuotationLineItem): number => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * ((item.discount_percentage || 0) / 100);
    return subtotal - discount;
  };

  // Calculate totals when line items or tax rate changes
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => {
      if (item.item_name && item.item_name.trim()) {
        const itemSubtotal = item.quantity * item.unit_price;
        const discount = itemSubtotal * ((item.discount_percentage || 0) / 100);
        return sum + (itemSubtotal - discount);
      }
      return sum;
    }, 0);
    
    const taxAmount = subtotal * (formData.tax_rate / 100);
    const totalAmount = subtotal + taxAmount;

    setFormData(prev => {
      // Only update if values actually changed to prevent infinite loops
      const prevSubtotal = Number(prev.subtotal) || 0;
      const prevTaxAmount = Number(prev.tax_amount) || 0;
      const prevTotalAmount = Number(prev.total_amount) || 0;
      
      if (Math.abs(prevSubtotal - subtotal) > 0.01 || 
          Math.abs(prevTaxAmount - taxAmount) > 0.01 || 
          Math.abs(prevTotalAmount - totalAmount) > 0.01) {
        return {
          ...prev,
          subtotal: Number(subtotal.toFixed(2)),
          tax_amount: Number(taxAmount.toFixed(2)),
          total_amount: Number(totalAmount.toFixed(2)),
        };
      }
      return prev;
    });
  }, [lineItems, formData.tax_rate]);

  const handleLineItemChange = (id: string, field: keyof QuotationLineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return { ...updated, line_total: calculateLineTotal(updated) };
      }
      return item;
    }));
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      id: generateUUID(),
      item_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percentage: 0,
      sort_order: prev.length,
    }]);
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      if (filtered.length === 0) {
        return [{
          id: generateUUID(),
          item_name: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          discount_percentage: 0,
          sort_order: 0,
        }];
      }
      return filtered.map((item, index) => ({ ...item, sort_order: index }));
    });
  };

  const useTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template || !template.template_content) return;

      const content = typeof template.template_content === 'string' 
        ? JSON.parse(template.template_content) 
        : template.template_content;

      if (content.lineItems && Array.isArray(content.lineItems)) {
        setLineItems(content.lineItems.map((item: any, index: number) => ({
          id: generateUUID(),
          item_name: item.item_name || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          discount_percentage: item.discount_percentage || 0,
          sort_order: index,
        })));
      }

      if (content.terms_conditions) {
        setFormData(prev => ({ ...prev, terms_conditions: content.terms_conditions }));
      }

      if (content.tax_rate) {
        setFormData(prev => ({ ...prev, tax_rate: content.tax_rate }));
      }

      setFormData(prev => ({ ...prev, template_id: templateId }));

      toast({
        title: 'Success',
        description: 'Template applied successfully',
      });
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply template',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Quotation title is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.client_id) {
      toast({
        title: 'Error',
        description: 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    const hasValidLineItems = lineItems.some(item => item.item_name && item.item_name.trim());
    if (!hasValidLineItems) {
      toast({
        title: 'Error',
        description: 'Please add at least one line item',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const validLineItems = lineItems.filter(item => item.item_name && item.item_name.trim());
      
      if (quotation?.id) {
        // Update existing quotation
        // Exclude generated columns (tax_amount, total_amount)
        // updated_at is automatically set by database trigger
        const { tax_amount, total_amount, ...updateData } = formData;
        const { error: updateError } = await db
          .from('quotations')
          .update({
            ...updateData,
          })
          .eq('id', quotation.id);

        if (updateError) throw updateError;

        // Delete existing line items
        await db
          .from('quotation_line_items')
          .delete()
          .eq('quotation_id', quotation.id);

        // Insert new line items
        // Exclude line_total if it's a generated column
        if (validLineItems.length > 0) {
          const lineItemsToInsert = validLineItems.map((item, index) => {
            const lineItem: any = {
              id: generateUUID(),
              quotation_id: quotation.id,
              item_name: item.item_name,
              description: item.description || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percentage: item.discount_percentage || 0,
              sort_order: index,
            };
            // Only include line_total if it's not a generated column
            // The database will calculate it if it's generated
            return lineItem;
          });

          for (const item of lineItemsToInsert) {
            await db.from('quotation_line_items').insert([item]);
          }
        }

        toast({
          title: 'Success',
          description: 'Quotation updated successfully',
        });
      } else {
        // Create new quotation
        // Exclude generated columns (tax_amount, total_amount)
        const { tax_amount, total_amount, ...quotationData } = formData;
        const quoteNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        // Get user ID and agency ID from auth context, or use defaults
        const userId = user?.id || '550e8400-e29b-41d4-a716-446655440010'; // Default system user UUID
        const agencyId = profile?.agency_id || '550e8400-e29b-41d4-a716-446655440000'; // Default agency UUID

        const newQuotation = {
          id: generateUUID(),
          quote_number: quoteNumber,
          ...quotationData,
          created_by: userId,
          agency_id: agencyId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: insertedQuotation, error: insertError } = await db
          .from('quotations')
          .insert([newQuotation])
          .select()
          .single();

        if (insertError) throw insertError;

        // Insert line items
        // Exclude line_total if it's a generated column
        if (validLineItems.length > 0 && insertedQuotation) {
          const lineItemsToInsert = validLineItems.map((item, index) => {
            const lineItem: any = {
              id: generateUUID(),
              quotation_id: insertedQuotation.id,
              item_name: item.item_name,
              description: item.description || null,
              quantity: item.quantity,
              unit_price: item.unit_price,
              discount_percentage: item.discount_percentage || 0,
              sort_order: index,
            };
            // Only include line_total if it's not a generated column
            // The database will calculate it if it's generated
            return lineItem;
          });

          for (const item of lineItemsToInsert) {
            await db.from('quotation_line_items').insert([item]);
          }
        }

        toast({
          title: 'Success',
          description: 'Quotation created successfully',
        });
      }

      onQuotationSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving quotation:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quotation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation?.id ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
          <DialogDescription>
            {quotation?.id ? 'Update quotation details below.' : 'Fill in the details to create a new quotation.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Use Template (Optional)</Label>
              <Select onValueChange={useTemplate} value={formData.template_id || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Quotation Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_id">Client *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name || client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Line Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lineItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label className="text-xs">Item Name *</Label>
                    <Input
                      value={item.item_name}
                      onChange={(e) => handleLineItemChange(item.id, 'item_name', e.target.value)}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Description</Label>
                    <Input
                      value={item.description || ''}
                      onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)}
                      placeholder="Description"
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(item.id, 'quantity', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(item.id, 'unit_price', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Disc. %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount_percentage || 0}
                      onChange={(e) => handleLineItemChange(item.id, 'discount_percentage', Number(e.target.value))}
                    />
                  </div>
                  <div className="col-span-1">
                    <Label className="text-xs">Total</Label>
                    <Input
                      value={calculateLineTotal(item).toFixed(2)}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(item.id)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Totals */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-sm text-muted-foreground">Subtotal</Label>
              <p className="text-lg font-semibold">₹{(Number(formData.subtotal) || 0).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Tax ({Number(formData.tax_rate) || 0}%)</Label>
              <p className="text-lg font-semibold">₹{(Number(formData.tax_amount) || 0).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Total Amount</Label>
              <p className="text-2xl font-bold">₹{(Number(formData.total_amount) || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.tax_rate}
                onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.terms_conditions}
              onChange={(e) => setFormData(prev => ({ ...prev, terms_conditions: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : quotation?.id ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationFormDialog;
