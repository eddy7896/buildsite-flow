/**
 * Overview Tab Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InventoryMetrics } from './InventoryMetrics';
import { type Product as ProductType } from '@/services/api/inventory-service';

interface OverviewTabProps {
  products: ProductType[];
  warehouses: any[];
  lowStockAlerts: any[];
}

export const OverviewTab = ({ products, warehouses, lowStockAlerts }: OverviewTabProps) => {
  return (
    <div className="space-y-4">
      <InventoryMetrics products={products} warehouses={warehouses} lowStockAlerts={lowStockAlerts} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.slice(0, 5).map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.unit_of_measure}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

