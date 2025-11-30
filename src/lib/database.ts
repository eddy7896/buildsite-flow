// Database Query Builder - Supabase-compatible API
// This provides a familiar API for components migrating from Supabase

import { selectRecords, selectOne, insertRecord, updateRecord, deleteRecord } from '@/services/api/postgresql-service';

type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';

interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: any;
}

interface QueryBuilder<T = any> {
  _table: string;
  _select: string;
  _filters: QueryFilter[];
  _orderBy: { column: string; ascending: boolean } | null;
  _limit: number | null;
  _single: boolean;

  select(columns?: string): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  neq(column: string, value: any): QueryBuilder<T>;
  gt(column: string, value: any): QueryBuilder<T>;
  gte(column: string, value: any): QueryBuilder<T>;
  lt(column: string, value: any): QueryBuilder<T>;
  lte(column: string, value: any): QueryBuilder<T>;
  like(column: string, value: string): QueryBuilder<T>;
  ilike(column: string, value: string): QueryBuilder<T>;
  in(column: string, values: any[]): QueryBuilder<T>;
  is(column: string, value: null | boolean): QueryBuilder<T>;
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>;
  limit(count: number): QueryBuilder<T>;
  single(): QueryBuilder<T>;
  maybeSingle(): QueryBuilder<T>;

  insert(data: Partial<T> | Partial<T>[]): InsertBuilder<T>;
  update(data: Partial<T>): UpdateBuilder<T>;
  delete(): DeleteBuilder<T>;

  then<TResult = { data: T[] | T | null; error: Error | null }>(
    onfulfilled?: (value: { data: T[] | T | null; error: Error | null }) => TResult | PromiseLike<TResult>
  ): Promise<TResult>;
}

interface InsertBuilder<T> {
  select(columns?: string): InsertBuilder<T>;
  single(): InsertBuilder<T>;
  then<TResult = { data: T | T[] | null; error: Error | null }>(
    onfulfilled?: (value: { data: T | T[] | null; error: Error | null }) => TResult | PromiseLike<TResult>
  ): Promise<TResult>;
}

interface UpdateBuilder<T> {
  eq(column: string, value: any): UpdateBuilder<T>;
  select(columns?: string): UpdateBuilder<T>;
  single(): UpdateBuilder<T>;
  then<TResult = { data: T | null; error: Error | null }>(
    onfulfilled?: (value: { data: T | null; error: Error | null }) => TResult | PromiseLike<TResult>
  ): Promise<TResult>;
}

interface DeleteBuilder<T> {
  eq(column: string, value: any): DeleteBuilder<T>;
  then<TResult = { data: null; error: Error | null }>(
    onfulfilled?: (value: { data: null; error: Error | null }) => TResult | PromiseLike<TResult>
  ): Promise<TResult>;
}

