// PostgreSQL API Service
import { queryOne, queryMany, execute, transaction } from '@/integrations/postgresql/client';
import type { QueryResult } from 'pg';

export interface ApiOptions {
  select?: string;
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Build WHERE clause from conditions
 */
function buildWhereClause(where: Record<string, any>): { clause: string; params: any[] } {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      conditions.push(`${key} IS NULL`);
    } else if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${paramIndex++}`).join(',');
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...value);
    } else if (typeof value === 'object' && value.operator) {
      // Support operators like { operator: '>', value: 100 }
      conditions.push(`${key} ${value.operator} $${paramIndex++}`);
      params.push(value.value);
    } else {
      conditions.push(`${key} = $${paramIndex++}`);
      params.push(value);
    }
  }

  return {
    clause: conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '',
    params,
  };
}

/**
 * Select records from table
 */
export async function selectRecords<T = any>(
  table: string,
  options: ApiOptions = {}
): Promise<T[]> {
  const { select = '*', where = {}, orderBy = '', limit, offset } = options;

  let query = `SELECT ${select} FROM public.${table}`;
  let params: any[] = [];

  if (Object.keys(where).length > 0) {
    const { clause, params: whereParams } = buildWhereClause(where);
    query += ` ${clause}`;
    params = whereParams;
  }

  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  if (offset) {
    query += ` OFFSET ${offset}`;
  }

  return queryMany<T>(query, params);
}

/**
 * Select single record
 */
export async function selectOne<T = any>(
  table: string,
  where: Record<string, any>
): Promise<T | null> {
  const { clause, params } = buildWhereClause(where);
  const query = `SELECT * FROM public.${table} ${clause} LIMIT 1`;
  return queryOne<T>(query, params);
}

/**
 * Insert record
 */
export async function insertRecord<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');

  const query = `
    INSERT INTO public.${table} (${keys.join(',')})
    VALUES (${placeholders})
    RETURNING *
  `;

  const result = await queryOne<T>(query, values);
  if (!result) {
    throw new Error(`Failed to insert record into ${table}`);
  }

  return result;
}

/**
 * Update record
 */
export async function updateRecord<T = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<T> {
  const updateKeys = Object.keys(data);
  const updateValues = Object.values(data);
  const setClause = updateKeys.map((key, i) => `${key} = $${i + 1}`).join(',');

  const { clause: whereClause, params: whereParams } = buildWhereClause(where);
  const allParams = [...updateValues, ...whereParams];

  const query = `
    UPDATE public.${table}
    SET ${setClause}, updated_at = NOW()
    ${whereClause}
    RETURNING *
  `;

  const result = await queryOne<T>(query, allParams);
  if (!result) {
    throw new Error(`Failed to update record in ${table}`);
  }

  return result;
}

/**
 * Delete record
 */
export async function deleteRecord(
  table: string,
  where: Record<string, any>
): Promise<number> {
  const { clause, params } = buildWhereClause(where);
  const query = `DELETE FROM public.${table} ${clause}`;
  return execute(query, params);
}

/**
 * Count records
 */
export async function countRecords(
  table: string,
  where: Record<string, any> = {}
): Promise<number> {
  let query = `SELECT COUNT(*) as count FROM public.${table}`;
  let params: any[] = [];

  if (Object.keys(where).length > 0) {
    const { clause, params: whereParams } = buildWhereClause(where);
    query += ` ${clause}`;
    params = whereParams;
  }

  const result = await queryOne<{ count: number }>(query, params);
  return result?.count || 0;
}

/**
 * Execute raw query
 */
export async function rawQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  return queryMany<T>(query, params);
}

/**
 * Execute raw query for single result
 */
export async function rawQueryOne<T = any>(
  query: string,
  params: any[] = []
): Promise<T | null> {
  return queryOne<T>(query, params);
}

/**
 * Execute transaction
 */
export async function executeTransaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  return transaction(callback);
}

/**
 * Batch insert records
 */
export async function batchInsert<T = any>(
  table: string,
  records: Record<string, any>[]
): Promise<T[]> {
  if (records.length === 0) {
    return [];
  }

  const keys = Object.keys(records[0]);
  const values: any[] = [];
  const placeholders: string[] = [];

  records.forEach((record, recordIndex) => {
    const recordPlaceholders: string[] = [];
    keys.forEach((key, keyIndex) => {
      const paramIndex = recordIndex * keys.length + keyIndex + 1;
      recordPlaceholders.push(`$${paramIndex}`);
      values.push(record[key]);
    });
    placeholders.push(`(${recordPlaceholders.join(',')})`);
  });

  const query = `
    INSERT INTO public.${table} (${keys.join(',')})
    VALUES ${placeholders.join(',')}
    RETURNING *
  `;

  return queryMany<T>(query, values);
}

/**
 * Batch update records
 */
export async function batchUpdate<T = any>(
  table: string,
  records: (Record<string, any> & { id: string })[]
): Promise<T[]> {
  const results: T[] = [];

  for (const record of records) {
    const { id, ...data } = record;
    const result = await updateRecord<T>(table, data, { id });
    results.push(result);
  }

  return results;
}

/**
 * Upsert record (insert or update)
 */
export async function upsertRecord<T = any>(
  table: string,
  data: Record<string, any>,
  uniqueKey: string
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const updateClause = keys.map((key) => `${key} = EXCLUDED.${key}`).join(',');

  const query = `
    INSERT INTO public.${table} (${keys.join(',')})
    VALUES (${placeholders})
    ON CONFLICT (${uniqueKey}) DO UPDATE SET ${updateClause}
    RETURNING *
  `;

  const result = await queryOne<T>(query, values);
  if (!result) {
    throw new Error(`Failed to upsert record in ${table}`);
  }

  return result;
}

/**
 * Get paginated records
 */
export async function getPaginated<T = any>(
  table: string,
  page: number = 1,
  pageSize: number = 10,
  options: Omit<ApiOptions, 'limit' | 'offset'> = {}
): Promise<{ data: T[]; total: number; page: number; pageSize: number }> {
  const offset = (page - 1) * pageSize;
  const data = await selectRecords<T>(table, {
    ...options,
    limit: pageSize,
    offset,
  });

  const total = await countRecords(table, options.where);

  return {
    data,
    total,
    page,
    pageSize,
  };
}
