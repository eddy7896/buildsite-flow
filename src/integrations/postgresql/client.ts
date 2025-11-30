// PostgreSQL-compatible Database Client for Browser
// Uses localStorage for persistence until a real backend is available

type QueryResult<T> = {
  rows: T[];
  rowCount: number;
};

// In-memory + localStorage database simulation
class BrowserDatabaseClient {
  private storage: Map<string, any[]> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('buildflow_db');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([table, records]) => {
          this.storage.set(table, records as any[]);
        });
      }
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to load database from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data: Record<string, any[]> = {};
      this.storage.forEach((records, table) => {
        data[table] = records;
      });
      localStorage.setItem('buildflow_db', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save database to storage:', error);
    }
  }

  private getTable(tableName: string): any[] {
    const cleanName = tableName.replace('public.', '');
    if (!this.storage.has(cleanName)) {
      this.storage.set(cleanName, []);
    }
    return this.storage.get(cleanName)!;
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  private parseQuery(sql: string): { type: string; table: string; conditions: any } {
    const cleanSql = sql.trim().toUpperCase();
    let table = '';
    
    // Extract table name
    const fromMatch = sql.match(/FROM\s+(?:public\.)?(\w+)/i);
    const intoMatch = sql.match(/INTO\s+(?:public\.)?(\w+)/i);
    const updateMatch = sql.match(/UPDATE\s+(?:public\.)?(\w+)/i);
    
    if (fromMatch) table = fromMatch[1];
    else if (intoMatch) table = intoMatch[1];
    else if (updateMatch) table = updateMatch[1];
    
    let type = 'SELECT';
    if (cleanSql.startsWith('INSERT')) type = 'INSERT';
    else if (cleanSql.startsWith('UPDATE')) type = 'UPDATE';
    else if (cleanSql.startsWith('DELETE')) type = 'DELETE';
    
    return { type, table, conditions: {} };
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const { type, table } = this.parseQuery(sql);
    const records = this.getTable(table);
    
    console.log(`[DB] ${type} on ${table}`, { sql: sql.substring(0, 100), params });
    
    switch (type) {
      case 'SELECT':
        return this.handleSelect<T>(sql, params, records);
      case 'INSERT':
        return this.handleInsert<T>(sql, params, table);
      case 'UPDATE':
        return this.handleUpdate<T>(sql, params, table);
      case 'DELETE':
        return this.handleDelete<T>(sql, params, table);
      default:
        return { rows: [], rowCount: 0 };
    }
  }

  private handleSelect<T>(sql: string, params: any[], records: any[]): QueryResult<T> {
    let result = [...records];
    
    // Handle WHERE clauses with parameters
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:ORDER|LIMIT|$)/is);
    if (whereMatch && params.length > 0) {
      const conditions = whereMatch[1];
      result = result.filter(record => {
        let paramIndex = 0;
        let match = true;
        
        // Parse each condition
        const condParts = conditions.split(/\s+AND\s+/i);
        for (const cond of condParts) {
          const eqMatch = cond.match(/(\w+)\s*=\s*\$(\d+)/);
          const isNullMatch = cond.match(/(\w+)\s+IS\s+NULL/i);
          const inMatch = cond.match(/(\w+)\s+IN\s*\(/i);
          
          if (eqMatch) {
            const field = eqMatch[1];
            const pIdx = parseInt(eqMatch[2]) - 1;
            if (params[pIdx] !== undefined && record[field] !== params[pIdx]) {
              match = false;
            }
          } else if (isNullMatch) {
            const field = isNullMatch[1];
            if (record[field] !== null && record[field] !== undefined) {
              match = false;
            }
          }
        }
        return match;
      });
    }
    
    // Handle ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const desc = orderMatch[2]?.toUpperCase() === 'DESC';
      result.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';
        return desc ? String(bVal).localeCompare(String(aVal)) : String(aVal).localeCompare(String(bVal));
      });
    }
    
    // Handle LIMIT
    const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      result = result.slice(0, parseInt(limitMatch[1]));
    }
    
    return { rows: result as T[], rowCount: result.length };
  }

  private handleInsert<T>(sql: string, params: any[], table: string): QueryResult<T> {
    const records = this.getTable(table);
    
    // Parse column names
    const colMatch = sql.match(/\(([^)]+)\)\s*VALUES/i);
    if (!colMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const columns = colMatch[1].split(',').map(c => c.trim());
    const newRecord: any = {
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    columns.forEach((col, idx) => {
      if (params[idx] !== undefined) {
        newRecord[col] = params[idx];
      }
    });
    
    // Ensure ID is set if not provided
    if (!newRecord.id) {
      newRecord.id = this.generateId();
    }
    
    records.push(newRecord);
    this.saveToStorage();
    
    return { rows: [newRecord as T], rowCount: 1 };
  }

  private handleUpdate<T>(sql: string, params: any[], table: string): QueryResult<T> {
    const records = this.getTable(table);
    
    // Parse SET clause
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:RETURNING|$)/is);
    
    if (!setMatch || !whereMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    // Find record to update
    const whereConditions = whereMatch[1];
    const idMatch = whereConditions.match(/id\s*=\s*\$(\d+)/);
    
    let targetId: string | null = null;
    if (idMatch) {
      targetId = params[parseInt(idMatch[1]) - 1];
    }
    
    const recordIndex = records.findIndex(r => r.id === targetId);
    if (recordIndex === -1) {
      return { rows: [], rowCount: 0 };
    }
    
    // Parse SET fields
    const setFields = setMatch[1].split(',');
    setFields.forEach(field => {
      const fieldMatch = field.match(/(\w+)\s*=\s*(?:\$(\d+)|NOW\(\))/i);
      if (fieldMatch) {
        const fieldName = fieldMatch[1].trim();
        if (fieldMatch[2]) {
          records[recordIndex][fieldName] = params[parseInt(fieldMatch[2]) - 1];
        } else {
          records[recordIndex][fieldName] = new Date().toISOString();
        }
      }
    });
    
    records[recordIndex].updated_at = new Date().toISOString();
    this.saveToStorage();
    
    return { rows: [records[recordIndex] as T], rowCount: 1 };
  }

  private handleDelete<T>(sql: string, params: any[], table: string): QueryResult<T> {
    const records = this.getTable(table);
    
    const whereMatch = sql.match(/WHERE\s+(.+?)$/is);
    if (!whereMatch) {
      return { rows: [], rowCount: 0 };
    }
    
    const idMatch = whereMatch[1].match(/id\s*=\s*\$(\d+)/);
    let targetId: string | null = null;
    if (idMatch) {
      targetId = params[parseInt(idMatch[1]) - 1];
    }
    
    const recordIndex = records.findIndex(r => r.id === targetId);
    if (recordIndex === -1) {
      return { rows: [], rowCount: 0 };
    }
    
    records.splice(recordIndex, 1);
    this.saveToStorage();
    
    return { rows: [], rowCount: 1 };
  }

  // Transaction support (simplified for browser)
  async connect(): Promise<BrowserDatabaseClient> {
    return this;
  }

  release(): void {
    // No-op for browser
  }
}

// Singleton instance
const pool = new BrowserDatabaseClient();

// Query helper with error handling
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params || []);
    const duration = Date.now() - start;
    console.log('[DB Query]', { text: text.substring(0, 80), duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('[DB Error]', { text, error });
    throw error;
  }
}

// Get a single row
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const result = await query<T>(text, params);
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

// Transaction helper (simplified)
export async function transaction<T>(
  callback: (client: BrowserDatabaseClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    const result = await callback(client);
    return result;
  } finally {
    client.release();
  }
}

// Close pool (no-op for browser)
export async function closePool(): Promise<void> {
  // No-op
}

// Export for use in base.ts
export const pgClient = {
  query: async (text: string, params?: any[]) => query(text, params),
};

export default pool;
