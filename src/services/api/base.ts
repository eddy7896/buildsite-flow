import { supabase } from '@/integrations/supabase/client';
import { TIMEOUT_CONFIG, RETRY_CONFIG, ERROR_MESSAGES } from '@/constants';
import { useAppStore } from '@/stores/appStore';

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

export interface ApiOptions {
  timeout?: number;
  retries?: number;
  showLoading?: boolean;
  showErrorToast?: boolean;
}

class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class BaseApiService {
  private static async withRetry<T>(
    operation: () => Promise<T>,
    options: ApiOptions = {}
  ): Promise<T> {
    const maxRetries = options.retries ?? RETRY_CONFIG.MAX_ATTEMPTS;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on auth errors or client errors
        if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(
          RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_FACTOR, attempt),
          RETRY_CONFIG.MAX_DELAY
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  private static async withTimeout<T>(
    operation: () => Promise<T>,
    timeout: number = TIMEOUT_CONFIG.DEFAULT_REQUEST
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new ApiError(ERROR_MESSAGES.NETWORK_ERROR, 'TIMEOUT')), timeout)
      ),
    ]);
  }

  protected static async execute<T>(
    operation: () => Promise<{ data: T; error: any }>,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    const { setLoading, addNotification } = useAppStore.getState();

    try {
      if (options.showLoading) {
        setLoading(true);
      }

      const result = await this.withTimeout(
        () => this.withRetry(operation, options),
        options.timeout
      );

      if (result.error) {
        const errorMessage = this.formatError(result.error);
        
        if (options.showErrorToast) {
          addNotification({
            type: 'error',
            title: 'Operation Failed',
            message: errorMessage,
            priority: 'high'
          });
        }

        return {
          data: null,
          error: errorMessage,
          success: false
        };
      }

      return {
        data: result.data,
        error: null,
        success: true
      };
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : ERROR_MESSAGES.SERVER_ERROR;

      if (options.showErrorToast) {
        addNotification({
          type: 'error',
          title: 'Request Failed',
          message: errorMessage,
          priority: 'high'
        });
      }

      return {
        data: null,
        error: errorMessage,
        success: false
      };
    } finally {
      if (options.showLoading) {
        setLoading(false);
      }
    }
  }

  private static formatError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error_description) {
      return error.error_description;
    }

    if (error?.details) {
      return error.details;
    }

    return ERROR_MESSAGES.SERVER_ERROR;
  }

  // Simplified Supabase helpers - avoiding complex generic constraints
  protected static async query<T = any>(
    table: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      limit?: number;
      single?: boolean;
    } = {},
    apiOptions: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.execute(async () => {
      let query = (supabase as any).from(table).select(options.select || '*');

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.single) {
        return await query.maybeSingle();
      }

      return await query;
    }, apiOptions);
  }

  protected static async insert<T = any>(
    table: string,
    data: any,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.execute(async () => {
      return await (supabase as any).from(table).insert(data).select().single();
    }, options);
  }

  protected static async update<T = any>(
    table: string,
    data: any,
    filters: Record<string, any>,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.execute(async () => {
      let query = (supabase as any).from(table).update(data);

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      return await query.select().single();
    }, options);
  }

  protected static async delete<T = any>(
    table: string,
    filters: Record<string, any>,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.execute(async () => {
      let query = (supabase as any).from(table).delete();

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      return await query;
    }, options);
  }

  protected static async rpc<T = any>(
    functionName: string,
    params: Record<string, any> = {},
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.execute(async () => {
      return await (supabase.rpc as any)(functionName, params);
    }, options);
  }
}