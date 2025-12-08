import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/database';
import { generateUUID } from '@/lib/uuid';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2 } from 'lucide-react';

interface QuotationTemplate {
  id?: string;
  name: string;
  description?: string;
  template_content?: any;
  is_active: boolean;
  created_by?: string;
}

interface QuotationTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  template?: QuotationTemplate | null;
  onTemplateSaved: () => void;
}

const QuotationTemplateDialog: React.FC<QuotationTemplateDialogProps> = ({
  isOpen,
  onClose,
  template,
  onTemplateSaved,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<QuotationTemplate>({
    name: '',
    description: '',
    template_content: {
      lineItems: [],
      terms_conditions: '',
      tax_rate: 18,
    },
    is_active: true,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        template_content: template.template_content || {
          lineItems: [],
          terms_conditions: '',
          tax_rate: 18,
        },
        is_active: template.is_active !== undefined ? template.is_active : true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        template_content: {
          lineItems: [],
          terms_conditions: '',
          tax_rate: 18,
        },
        is_active: true,
      });
    }
  }, [template, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Template name is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const templateData = {
        name: formData.name,
        description: formData.description || null,
        template_content: formData.template_content,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      };

      if (template?.id) {
        // Update existing template
        const { error } = await db
          .from('quotation_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      } else {
        // Create new template
        // Get user ID from auth context, or use default system user UUID
        const userId = user?.id || '550e8400-e29b-41d4-a716-446655440010';
        
        const newTemplate = {
          id: generateUUID(),
          ...templateData,
          created_by: userId,
          created_at: new Date().toISOString(),
        };

        const { error } = await db
          .from('quotation_templates')
          .insert([newTemplate]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
      }

      onTemplateSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addSampleLineItem = () => {
    const lineItems = formData.template_content?.lineItems || [];
    setFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        lineItems: [
          ...lineItems,
          {
            item_name: '',
            description: '',
            quantity: 1,
            unit_price: 0,
            discount_percentage: 0,
          },
        ],
      },
    }));
  };

  const removeLineItem = (index: number) => {
    const lineItems = formData.template_content?.lineItems || [];
    setFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        lineItems: lineItems.filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    const lineItems = formData.template_content?.lineItems || [];
    setFormData(prev => ({
      ...prev,
      template_content: {
        ...prev.template_content,
        lineItems: lineItems.map((item: any, i: number) =>
          i === index ? { ...item, [field]: value } : item
        ),
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template?.id ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          <DialogDescription>
            {template?.id 
              ? 'Update template details below.' 
              : 'Create a reusable template for quotations with predefined line items and settings.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="e.g., Standard Construction Quote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              placeholder="Describe when to use this template"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tax_rate">Default Tax Rate (%)</Label>
            </div>
            <Input
              id="tax_rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.template_content?.tax_rate || 18}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                template_content: {
                  ...prev.template_content,
                  tax_rate: Number(e.target.value),
                },
              }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Default Terms & Conditions</Label>
            <Textarea
              id="terms_conditions"
              value={formData.template_content?.terms_conditions || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                template_content: {
                  ...prev.template_content,
                  terms_conditions: e.target.value,
                },
              }))}
              rows={3}
              placeholder="Enter default terms and conditions"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Default Line Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addSampleLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
              {(formData.template_content?.lineItems || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No line items. Click "Add Item" to add default items for this template.
                </p>
              ) : (
                (formData.template_content?.lineItems || []).map((item: any, index: number) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end p-2 border rounded">
                    <div className="col-span-4">
                      <Input
                        placeholder="Item name"
                        value={item.item_name || ''}
                        onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Description"
                        value={item.description || ''}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || 1}
                        onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unit_price || 0}
                        onChange={(e) => updateLineItem(index, 'unit_price', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Input
                        type="number"
                        placeholder="Disc %"
                        value={item.discount_percentage || 0}
                        onChange={(e) => updateLineItem(index, 'discount_percentage', Number(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : template?.id ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuotationTemplateDialog;

