/**
 * Hook for transaction form state and actions
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createInventoryTransaction } from '@/services/api/inventory-service';

const initialTransactionForm = {
  product_id: '',
  variant_id: '',
  warehouse_id: '',
  transaction_type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN',
  quantity: '',
  unit_cost: '',
  reference_type: '',
  reference_id: '',
  notes: '',
};

export const useTransactionForm = (
  onSuccess: () => void,
  onInventoryLevelsUpdate?: () => void
) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialTransactionForm);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      await createInventoryTransaction({
        ...form,
        quantity: parseFloat(form.quantity),
        unit_cost: form.unit_cost ? parseFloat(form.unit_cost) : undefined,
      });
      toast({
        title: 'Success',
        description: 'Inventory transaction created successfully',
      });
      setShowDialog(false);
      setForm(initialTransactionForm);
      onSuccess();
      onInventoryLevelsUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create transaction',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [form, toast, onSuccess, onInventoryLevelsUpdate]);

  const resetForm = useCallback(() => {
    setForm(initialTransactionForm);
  }, []);

  const setFormForProduct = useCallback((productId: string, warehouseId: string) => {
    setForm(prev => ({
      ...prev,
      product_id: productId,
      warehouse_id: warehouseId,
      transaction_type: 'IN',
    }));
    setShowDialog(true);
  }, []);

  return {
    showDialog,
    setShowDialog,
    loading,
    form,
    setForm,
    handleSubmit,
    resetForm,
    setFormForProduct,
  };
};

