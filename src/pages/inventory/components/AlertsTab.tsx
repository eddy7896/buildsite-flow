/**
 * Alerts Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { type InventoryLevel } from '@/services/api/inventory-service';

interface AlertsTabProps {
  lowStockAlerts: InventoryLevel[];
  onReorder: (productId: string, warehouseId: string) => void;
}

export const AlertsTab = ({ lowStockAlerts, onReorder }: AlertsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Products below reorder point</CardDescription>
      </CardHeader>
      <CardContent>
        {lowStockAlerts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Reorder Point</TableHead>
                <TableHead>Shortage</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{alert.product_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{alert.product_sku}</div>
                    </div>
                  </TableCell>
                  <TableCell>{alert.warehouse_name}</TableCell>
                  <TableCell className="font-mono text-orange-500 font-semibold">
                    {alert.available_quantity}
                  </TableCell>
                  <TableCell className="font-mono">{alert.reorder_point}</TableCell>
                  <TableCell className="font-mono text-red-500 font-semibold">
                    {alert.reorder_point > alert.available_quantity
                      ? `-${alert.reorder_point - alert.available_quantity}`
                      : '0'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReorder(alert.product_id, alert.warehouse_id)}
                    >
                      Reorder
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
            <p>No low stock alerts. All products are above reorder point.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

