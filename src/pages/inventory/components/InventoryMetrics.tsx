/**
 * Inventory Metrics Component
 * Displays key inventory statistics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, TrendingDown } from 'lucide-react';
import { type Product as ProductType, type Warehouse as WarehouseType, type InventoryLevel } from '@/services/api/inventory-service';

interface InventoryMetricsProps {
  products: ProductType[];
  warehouses: WarehouseType[];
  lowStockAlerts: InventoryLevel[];
}

export const InventoryMetrics = ({ products, warehouses, lowStockAlerts }: InventoryMetricsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{products.length}</div>
          <p className="text-xs text-muted-foreground">Active products in catalog</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{warehouses.length}</div>
          <p className="text-xs text-muted-foreground">Active warehouse locations</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">{lowStockAlerts.length}</div>
          <p className="text-xs text-muted-foreground">Products below reorder point</p>
        </CardContent>
      </Card>
    </div>
  );
};

