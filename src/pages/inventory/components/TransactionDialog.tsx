/**
 * Transaction Dialog Component
 */

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
import { type Product as ProductType, type Warehouse as WarehouseType } from '@/services/api/inventory-service';

interface TransactionForm {
  product_id: string;
  variant_id: string;
  warehouse_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: string;
  unit_cost: string;
  reference_type: string;
  reference_id: string;
  notes: string;
}

interface TransactionDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  form: TransactionForm;
  onFormChange: (form: TransactionForm) => void;
  onSubmit: () => void;
  products: ProductType[];
  warehouses: WarehouseType[];
}

export const TransactionDialog = ({
  showDialog,
  onOpenChange,
  loading,
  form,
  onFormChange,
  onSubmit,
  products,
  warehouses,
}: TransactionDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Inventory Transaction</DialogTitle>
          <DialogDescription>Record stock in, out, or adjustment</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-product">Product *</Label>
            <Select
              value={form.product_id}
              onValueChange={(value) => onFormChange({ ...form, product_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-warehouse">Warehouse *</Label>
            <Select
              value={form.warehouse_id}
              onValueChange={(value) => onFormChange({ ...form, warehouse_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type *</Label>
              <Select
                value={form.transaction_type}
                onValueChange={(value: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN') =>
                  onFormChange({ ...form, transaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IN">Stock In</SelectItem>
                  <SelectItem value="OUT">Stock Out</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-quantity">Quantity *</Label>
              <Input
                id="transaction-quantity"
                type="number"
                step="0.01"
                value={form.quantity}
                onChange={(e) => onFormChange({ ...form, quantity: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-cost">Unit Cost</Label>
            <Input
              id="transaction-cost"
              type="number"
              step="0.01"
              value={form.unit_cost}
              onChange={(e) => onFormChange({ ...form, unit_cost: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-notes">Notes</Label>
            <Input
              id="transaction-notes"
              value={form.notes}
              onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
              placeholder="Transaction notes"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={loading || !form.product_id || !form.warehouse_id || !form.quantity}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Transaction'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

