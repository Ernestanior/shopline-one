/**
 * Cryptographic utility functions for payment gateway integration
 * Uses Web Crypto API for SHA256 hashing and AES-256-CBC encryption
 */

/**
 * Calculate SHA256 hash of a string
 * @param data - The string to hash
 * @returns Hexadecimal string representation of the hash
 */
export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Encrypt data using AES-256-CBC
 * Used for NewebPay TradeInfo encryption
 * @param data - The plaintext string to encrypt
 * @param key - The encryption key (HashKey)
 * @param iv - The initialization vector (HashIV)
 * @returns Base64-encoded encrypted string
 */
export async function aesEncrypt(data: string, key: string, iv: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Prepare key and IV
  const keyBuffer = encoder.encode(key);
  const ivBuffer = encoder.encode(iv);
  const dataBuffer = encoder.encode(data);
  
  // Import key for AES-CBC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBuffer },
    cryptoKey,
    dataBuffer
  );
  
  // Convert to base64
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const base64 = btoa(String.fromCharCode(...encryptedArray));
  
  return base64;
}

/**
 * Decrypt data using AES-256-CBC
 * Used for NewebPay TradeInfo decryption
 * @param encryptedData - Base64-encoded encrypted string
 * @param key - The decryption key (HashKey)
 * @param iv - The initialization vector (HashIV)
 * @returns Decrypted plaintext string
 */
export async function aesDecrypt(encryptedData: string, key: string, iv: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Prepare key and IV
  const keyBuffer = encoder.encode(key);
  const ivBuffer = encoder.encode(iv);
  
  // Decode base64
  const encryptedString = atob(encryptedData);
  const encryptedArray = new Uint8Array(encryptedString.length);
  for (let i = 0; i < encryptedString.length; i++) {
    encryptedArray[i] = encryptedString.charCodeAt(i);
  }
  
  // Import key for AES-CBC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-CBC', length: 256 },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBuffer },
    cryptoKey,
    encryptedArray
  );
  
  // Convert to string
  const decryptedText = decoder.decode(decryptedBuffer);
  
  return decryptedText;
}
