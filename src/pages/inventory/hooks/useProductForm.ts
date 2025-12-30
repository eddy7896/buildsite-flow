/**
 * Hook for product form state and actions
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createProduct, type Product as ProductType } from '@/services/api/inventory-service';

const initialProductForm = {
  sku: '',
  name: '',
  description: '',
  category_id: '',
  brand: '',
  unit_of_measure: 'pcs' as const,
  barcode: '',
  weight: '',
  dimensions: '',
  is_trackable: false,
  track_by: 'none' as 'serial' | 'batch' | 'none',
};

export const useProductForm = (onSuccess: () => void) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(initialProductForm);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const productData: Partial<ProductType> = {
        ...form,
        weight: form.weight ? parseFloat(form.weight) || undefined : undefined,
      };
      await createProduct(productData);
      toast({
        title: 'Success',
        description: 'Product created successfully',
      });
      setShowDialog(false);
      setForm(initialProductForm);
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [form, toast, onSuccess]);

  const resetForm = useCallback(() => {
    setForm(initialProductForm);
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

