/**
 * Product Dialog Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

interface ProductForm {
  sku: string;
  name: string;
  description: string;
  category_id: string;
  brand: string;
  unit_of_measure: string;
  barcode: string;
  weight: string;
  dimensions: string;
  is_trackable: boolean;
  track_by: 'serial' | 'batch' | 'none';
}

interface ProductDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  form: ProductForm;
  onFormChange: (form: ProductForm) => void;
  onSubmit: () => void;
}

export const ProductDialog = ({
  showDialog,
  onOpenChange,
  loading,
  form,
  onFormChange,
  onSubmit,
}: ProductDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>Add a new product to your catalog</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => onFormChange({ ...form, sku: e.target.value })}
                placeholder="PROD-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                placeholder="Product Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              placeholder="Product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => onFormChange({ ...form, brand: e.target.value })}
                placeholder="Brand name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure</Label>
              <Select
                value={form.unit_of_measure}
                onValueChange={(value) => onFormChange({ ...form, unit_of_measure: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pcs">Pieces</SelectItem>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="g">Grams</SelectItem>
                  <SelectItem value="l">Liters</SelectItem>
                  <SelectItem value="ml">Milliliters</SelectItem>
                  <SelectItem value="m">Meters</SelectItem>
                  <SelectItem value="cm">Centimeters</SelectItem>
                  <SelectItem value="box">Box</SelectItem>
                  <SelectItem value="pack">Pack</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={form.barcode}
                onChange={(e) => onFormChange({ ...form, barcode: e.target.value })}
                placeholder="Barcode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={form.weight}
                onChange={(e) => onFormChange({ ...form, weight: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="track_by">Tracking Method</Label>
            <Select
              value={form.track_by}
              onValueChange={(value: 'serial' | 'batch' | 'none') => {
                onFormChange({
                  ...form,
                  track_by: value,
                  is_trackable: value !== 'none',
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Tracking</SelectItem>
                <SelectItem value="serial">Serial Number</SelectItem>
                <SelectItem value="batch">Batch Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={loading || !form.sku || !form.name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

