/**
 * Products Tab Component
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, BarChart3, QrCode } from 'lucide-react';
import { ProductDialog } from './ProductDialog';
import { useToast } from '@/hooks/use-toast';
import { generateProductCode, type Product as ProductType } from '@/services/api/inventory-service';

interface ProductsTabProps {
  products: ProductType[];
  loading: boolean;
  productForm: any;
  onProductFormChange: (form: any) => void;
  showProductDialog: boolean;
  onShowProductDialogChange: (show: boolean) => void;
  onCreateProduct: () => void;
  onRefreshProducts: () => void;
  onSelectProduct: (productId: string) => void;
  onSwitchToTransactions: () => void;
}

export const ProductsTab = ({
  products,
  loading,
  productForm,
  onProductFormChange,
  showProductDialog,
  onShowProductDialogChange,
  onCreateProduct,
  onRefreshProducts,
  onSelectProduct,
  onSwitchToTransactions,
}: ProductsTabProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const handleGenerateBarcode = async (productId: string) => {
    try {
      const code = await generateProductCode(productId, 'barcode');
      toast({
        title: 'Success',
        description: `Barcode generated: ${code}`,
      });
      onRefreshProducts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your product catalog</CardDescription>
          </div>
          <ProductDialog
            showDialog={showProductDialog}
            onOpenChange={onShowProductDialogChange}
            loading={loading}
            form={productForm}
            onFormChange={onProductFormChange}
            onSubmit={onCreateProduct}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono">{product.sku}</TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.brand || '-'}</TableCell>
                  <TableCell>{product.unit_of_measure}</TableCell>
                  <TableCell className="font-mono text-xs">{product.barcode || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onSelectProduct(product.id);
                          onSwitchToTransactions();
                        }}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateBarcode(product.id)}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

