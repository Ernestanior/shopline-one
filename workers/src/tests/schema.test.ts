/**
 * Schema Migration Completeness Test
 * Property 1: Schema Migration Completeness
 * Validates: Requirements 1.1, 1.3
 * 
 * Tests that all MySQL tables have been migrated to D1 with correct structure
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Feature: cloudflare-migration, Property 1: Schema Migration Completeness', () => {
  const schemaSQL = readFileSync(join(__dirname, '../../schema.sql'), 'utf-8');
  
  const requiredTables = [
    'users',
    'products',
    'orders',
    'order_items',
    'cart_items',
    'user_profiles',
    'user_addresses',
    'user_payment_methods',
    'feedback',
    'newsletter_subscribers'
  ];
  
  const requiredIndexes = {
    users: ['idx_users_email', 'idx_users_is_admin'],
    products: ['idx_products_category', 'idx_products_status', 'idx_products_featured'],
    orders: ['idx_orders_user_id', 'idx_orders_order_number', 'idx_orders_status', 'idx_orders_payment_status', 'idx_orders_created_at'],
    order_items: ['idx_order_items_order_id', 'idx_order_items_product_id'],
    cart_items: ['idx_cart_items_user_id', 'idx_cart_items_product_id'],
    user_profiles: ['idx_user_profiles_user_id'],
    user_addresses: ['idx_user_addresses_user_id', 'idx_user_addresses_is_default'],
    user_payment_methods: ['idx_user_payment_methods_user_id', 'idx_user_payment_methods_is_default'],
    feedback: ['idx_feedback_status', 'idx_feedback_created_at'],
    newsletter_subscribers: ['idx_newsletter_subscribers_email', 'idx_newsletter_subscribers_status']
  };

  it('should contain all required tables', () => {
    requiredTables.forEach(table => {
      const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`, 'i');
      expect(schemaSQL).toMatch(tableRegex);
    });
  });

  it('should create all required indexes', () => {
    Object.entries(requiredIndexes).forEach(([table, indexes]) => {
      indexes.forEach(index => {
        const indexRegex = new RegExp(`CREATE INDEX ${index}`, 'i');
        expect(schemaSQL).toMatch(indexRegex);
      });
    });
  });

  it('should define foreign key constraints', () => {
    const foreignKeyTables = [
      'orders',
      'order_items',
      'cart_items',
      'user_profiles',
      'user_addresses',
      'user_payment_methods'
    ];
    
    foreignKeyTables.forEach(table => {
      const fkRegex = new RegExp(`FOREIGN KEY.*REFERENCES`, 'i');
      const tableSection = schemaSQL.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?\\);`, 'i'));
      expect(tableSection).toBeTruthy();
      expect(tableSection![0]).toMatch(fkRegex);
    });
  });

  it('should use SQLite-compatible data types', () => {
    // Should not contain MySQL-specific types
    expect(schemaSQL).not.toMatch(/BIGINT/i);
    expect(schemaSQL).not.toMatch(/VARCHAR/i);
    expect(schemaSQL).not.toMatch(/DECIMAL/i);
    expect(schemaSQL).not.toMatch(/TIMESTAMP/i);
    expect(schemaSQL).not.toMatch(/TINYINT/i);
    
    // Should contain SQLite types
    expect(schemaSQL).toMatch(/INTEGER/i);
    expect(schemaSQL).toMatch(/TEXT/i);
    expect(schemaSQL).toMatch(/REAL/i);
  });

  it('should have AUTOINCREMENT on primary keys', () => {
    requiredTables.forEach(table => {
      const pkRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?id INTEGER PRIMARY KEY AUTOINCREMENT`, 'i');
      expect(schemaSQL).toMatch(pkRegex);
    });
  });

  it('should have default values for timestamps', () => {
    requiredTables.forEach(table => {
      const tableSection = schemaSQL.match(new RegExp(`CREATE TABLE IF NOT EXISTS ${table}[\\s\\S]*?\\);`, 'i'));
      expect(tableSection).toBeTruthy();
      expect(tableSection![0]).toMatch(/created_at TEXT NOT NULL DEFAULT \(datetime\('now'\)\)/i);
    });
  });

  it('should have unique constraints where needed', () => {
    // Users email should be unique
    const usersTable = schemaSQL.match(/CREATE TABLE IF NOT EXISTS users[\s\S]*?\);/i);
    expect(usersTable![0]).toMatch(/email TEXT NOT NULL UNIQUE/i);
    
    // Order number should be unique
    const ordersTable = schemaSQL.match(/CREATE TABLE IF NOT EXISTS orders[\s\S]*?\);/i);
    expect(ordersTable![0]).toMatch(/order_number TEXT NOT NULL UNIQUE/i);
    
    // Newsletter email should be unique
    const newsletterTable = schemaSQL.match(/CREATE TABLE IF NOT EXISTS newsletter_subscribers[\s\S]*?\);/i);
    expect(newsletterTable![0]).toMatch(/email TEXT NOT NULL UNIQUE/i);
  });

  // Property-based test: Table structure consistency
  it('property: all tables should follow consistent naming and structure patterns', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...requiredTables),
        (tableName) => {
          const tableRegex = new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}[\\s\\S]*?\\);`, 'i');
          const tableMatch = schemaSQL.match(tableRegex);
          
          if (!tableMatch) return false;
          
          const tableDefinition = tableMatch[0];
          
          // All tables should have id as primary key
          const hasIdPK = /id INTEGER PRIMARY KEY AUTOINCREMENT/i.test(tableDefinition);
          
          // All tables should have created_at
          const hasCreatedAt = /created_at TEXT NOT NULL DEFAULT \(datetime\('now'\)\)/i.test(tableDefinition);
          
          return hasIdPK && hasCreatedAt;
        }
      ),
      { numRuns: 100 }
    );
  });
});
