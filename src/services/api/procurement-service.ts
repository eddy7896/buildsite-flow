/**
 * Procurement Management Service
 * Frontend API client for procurement operations
 */

import { getApiBaseUrl } from '@/config/api';

const API_BASE = getApiBaseUrl();

export interface PurchaseRequisition {
  id: string;
  agency_id: string;
  requisition_number: string;
  requested_by: string;
  department_id?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  required_date?: string;
  total_amount: number;
  notes?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  agency_id: string;
  po_number: string;
  requisition_id?: string;
  supplier_id: string;
  status: 'draft' | 'sent' | 'acknowledged' | 'partial' | 'received' | 'completed' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string;
  delivery_address?: string;
  payment_terms?: string;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  discount_amount: number;
  total_amount: number;
  notes?: string;
  terms_conditions?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  supplier_name?: string;
  supplier_code?: string;
}

export interface GoodsReceipt {
  id: string;
  agency_id: string;
  grn_number: string;
  po_id: string;
  warehouse_id: string;
  received_date: string;
  received_by?: string;
  status: 'pending' | 'inspected' | 'approved' | 'rejected';
  inspection_notes?: string;
  quality_status?: 'passed' | 'failed' | 'partial';
  inspected_by?: string;
  inspected_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  po_number?: string;
  warehouse_name?: string;
  warehouse_code?: string;
}

/**
 * Get authentication token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Get purchase requisitions
 */
export async function getPurchaseRequisitions(filters?: {
  status?: string;
}): Promise<PurchaseRequisition[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);

  const response = await fetch(`${API_BASE}/api/procurement/requisitions?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch requisitions' }));
    throw new Error(error.error || 'Failed to fetch requisitions');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Create purchase requisition
 */
export async function createPurchaseRequisition(requisitionData: Partial<PurchaseRequisition>): Promise<PurchaseRequisition> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/procurement/requisitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(requisitionData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create requisition' }));
    throw new Error(error.error || 'Failed to create requisition');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get purchase orders
 */
export async function getPurchaseOrders(filters?: {
  status?: string;
  supplier_id?: string;
}): Promise<PurchaseOrder[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);
  if (filters?.supplier_id) queryParams.append('supplier_id', filters.supplier_id);

  const response = await fetch(`${API_BASE}/api/procurement/purchase-orders?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch purchase orders' }));
    throw new Error(error.error || 'Failed to fetch purchase orders');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Create purchase order
 */
export async function createPurchaseOrder(poData: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/procurement/purchase-orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(poData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create purchase order' }));
    throw new Error(error.error || 'Failed to create purchase order');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get goods receipts
 */
export async function getGoodsReceipts(filters?: {
  status?: string;
}): Promise<GoodsReceipt[]> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.append('status', filters.status);

  const response = await fetch(`${API_BASE}/api/procurement/goods-receipts?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch goods receipts' }));
    throw new Error(error.error || 'Failed to fetch goods receipts');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Create goods receipt
 */
export async function createGoodsReceipt(grnData: Partial<GoodsReceipt>): Promise<GoodsReceipt> {
  const token = getAuthToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE}/api/procurement/goods-receipts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Agency-Database': localStorage.getItem('agency_database') || '',
    },
    body: JSON.stringify(grnData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create goods receipt' }));
    throw new Error(error.error || 'Failed to create goods receipt');
  }

  const result = await response.json();
  return result.data;
}
