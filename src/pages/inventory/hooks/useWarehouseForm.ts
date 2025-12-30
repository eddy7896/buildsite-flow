/**
 * Hook for warehouse form state and actions
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createWarehouse } from '@/services/api/inventory-service';

const initialWarehouseForm = {
  code: '',
  name: '',
  address: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  contact_person: '',
  phone: '',
  email: '',
  is_primary: false,
};

export const useWarehouseForm = (onSuccess: () => void) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialWarehouseForm);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      await createWarehouse(form);
      toast({
        title: 'Success',
        description: 'Warehouse created successfully',
      });
      setShowDialog(false);
      setForm(initialWarehouseForm);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create warehouse',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [form, toast, onSuccess]);

  const resetForm = useCallback(() => {
    setForm(initialWarehouseForm);
  }, []);

  return {
    showDialog,
    setShowDialog,
    loading,
    form,
    setForm,
    handleSubmit,
    resetForm,
  };
};

