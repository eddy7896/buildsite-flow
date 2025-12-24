import { getApiEndpoint } from '@/config/services';
import type { SystemMetricsResponse } from '@/types/system';
import { SystemMetricsResponseSchema } from '@/types/system';

interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

interface ApiErrorShape {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: string;
  };
  message?: string;
}

type ApiResponseShape<T> = ApiSuccess<T> | ApiErrorShape;

function getAuthHeaders() {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = window.localStorage.getItem('auth_token') || '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  let parsed: ApiResponseShape<T>;
  try {
    parsed = JSON.parse(text);
  } catch {
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    // Fallback when backend does not wrap in { success, data }
    return JSON.parse(text) as T;
  }

  if (!('success' in parsed)) {
    // Not our standard envelope – assume raw payload
    return parsed as unknown as T;
  }

  if (!parsed.success) {
    // Type guard: if success is false, it's an error response
    const errorResponse = parsed as { success: false; error?: string; message?: string };
    const message = errorResponse.error || errorResponse.message || 'Request failed';
    throw new Error(message);
  }

  return parsed.data;
}

/**
 * Fetch system-wide metrics and agency summaries for the System Dashboard.
 * Requires an authenticated super_admin user.
 */
export async function fetchSystemMetrics(): Promise<SystemMetricsResponse> {
  const endpoint = getApiEndpoint('/system/metrics');

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to load system metrics (status ${response.status})`);
  }

  const data = await handleJsonResponse<SystemMetricsResponse>(response);
  // Runtime validation to guard against unexpected backend responses
  return SystemMetricsResponseSchema.parse(data);
}