function createQueryBuilder<T = any>(table: string): QueryBuilder<T> {
  const state = {
    _table: table,
    _select: '*',
    _filters: [] as QueryFilter[],
    _orderBy: null as { column: string; ascending: boolean } | null,
    _limit: null as number | null,
    _single: false,
    _insertData: null as any,
    _updateData: null as any,
    _isInsert: false,
    _isUpdate: false,
    _isDelete: false,
  };

  const builder: QueryBuilder<T> = {
    get _table() { return state._table; },
    get _select() { return state._select; },
    get _filters() { return state._filters; },
    get _orderBy() { return state._orderBy; },
    get _limit() { return state._limit; },
    get _single() { return state._single; },

    select(columns = '*') {
      state._select = columns;
      return builder;
    },

    eq(column: string, value: any) {
      state._filters.push({ column, operator: 'eq', value });
      return builder;
    },

    neq(column: string, value: any) {
      state._filters.push({ column, operator: 'neq', value });
      return builder;
    },

    gt(column: string, value: any) {
      state._filters.push({ column, operator: 'gt', value });
      return builder;
    },

    gte(column: string, value: any) {
      state._filters.push({ column, operator: 'gte', value });
      return builder;
    },

    lt(column: string, value: any) {
      state._filters.push({ column, operator: 'lt', value });
      return builder;
    },

    lte(column: string, value: any) {
      state._filters.push({ column, operator: 'lte', value });
      return builder;
    },

    like(column: string, value: string) {
      state._filters.push({ column, operator: 'like', value });
      return builder;
    },

    ilike(column: string, value: string) {
      state._filters.push({ column, operator: 'ilike', value });
      return builder;
    },

    in(column: string, values: any[]) {
      state._filters.push({ column, operator: 'in', value: values });
      return builder;
    },

    is(column: string, value: null | boolean) {
      state._filters.push({ column, operator: 'is', value });
      return builder;
    },

    order(column: string, options = { ascending: true }) {
      state._orderBy = { column, ascending: options.ascending ?? true };
      return builder;
    },

    limit(count: number) {
      state._limit = count;
      return builder;
    },

    single() {
      state._single = true;
      state._limit = 1;
      return builder;
    },

    maybeSingle() {
      state._single = true;
      state._limit = 1;
      return builder;
    },

    insert(data: Partial<T> | Partial<T>[]) {
      state._isInsert = true;
      state._insertData = data;
      
      const insertBuilder: InsertBuilder<T> = {
        select(columns = '*') {
          state._select = columns;
          return insertBuilder;
        },
        single() {
          state._single = true;
          return insertBuilder;
        },
        async then(onfulfilled) {
          try {
            const dataArray = Array.isArray(state._insertData) ? state._insertData : [state._insertData];
            const results: T[] = [];
            
            for (const item of dataArray) {
              const result = await insertRecord<T>(state._table, item);
              results.push(result);
            }
            
            const response = {
              data: state._single ? results[0] : results,
              error: null
            };
            return onfulfilled ? onfulfilled(response) : response;
          } catch (error: any) {
            const response = { data: null, error };
            return onfulfilled ? onfulfilled(response) : response;
          }
        }
      };
      
      return insertBuilder;
    },

    update(data: Partial<T>) {
      state._isUpdate = true;
      state._updateData = data;
      
      const updateBuilder: UpdateBuilder<T> = {
        eq(column: string, value: any) {
          state._filters.push({ column, operator: 'eq', value });
          return updateBuilder;
        },
        select(columns = '*') {
          state._select = columns;
          return updateBuilder;
        },
        single() {
          state._single = true;
          return updateBuilder;
        },
        async then(onfulfilled) {
          try {
            const where: Record<string, any> = {};
            state._filters.forEach(f => {
              if (f.operator === 'eq') {
                where[f.column] = f.value;
              }
            });
            
            const result = await updateRecord<T>(state._table, state._updateData, where);
            const response = { data: result, error: null };
            return onfulfilled ? onfulfilled(response) : response;
          } catch (error: any) {
            const response = { data: null, error };
            return onfulfilled ? onfulfilled(response) : response;
          }
        }
      };
      
      return updateBuilder;
    },

    delete() {
      state._isDelete = true;
      
      const deleteBuilder: DeleteBuilder<T> = {
        eq(column: string, value: any) {
          state._filters.push({ column, operator: 'eq', value });
          return deleteBuilder;
        },
        async then(onfulfilled) {
          try {
            const where: Record<string, any> = {};
            state._filters.forEach(f => {
              if (f.operator === 'eq') {
                where[f.column] = f.value;
              }
            });
            
            await deleteRecord(state._table, where);
            const response = { data: null, error: null };
            return onfulfilled ? onfulfilled(response) : response;
          } catch (error: any) {
            const response = { data: null, error };
            return onfulfilled ? onfulfilled(response) : response;
          }
        }
      };
      
      return deleteBuilder;
    },

    async then(onfulfilled) {
      try {
        const where: Record<string, any> = {};
        state._filters.forEach(f => {
          if (f.operator === 'eq') {
            where[f.column] = f.value;
          }
          // TODO: Handle other operators
        });

        let data: T | T[] | null;

        if (state._single) {
          data = await selectOne<T>(state._table, where);
        } else {
          data = await selectRecords<T>(state._table, {
            select: state._select,
            where,
            orderBy: state._orderBy?.column 
              ? `${state._orderBy.column} ${state._orderBy.ascending ? 'ASC' : 'DESC'}` 
              : undefined,
            limit: state._limit || undefined,
          });
        }

        const response = { data, error: null };
        return onfulfilled ? onfulfilled(response) : response;
      } catch (error: any) {
        const response = { data: null, error };
        return onfulfilled ? onfulfilled(response) : response;
      }
    }
  };

  return builder;
}

// Main database interface - Supabase-compatible
export const db = {
  from<T = any>(table: string): QueryBuilder<T> {
    return createQueryBuilder<T>(table);
  },

  // Direct access to low-level functions
  selectRecords,
  selectOne,
  insertRecord,
  updateRecord,
  deleteRecord,
};

// For backwards compatibility with Supabase imports
export const supabase = db;

export default db;

