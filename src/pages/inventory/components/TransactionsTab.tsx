/**
 * Transactions Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { TransactionDialog } from './TransactionDialog';
import { type InventoryLevel, type Product as ProductType, type Warehouse as WarehouseType } from '@/services/api/inventory-service';

interface TransactionsTabProps {
  selectedProduct: string | null;
  onSelectProduct: (productId: string | null) => void;
  inventoryLevels: InventoryLevel[];
  products: ProductType[];
  warehouses: WarehouseType[];
  loading: boolean;
  transactionForm: any;
  onTransactionFormChange: (form: any) => void;
  showTransactionDialog: boolean;
  onShowTransactionDialogChange: (show: boolean) => void;
  onCreateTransaction: () => void;
}

export const TransactionsTab = ({
  selectedProduct,
  onSelectProduct,
  inventoryLevels,
  products,
  warehouses,
  loading,
  transactionForm,
  onTransactionFormChange,
  showTransactionDialog,
  onShowTransactionDialogChange,
  onCreateTransaction,
}: TransactionsTabProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Inventory Transactions</CardTitle>
            <CardDescription>Record stock movements</CardDescription>
          </div>
          <TransactionDialog
            showDialog={showTransactionDialog}
            onOpenChange={onShowTransactionDialogChange}
            loading={loading}
            form={transactionForm}
            onFormChange={onTransactionFormChange}
            onSubmit={onCreateTransaction}
            products={products}
            warehouses={warehouses}
          />
        </div>
      </CardHeader>
      <CardContent>
        {selectedProduct ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Inventory Levels</h3>
              <Button variant="outline" size="sm" onClick={() => onSelectProduct(null)}>
                Clear Selection
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Available</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Reorder Point</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryLevels.map((level) => (
                  <TableRow key={level.id}>
                    <TableCell>{level.warehouse_name}</TableCell>
                    <TableCell className="font-mono">{level.available_quantity}</TableCell>
                    <TableCell className="font-mono">{level.reserved_quantity}</TableCell>
                    <TableCell className="font-mono font-semibold">{level.quantity}</TableCell>
                    <TableCell className="font-mono">{level.reorder_point}</TableCell>
                    <TableCell>
                      {level.available_quantity <= level.reorder_point ? (
                        <Badge variant="destructive">Low Stock</Badge>
                      ) : (
                        <Badge variant="default">In Stock</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select a product from the Products tab to view inventory levels</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

