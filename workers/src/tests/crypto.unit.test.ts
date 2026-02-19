/**
 * Unit Tests for Cryptographic Functions
 * Feature: taiwan-payment-gateway
 * Validates: Requirements 3.3
 */

import { describe, test, expect } from 'vitest';
import { sha256, aesEncrypt, aesDecrypt } from '../utils/crypto';

describe('SHA256 Hash Function', () => {
  test('should produce correct hash for known input', async () => {
    const input = 'hello world';
    const hash = await sha256(input);
    
    // Known SHA256 hash of "hello world"
    expect(hash).toBe('b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9');
  });

  test('should handle empty string', async () => {
    const hash = await sha256('');
    
    // Known SHA256 hash of empty string
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('should handle special characters', async () => {
    const input = '特殊字符 & <script>alert("test")</script>';
    const hash = await sha256(input);
    
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('should handle unicode characters', async () => {
    const input = '測試訂單 🎉 emoji test';
    const hash = await sha256(input);
    
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test('should handle very long strings', async () => {
    const input = 'a'.repeat(10000);
    const hash = await sha256(input);
    
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('AES Encryption/Decryption', () => {
  const testKey = '1234567890123456'; // 16 bytes for AES-128, but we'll use it for AES-256
  const testIV = '1234567890123456'; // 16 bytes IV

  test('should encrypt and decrypt round-trip successfully', async () => {
    const plaintext = 'This is a test message';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should handle empty string encryption/decryption', async () => {
    const plaintext = '';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should handle special characters in encryption/decryption', async () => {
    const plaintext = '特殊字符 & <script>alert("xss")</script>';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should handle JSON data encryption/decryption', async () => {
    const jsonData = JSON.stringify({
      MerchantID: 'MS123456',
      Amt: 1000,
      ItemDesc: 'Test Order',
      Email: 'test@example.com',
    });
    
    const encrypted = await aesEncrypt(jsonData, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(jsonData);
    expect(JSON.parse(decrypted)).toEqual(JSON.parse(jsonData));
  });

  test('should handle unicode characters in encryption/decryption', async () => {
    const plaintext = '測試訂單 🎉 emoji test';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should produce base64 encoded output', async () => {
    const plaintext = 'test message';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    
    // Base64 should only contain valid characters
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  test('should produce different ciphertext for different plaintexts', async () => {
    const plaintext1 = 'message one';
    const plaintext2 = 'message two';
    
    const encrypted1 = await aesEncrypt(plaintext1, testKey, testIV);
    const encrypted2 = await aesEncrypt(plaintext2, testKey, testIV);
    
    expect(encrypted1).not.toBe(encrypted2);
  });

  test('should produce same ciphertext for same plaintext with same key and IV', async () => {
    const plaintext = 'consistent message';
    
    const encrypted1 = await aesEncrypt(plaintext, testKey, testIV);
    const encrypted2 = await aesEncrypt(plaintext, testKey, testIV);
    
    // With same IV, should produce same ciphertext (deterministic)
    expect(encrypted1).toBe(encrypted2);
  });

  test('should handle long text encryption/decryption', async () => {
    const plaintext = 'a'.repeat(1000);
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });

  test('should handle newlines and whitespace', async () => {
    const plaintext = 'Line 1\nLine 2\r\nLine 3\t\tTabbed';
    
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    const decrypted = await aesDecrypt(encrypted, testKey, testIV);
    
    expect(decrypted).toBe(plaintext);
  });
});

describe('Integration: SHA256 with AES', () => {
  test('should calculate signature of encrypted data', async () => {
    const testKey = '1234567890123456';
    const testIV = '1234567890123456';
    const plaintext = 'test data';
    
    // Encrypt
    const encrypted = await aesEncrypt(plaintext, testKey, testIV);
    
    // Calculate signature (like NewebPay does)
    const signatureString = `HashKey=${testKey}&${encrypted}&HashIV=${testIV}`;
    const signature = await sha256(signatureString);
    
    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    
    // Verify signature is consistent
    const signature2 = await sha256(signatureString);
    expect(signature).toBe(signature2);
  });
});
