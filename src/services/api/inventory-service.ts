/**
 * Inventory Management Service
 * Frontend API client for inventory operations
 */

import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface Warehouse {
  id: string;
  agency_id: string;
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  agency_id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  brand?: string;
  unit_of_measure: string;
  barcode?: string;
  qr_code?: string;
  weight?: number;
  dimensions?: string;
  image_url?: string;
  is_active: boolean;
  is_trackable: boolean;
  track_by: 'serial' | 'batch' | 'none';
  created_at: string;
  updated_at: string;
}

export interface InventoryLevel {
  id: string;
  product_id: string;
  variant_id?: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  max_stock?: number;
  min_stock?: number;
  valuation_method: string;
  average_cost: number;
  last_cost: number;
  product_name: string;
  product_sku: string;
  warehouse_name: string;
  warehouse_code: string;
}

export interface InventoryTransaction {
  id: string;
  agency_id: string;
  inventory_id: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference_type?: string;
  reference_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  serial_numbers?: string[];
  batch_number?: string;
  expiry_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Get warehouses
 */
export async function getWarehouses(): Promise<Warehouse[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const response = await fetch(`${API_BASE}/api/inventory/warehouses`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Agency-Database': localStorage.getItem('agency_database') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Unable to reach the API server. Please ensure the backend is running on http://localhost:3000');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch warehouses' }));
      throw new Error(error.error || 'Failed to fetch warehouses');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to reach the API server. Please ensure the backend is running on http://localhost:3000');
    }
    throw error;
  }
}

/**
 * Create warehouse
 */
export async function createWarehouse(warehouseData: Partial<Warehouse>): Promise<Warehouse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/inventory/warehouses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(warehouseData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create warehouse' }));
    throw new Error(error.error || 'Failed to create warehouse');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get products
 */
export async function getProducts(filters?: {
  category_id?: string;
  is_active?: boolean;
  search?: string;
  limit?: number;
}): Promise<Product[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const queryParams = new URLSearchParams();
    if (filters?.category_id) queryParams.append('category_id', filters.category_id);
    if (filters?.is_active !== undefined) queryParams.append('is_active', String(filters.is_active));
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.limit) queryParams.append('limit', String(filters.limit));

    const response = await fetch(`${API_BASE}/api/inventory/products?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Agency-Database': localStorage.getItem('agency_database') || '',
      },
    });

    if (!response.ok) {
      if (response.status === 0 || response.status >= 500) {
        throw new Error('Unable to reach the API server. Please ensure the backend is running on http://localhost:3000');
      }
      const error = await response.json().catch(() => ({ error: 'Failed to fetch products' }));
      throw new Error(error.error || 'Failed to fetch products');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error: any) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Unable to reach the API server. Please ensure the backend is running on http://localhost:3000');
    }
    throw error;
  }
}

/**
 * Create product
 */
export async function createProduct(productData: Partial<Product>): Promise<Product> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/inventory/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(productData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create product' }));
    throw new Error(error.error || 'Failed to create product');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get inventory levels for a product
 */
export async function getInventoryLevels(productId: string, variantId?: string): Promise<InventoryLevel[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (variantId) queryParams.append('variant_id', variantId);

  const response = await fetch(`${API_BASE}/api/inventory/products/${productId}/levels?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch inventory levels' }));
    throw new Error(error.error || 'Failed to fetch inventory levels');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Create inventory transaction
 */
export async function createInventoryTransaction(transactionData: Partial<InventoryTransaction>): Promise<InventoryTransaction> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/inventory/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(transactionData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create transaction' }));
    throw new Error(error.error || 'Failed to create transaction');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get low stock alerts
 */
export async function getLowStockAlerts(): Promise<InventoryLevel[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/inventory/alerts/low-stock`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch alerts' }));
    throw new Error(error.error || 'Failed to fetch alerts');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Generate product code (barcode/QR)
 */
export async function generateProductCode(productId: string, codeType: 'barcode' | 'qr' = 'barcode'): Promise<string> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/inventory/products/${productId}/generate-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify({ codeType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate code' }));
    throw new Error(error.error || 'Failed to generate code');
  }

  const result = await response.json();
  return result.data.code;
}
