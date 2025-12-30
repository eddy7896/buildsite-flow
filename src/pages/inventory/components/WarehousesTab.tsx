/**
 * Warehouses Tab Component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { WarehouseDialog } from './WarehouseDialog';
import { type Warehouse as WarehouseType } from '@/services/api/inventory-service';

interface WarehousesTabProps {
  warehouses: WarehouseType[];
  loading: boolean;
  warehouseForm: any;
  onWarehouseFormChange: (form: any) => void;
  showWarehouseDialog: boolean;
  onShowWarehouseDialogChange: (show: boolean) => void;
  onCreateWarehouse: () => void;
}

export const WarehousesTab = ({
  warehouses,
  loading,
  warehouseForm,
  onWarehouseFormChange,
  showWarehouseDialog,
  onShowWarehouseDialogChange,
  onCreateWarehouse,
}: WarehousesTabProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Warehouses</CardTitle>
            <CardDescription>Manage warehouse locations</CardDescription>
          </div>
          <WarehouseDialog
            showDialog={showWarehouseDialog}
            onOpenChange={onShowWarehouseDialogChange}
            loading={loading}
            form={warehouseForm}
            onFormChange={onWarehouseFormChange}
            onSubmit={onCreateWarehouse}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell className="font-mono">{warehouse.code}</TableCell>
                <TableCell className="font-medium">
                  {warehouse.name}
                  {warehouse.is_primary && (
                    <Badge variant="outline" className="ml-2">Primary</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {warehouse.city && warehouse.state
                    ? `${warehouse.city}, ${warehouse.state}`
                    : warehouse.address || '-'}
                </TableCell>
                <TableCell>
                  {warehouse.contact_person || '-'}
                  {warehouse.phone && <div className="text-xs text-muted-foreground">{warehouse.phone}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant={warehouse.is_active ? 'default' : 'secondary'}>
                    {warehouse.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

