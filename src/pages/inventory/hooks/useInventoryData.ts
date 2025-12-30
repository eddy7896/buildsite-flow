/**
 * Hook for fetching inventory data
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getWarehouses,
  getProducts,
  getInventoryLevels,
  getLowStockAlerts,
  type Warehouse as WarehouseType,
  type Product as ProductType,
  type InventoryLevel,
} from '@/services/api/inventory-service';

export const useInventoryData = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [inventoryLevels, setInventoryLevels] = useState<InventoryLevel[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<InventoryLevel[]>([]);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getWarehouses();
      setWarehouses(data || []);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch warehouses';
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        toast({
          title: 'Connection Error',
          description: 'Unable to connect to the server. Please check your connection and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch products',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchInventoryLevels = useCallback(async (productId: string) => {
    try {
      const data = await getInventoryLevels(productId);
      setInventoryLevels(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch inventory levels',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchLowStockAlerts = useCallback(async () => {
    try {
      const data = await getLowStockAlerts();
      setLowStockAlerts(data);
    } catch (error: any) {
      console.error('Failed to fetch low stock alerts:', error);
    }
  }, []);

  return {
    loading,
    warehouses,
    products,
    inventoryLevels,
    lowStockAlerts,
    setWarehouses,
    setProducts,
    setInventoryLevels,
    setLowStockAlerts,
    fetchWarehouses,
    fetchProducts,
    fetchInventoryLevels,
    fetchLowStockAlerts,
  };
};

