/**
 * Warehouse Dialog Component
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
import { Plus, Loader2 } from 'lucide-react';

interface WarehouseForm {
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  contact_person: string;
  phone: string;
  email: string;
  is_primary: boolean;
}

interface WarehouseDialogProps {
  showDialog: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  form: WarehouseForm;
  onFormChange: (form: WarehouseForm) => void;
  onSubmit: () => void;
}

export const WarehouseDialog = ({
  showDialog,
  onOpenChange,
  loading,
  form,
  onFormChange,
  onSubmit,
}: WarehouseDialogProps) => {
  return (
    <Dialog open={showDialog} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Warehouse</DialogTitle>
          <DialogDescription>Add a new warehouse location</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-code">Code *</Label>
              <Input
                id="warehouse-code"
                value={form.code}
                onChange={(e) => onFormChange({ ...form, code: e.target.value })}
                placeholder="WH-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-name">Name *</Label>
              <Input
                id="warehouse-name"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                placeholder="Main Warehouse"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warehouse-address">Address</Label>
            <Input
              id="warehouse-address"
              value={form.address}
              onChange={(e) => onFormChange({ ...form, address: e.target.value })}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-city">City</Label>
              <Input
                id="warehouse-city"
                value={form.city}
                onChange={(e) => onFormChange({ ...form, city: e.target.value })}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-state">State</Label>
              <Input
                id="warehouse-state"
                value={form.state}
                onChange={(e) => onFormChange({ ...form, state: e.target.value })}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-postal">Postal Code</Label>
              <Input
                id="warehouse-postal"
                value={form.postal_code}
                onChange={(e) => onFormChange({ ...form, postal_code: e.target.value })}
                placeholder="PIN"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-contact">Contact Person</Label>
              <Input
                id="warehouse-contact"
                value={form.contact_person}
                onChange={(e) => onFormChange({ ...form, contact_person: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouse-phone">Phone</Label>
              <Input
                id="warehouse-phone"
                value={form.phone}
                onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={loading || !form.code || !form.name}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Warehouse'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

