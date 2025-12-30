/**
 * Inventory Management Page
 * Complete inventory management interface
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useInventoryData } from './inventory/hooks/useInventoryData';
import { useWarehouseForm } from './inventory/hooks/useWarehouseForm';
import { useProductForm } from './inventory/hooks/useProductForm';
import { useTransactionForm } from './inventory/hooks/useTransactionForm';
import { OverviewTab } from './inventory/components/OverviewTab';
import { ProductsTab } from './inventory/components/ProductsTab';
import { WarehousesTab } from './inventory/components/WarehousesTab';
import { TransactionsTab } from './inventory/components/TransactionsTab';
import { AlertsTab } from './inventory/components/AlertsTab';

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [initialLoad, setInitialLoad] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const {
    loading,
    warehouses,
    products,
    inventoryLevels,
    lowStockAlerts,
    fetchWarehouses,
    fetchProducts,
    fetchInventoryLevels,
    fetchLowStockAlerts,
  } = useInventoryData();

  const warehouseForm = useWarehouseForm(fetchWarehouses);
  const productForm = useProductForm(fetchProducts);
  const transactionForm = useTransactionForm(
    fetchLowStockAlerts,
    selectedProduct ? () => fetchInventoryLevels(selectedProduct) : undefined
  );

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoad(true);
        await Promise.all([
          fetchWarehouses(),
          fetchProducts(),
          fetchLowStockAlerts(),
        ]);
      } catch (error: any) {
        console.error('Error loading inventory data:', error);
      } finally {
        setInitialLoad(false);
      }
    };
    loadData();
  }, [fetchWarehouses, fetchProducts, fetchLowStockAlerts]);

  // Fetch inventory levels when product is selected
  useEffect(() => {
    if (selectedProduct) {
      fetchInventoryLevels(selectedProduct);
    }
  }, [selectedProduct, fetchInventoryLevels]);

  const handleSwitchToTransactions = () => {
    setActiveTab('transactions');
  };

  const handleReorder = (productId: string, warehouseId: string) => {
    transactionForm.setFormForProduct(productId, warehouseId);
    setActiveTab('transactions');
  };

  if (initialLoad && loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Manage products, warehouses, and stock levels</p>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStockAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{lowStockAlerts.length} product(s) are below reorder point!</strong>
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => setActiveTab('alerts')}
            >
              View Alerts
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab
            products={products}
            warehouses={warehouses}
            lowStockAlerts={lowStockAlerts}
          />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsTab
            products={products}
            loading={loading}
            productForm={productForm.form}
            onProductFormChange={productForm.setForm}
            showProductDialog={productForm.showDialog}
            onShowProductDialogChange={productForm.setShowDialog}
            onCreateProduct={productForm.handleSubmit}
            onRefreshProducts={fetchProducts}
            onSelectProduct={setSelectedProduct}
            onSwitchToTransactions={handleSwitchToTransactions}
          />
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <WarehousesTab
            warehouses={warehouses}
            loading={loading}
            warehouseForm={warehouseForm.form}
            onWarehouseFormChange={warehouseForm.setForm}
            showWarehouseDialog={warehouseForm.showDialog}
            onShowWarehouseDialogChange={warehouseForm.setShowDialog}
            onCreateWarehouse={warehouseForm.handleSubmit}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionsTab
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            inventoryLevels={inventoryLevels}
            products={products}
            warehouses={warehouses}
            loading={loading}
            transactionForm={transactionForm.form}
            onTransactionFormChange={transactionForm.setForm}
            showTransactionDialog={transactionForm.showDialog}
            onShowTransactionDialogChange={transactionForm.setShowDialog}
            onCreateTransaction={transactionForm.handleSubmit}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsTab
            lowStockAlerts={lowStockAlerts}
            onReorder={handleReorder}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
