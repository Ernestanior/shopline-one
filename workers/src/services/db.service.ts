/**
 * Database Service Layer
 * Provides abstraction over D1 database operations
 */

export class DatabaseService {
  constructor(private db: D1Database) {}

  /**
   * Execute a query and return all results
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      const result = await bound.all();
      return (result.results as T[]) || [];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error('Database query failed');
    }
  }

  /**
   * Execute a query and return the first result
   */
  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   * Returns the result metadata
   */
  async execute(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      const stmt = this.db.prepare(sql);
      const bound = params.length > 0 ? stmt.bind(...params) : stmt;
      return await bound.run();
    } catch (error) {
      console.error('Database execute error:', {
        sql,
        params,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Execute multiple statements in a batch
   * Useful for transactions
   */
  async batch(queries: Array<{ sql: string; params: any[] }>): Promise<D1Result[]> {
    try {
      const statements = queries.map(q => {
        const stmt = this.db.prepare(q.sql);
        return q.params.length > 0 ? stmt.bind(...q.params) : stmt;
      });
      return await this.db.batch(statements);
    } catch (error) {
      console.error('Database batch error:', error);
      throw new Error('Database batch operation failed');
    }
  }

  /**
   * Get the last inserted row ID
   */
  getLastInsertId(result: D1Result): number | null {
    return result.meta.last_row_id || null;
  }

  /**
   * Get the number of affected rows
   */
  getAffectedRows(result: D1Result): number {
    return result.meta.changes || 0;
  }
}
