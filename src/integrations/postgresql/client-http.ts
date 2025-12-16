// HTTP-based PostgreSQL Client for Browser
// Makes API calls to backend server that connects to PostgreSQL

import { config } from '@/config';

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

const API_URL = config.api.url || 'http://localhost:3000/api';

/**
 * HTTP-based PostgreSQL client that makes API calls to backend
 */
class HttpDatabaseClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
    body?: any
  ): Promise<QueryResult<T>> {
    try {
      const url = `${this.baseUrl}/database${endpoint}`;

      // Build headers with optional auth + agency context so backend
      // can route queries to the correct per-agency database
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (typeof window !== 'undefined') {
        const token = window.localStorage.getItem('auth_token') || '';
        const agencyDatabase = window.localStorage.getItem('agency_database') || '';

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        if (agencyDatabase) {
          headers['X-Agency-Database'] = agencyDatabase;
        }
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Database API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      // Handle different response formats
      if (result.rows !== undefined) {
        return result as QueryResult<T>;
      } else if (Array.isArray(result)) {
        return {
          rows: result as T[],
          rowCount: result.length,
        };
      } else if (result.data !== undefined) {
        return {
          rows: Array.isArray(result.data) ? result.data as T[] : [result.data as T],
          rowCount: Array.isArray(result.data) ? result.data.length : 1,
        };
      } else {
        // Single object response
        return {
          rows: [result as T],
          rowCount: 1,
        };
      }
    } catch (error: any) {
      console.error('[HTTP DB Client] Request failed:', error);
      throw error;
    }
  }

  async query<T = any>(sql: string, params: any[] = [], userId?: string): Promise<QueryResult<T>> {
    console.log('[HTTP DB] Executing query:', sql.substring(0, 100));
    
    return this.makeRequest<T>('/query', 'POST', {
      sql,
      params,
      userId, // Pass userId to backend to set context
    });
  }
}

// Singleton instance
const httpClient = new HttpDatabaseClient();

// Query helper with error handling
export async function query<T = any>(
  text: string,
  params?: any[],
  userId?: string
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await httpClient.query<T>(text, params || [], userId);
    const duration = Date.now() - start;
    console.log('[HTTP DB Query]', { 
      text: text.substring(0, 80), 
      duration, 
      rows: result.rowCount 
    });
    return result;
  } catch (error) {
    console.error('[HTTP DB Error]', { text, error });
    throw error;
  }
}

// Get a single row
export async function queryOne<T = any>(
  text: string,
  params?: any[],
  userId?: string
): Promise<T | null> {
  const result = await query<T>(text, params, userId);
  return result.rows[0] || null;
}

// Get multiple rows
export async function queryMany<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const result = await query<T>(text, params);
  return result.rows;
}

// Execute without returning rows
export async function execute(
  text: string,
  params?: any[]
): Promise<number> {
  const result = await query(text, params);
  return result.rowCount || 0;
}

// Transaction helper for HTTP
export async function transaction<T>(
  callback: (client: { query: (sql: string, params?: any[]) => Promise<{ rows: any[]; rowCount: number }> }) => Promise<T>
): Promise<T> {
  // Collect all queries during the callback
  const queries: Array<{ sql: string; params: any[] }> = [];
  const queryResults: Array<{ rows: any[]; rowCount: number }> = [];
  let queryIndex = 0;
  
  // Create a mock client that collects queries and stores results
  const mockClient = {
    query: async (sql: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> => {
      const currentIndex = queryIndex++;
      queries.push({ sql, params });
      
      // Return a promise that will be resolved with actual results
      return new Promise((resolve) => {
        // Store resolver to call after transaction completes
        (mockClient as any)._resolvers = (mockClient as any)._resolvers || [];
        (mockClient as any)._resolvers.push({ index: currentIndex, resolve });
      });
    }
  };
  
  // Start callback execution (it will collect queries)
  const callbackPromise = callback(mockClient);
  
  // Wait for all queries to be collected
  await new Promise(resolve => setTimeout(resolve, 0));
  
  // If no queries, just return callback result
  if (queries.length === 0) {
    return await callbackPromise;
  }
  
  // Execute all queries in a transaction via backend
  try {
    const response = await fetch(`${httpClient['baseUrl']}/database/transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queries,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transaction failed: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    // Resolve all query promises with actual results
    if (result.results && (mockClient as any)._resolvers) {
      result.results.forEach((queryResult: any, index: number) => {
        const resolver = (mockClient as any)._resolvers.find((r: any) => r.index === index);
        if (resolver) {
          resolver.resolve({
            rows: queryResult.rows || [],
            rowCount: queryResult.rowCount || 0,
          });
        }
      });
    }
    
    // Wait for callback to complete
    return await callbackPromise;
  } catch (error) {
    console.error('[HTTP Transaction] Error:', error);
    throw error;
  }
}

// Close pool (no-op for HTTP)
export async function closePool(): Promise<void> {
  // No-op
}

// Export for use in base.ts
export const pgClient = {
  query: async (text: string, params?: any[]) => query(text, params),
};

export default httpClient;

