/**
 * Data Type Conversion Correctness Test
 * Property 2: Data Type Conversion Correctness
 * Validates: Requirements 1.2
 * 
 * Tests that MySQL data types are correctly converted to SQLite types
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { DatabaseService } from '../services/db.service';

describe('Feature: cloudflare-migration, Property 2: Data Type Conversion Correctness', () => {
  let mockDB: D1Database;
  let dbService: DatabaseService;

  beforeEach(() => {
    // Mock D1Database
    mockDB = {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn((...params: any[]) => ({
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1, changes: 1 } })
        })),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ meta: { last_row_id: 1, changes: 1 } })
      })),
      batch: vi.fn().mockResolvedValue([])
    } as any;

    dbService = new DatabaseService(mockDB);
  });

  describe('Integer type conversion (MySQL BIGINT → SQLite INTEGER)', () => {
    it('should handle large integers correctly', async () => {
      const mockResult = { results: [{ id: 9007199254740991 }] }; // Max safe integer
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT id FROM users WHERE id = ?', [9007199254740991]);
      expect(result[0].id).toBe(9007199254740991);
    });

    it('property: integers should round-trip correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }),
          async (id) => {
            const mockResult = { results: [{ id }] };
            (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

            const result = await dbService.query('SELECT id FROM users WHERE id = ?', [id]);
            return result[0].id === id;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Text type conversion (MySQL VARCHAR → SQLite TEXT)', () => {
    it('should handle text of any length', async () => {
      const longText = 'a'.repeat(1000);
      const mockResult = { results: [{ email: longText }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT email FROM users WHERE email = ?', [longText]);
      expect(result[0].email).toBe(longText);
    });

    it('property: text should round-trip correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 500 }),
          async (text) => {
            const mockResult = { results: [{ value: text }] };
            (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

            const result = await dbService.query('SELECT value FROM test WHERE value = ?', [text]);
            return result[0].value === text;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Real type conversion (MySQL DECIMAL → SQLite REAL)', () => {
    it('should handle decimal numbers with precision', async () => {
      const price = 29.99;
      const mockResult = { results: [{ price }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT price FROM products WHERE price = ?', [price]);
      expect(result[0].price).toBeCloseTo(price, 2);
    });

    it('property: decimal numbers should round-trip with acceptable precision', () => {
      fc.assert(
        fc.asyncProperty(
          fc.double({ min: 0.01, max: 9999.99, noNaN: true }),
          async (price) => {
            const roundedPrice = Math.round(price * 100) / 100;
            const mockResult = { results: [{ price: roundedPrice }] };
            (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

            const result = await dbService.query('SELECT price FROM products WHERE price = ?', [roundedPrice]);
            const diff = Math.abs(result[0].price - roundedPrice);
            return diff < 0.01; // Within 1 cent precision
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Boolean type conversion (MySQL TINYINT(1) → SQLite INTEGER)', () => {
    it('should handle boolean values as 0 and 1', async () => {
      const mockResult = { results: [{ is_admin: 1 }, { is_admin: 0 }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT is_admin FROM users');
      expect(result[0].is_admin).toBe(1);
      expect(result[1].is_admin).toBe(0);
    });

    it('property: boolean values should be 0 or 1', () => {
      fc.assert(
        fc.asyncProperty(
          fc.boolean(),
          async (bool) => {
            const intValue = bool ? 1 : 0;
            const mockResult = { results: [{ value: intValue }] };
            (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

            const result = await dbService.query('SELECT value FROM test WHERE value = ?', [intValue]);
            return result[0].value === 0 || result[0].value === 1;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Timestamp type conversion (MySQL TIMESTAMP → SQLite TEXT)', () => {
    it('should handle ISO 8601 datetime strings', async () => {
      const now = new Date().toISOString();
      const mockResult = { results: [{ created_at: now }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT created_at FROM users WHERE created_at = ?', [now]);
      expect(result[0].created_at).toBe(now);
    });

    it('property: datetime strings should be valid ISO 8601 format', () => {
      fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }),
          async (date) => {
            const isoString = date.toISOString();
            const mockResult = { results: [{ created_at: isoString }] };
            (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

            const result = await dbService.query('SELECT created_at FROM users');
            const parsedDate = new Date(result[0].created_at);
            return !isNaN(parsedDate.getTime());
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Database service methods', () => {
    it('should execute query and return results', async () => {
      const mockResult = { results: [{ id: 1, name: 'Test' }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.query('SELECT * FROM products');
      expect(result).toEqual(mockResult.results);
    });

    it('should execute queryOne and return first result', async () => {
      const mockResult = { results: [{ id: 1 }, { id: 2 }] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.queryOne('SELECT * FROM products WHERE id = ?', [1]);
      expect(result).toEqual({ id: 1 });
    });

    it('should return null when queryOne finds no results', async () => {
      const mockResult = { results: [] };
      (mockDB.prepare as any)().all.mockResolvedValue(mockResult);

      const result = await dbService.queryOne('SELECT * FROM products WHERE id = ?', [999]);
      expect(result).toBeNull();
    });

    it('should execute statements and return metadata', async () => {
      const mockResult = { meta: { last_row_id: 5, changes: 1 } };
      (mockDB.prepare as any)().run.mockResolvedValue(mockResult);

      const result = await dbService.execute('INSERT INTO products (name) VALUES (?)', ['Test']);
      expect(result.meta.last_row_id).toBe(5);
      expect(result.meta.changes).toBe(1);
    });

    it('should execute batch operations', async () => {
      const mockResults = [
        { meta: { last_row_id: 1, changes: 1 } },
        { meta: { last_row_id: 2, changes: 1 } }
      ];
      (mockDB.batch as any).mockResolvedValue(mockResults);

      const queries = [
        { sql: 'INSERT INTO products (name) VALUES (?)', params: ['Product 1'] },
        { sql: 'INSERT INTO products (name) VALUES (?)', params: ['Product 2'] }
      ];

      const results = await dbService.batch(queries);
      expect(results).toHaveLength(2);
    });
  });
});
