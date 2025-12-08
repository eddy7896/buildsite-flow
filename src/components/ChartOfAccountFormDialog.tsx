import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { insertRecord, updateRecord } from '@/services/api/postgresql-service';
import { useAuth } from '@/hooks/useAuth';

interface ChartOfAccount {
  id?: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string | null;
  is_active?: boolean;
  description?: string | null;
}

interface ChartOfAccountFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account?: ChartOfAccount | null;
  onAccountSaved: () => void;
}

const ChartOfAccountFormDialog: React.FC<ChartOfAccountFormDialogProps> = ({ 
  isOpen, 
  onClose, 
  account, 
  onAccountSaved 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [parentAccounts, setParentAccounts] = useState<any[]>([]);
  const [formData, setFormData] = useState<ChartOfAccount>({
    account_code: account?.account_code || '',
    account_name: account?.account_name || '',
    account_type: account?.account_type || 'asset',
    parent_id: account?.parent_id || null,
    is_active: account?.is_active !== undefined ? account.is_active : true,
    description: account?.description || '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchParentAccounts();
      if (account) {
        setFormData({
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          parent_id: account.parent_id || null,
          is_active: account.is_active !== undefined ? account.is_active : true,
          description: account.description || '',
        });
      } else {
        setFormData({
          account_code: '',
          account_name: '',
          account_type: 'asset',
          parent_id: null,
          is_active: true,
          description: '',
        });
      }
    }
  }, [isOpen, account]);

  const fetchParentAccounts = async () => {
    try {
      if (!user?.id) return;
      // Get agency_id from profile
      const { selectOne } = await import('@/services/api/postgresql-service');
      const profile = await selectOne('profiles', { user_id: user.id });
      if (!profile?.agency_id) return;
      
      const { selectRecords } = await import('@/services/api/postgresql-service');
      const accounts = await selectRecords('chart_of_accounts', {
        where: { is_active: true, agency_id: profile.agency_id },
        orderBy: 'account_code ASC',
      });
      setParentAccounts(accounts || []);
    } catch (error) {
      console.error('Error fetching parent accounts:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.account_code.trim()) {
        toast({
          title: 'Error',
          description: 'Account code is required',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (!formData.account_name.trim()) {
        toast({
          title: 'Error',
          description: 'Account name is required',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Validate account code is unique within agency (if creating new or changing code)
      if (!account?.id || formData.account_code !== account.account_code) {
        const { selectOne } = await import('@/services/api/postgresql-service');
        const profile = user?.id ? await selectOne('profiles', { user_id: user.id }) : null;
        if (profile?.agency_id) {
          const existing = await selectOne('chart_of_accounts', { 
            account_code: formData.account_code.trim(),
            agency_id: profile.agency_id
          });
          if (existing && existing.id !== account?.id) {
            toast({
              title: 'Error',
              description: 'Account code already exists. Please use a unique code.',
              variant: 'destructive',
            });
            setLoading(false);
            return;
          }
        }
      }

      // Use parent_id if that's the actual column name, otherwise parent_account_id
      // Check which column exists by trying parent_account_id first (as per migration plan)
      const cleanedData: any = {
        account_code: formData.account_code.trim(),
        account_name: formData.account_name.trim(),
        account_type: formData.account_type,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
        description: formData.description?.trim() || null,
      };

      // Handle parent_id (matches database column name)
      if (formData.parent_id) {
        cleanedData.parent_id = formData.parent_id;
      } else {
        cleanedData.parent_id = null;
      }

      // Get agency_id from profile
      const { selectOne } = await import('@/services/api/postgresql-service');
      const profile = user?.id ? await selectOne('profiles', { user_id: user.id }) : null;
      if (!profile?.agency_id) {
        toast({
          title: 'Error',
          description: 'Unable to determine agency. Please ensure you are logged in.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
      cleanedData.agency_id = profile.agency_id;

      if (account?.id) {
        await updateRecord('chart_of_accounts', cleanedData, { id: account.id }, user?.id);
        toast({
          title: 'Success',
          description: 'Account updated successfully',
        });
      } else {
        await insertRecord('chart_of_accounts', cleanedData, user?.id);
        toast({
          title: 'Success',
          description: 'Account created successfully',
        });
      }

      onAccountSaved();
      onClose();
    } catch (error: any) {
      console.error('Error saving account:', error);
      // Check for unique constraint violation
      if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
        toast({
          title: 'Error',
          description: 'Account code already exists. Please use a unique code.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save account',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{account?.id ? 'Edit Account' : 'Create New Account'}</DialogTitle>
          <DialogDescription>
            {account?.id ? 'Update account details below.' : 'Fill in the details to create a new chart of accounts entry.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code">Account Code *</Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData(prev => ({ ...prev, account_code: e.target.value }))}
                placeholder="e.g., 1000, 2000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select 
                value={formData.account_type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, account_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="equity">Equity</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name *</Label>
            <Input
              id="account_name"
              value={formData.account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
              placeholder="e.g., Cash, Accounts Receivable"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent_id">Parent Account</Label>
            <Select 
              value={formData.parent_id || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, parent_id: value || null }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent account (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {parentAccounts
                  .filter(acc => !account?.id || acc.id !== account.id)
                  .map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.account_code} - {acc.account_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Account description"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Account is active
            </Label>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Saving...' : account?.id ? 'Update Account' : 'Create Account'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChartOfAccountFormDialog;

