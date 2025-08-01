import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Quotation {
  id?: string;
  quote_number?: string;
  client_id: string;
  title: string;
  description?: string;
  status: string;
  valid_until: string;
  subtotal: number;
  tax_rate: number;
  terms_conditions?: string;
  notes?: string;
}

interface QuotationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotation?: Quotation | null;
  onQuotationSaved: () => void;
}

const QuotationFormDialog: React.FC<QuotationFormDialogProps> = ({ isOpen, onClose, quotation, onQuotationSaved }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Quotation>({
    client_id: quotation?.client_id || '',
    title: quotation?.title || '',
    description: quotation?.description || '',
    status: quotation?.status || 'draft',
    valid_until: quotation?.valid_until || '',
    subtotal: quotation?.subtotal || 0,
    tax_rate: quotation?.tax_rate || 18,
    terms_conditions: quotation?.terms_conditions || '',
    notes: quotation?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (quotation?.id) {
        const { error } = await supabase
          .from('quotations')
          .update(formData)
          .eq('id', quotation.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Quotation updated successfully',
        });
      } else {
        const quoteNumber = `Q-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
        const { error } = await supabase
          .from('quotations')
          .insert([{ ...formData, quote_number: quoteNumber }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Quotation created successfully',
        });
      }

      onQuotationSaved();
      onClose();
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save quotation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{quotation?.id ? 'Edit Quotation' : 'Create New Quotation'}</DialogTitle>
          <DialogDescription>
            {quotation?.id ? 'Update quotation details below.' : 'Fill in the details to create a new quotation.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                value={formData.client_id}
                onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                placeholder="Enter client ID"
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal (₹)</Label>
              <Input
                id="subtotal"
                type="number"
                value={formData.subtotal}
                onChange={(e) => setFormData(prev => ({ ...prev, subtotal: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%)</Label>
              <Input
                id="tax_rate"
                type="number"
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