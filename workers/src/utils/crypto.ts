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
 * Add PKCS7 padding to data
 * @param data - The data to pad
 * @param blockSize - Block size in bytes (default 32 for AES-256)
 * @returns Padded data
 */
function addPadding(data: Uint8Array, blockSize: number = 32): Uint8Array {
  const len = data.length;
  const pad = blockSize - (len % blockSize);
  const paddedData = new Uint8Array(len + pad);
  paddedData.set(data);
  // Fill padding bytes with the padding value
  for (let i = len; i < len + pad; i++) {
    paddedData[i] = pad;
  }
  return paddedData;
}

/**
 * Remove PKCS7 padding from data
 * @param data - The padded data
 * @returns Unpadded data
 */
function removePadding(data: Uint8Array): Uint8Array {
  const pad = data[data.length - 1];
  return data.slice(0, data.length - pad);
}

/**
 * Encrypt data using AES-256-CBC (NewebPay format)
 * Used for NewebPay TradeInfo encryption
 * @param data - The plaintext string to encrypt
 * @param key - The encryption key (HashKey)
 * @param iv - The initialization vector (HashIV)
 * @returns Hex-encoded encrypted string
 */
export async function aesEncrypt(data: string, key: string, iv: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Prepare key and IV
  const keyBuffer = encoder.encode(key);
  const ivBuffer = encoder.encode(iv);
  const dataBuffer = encoder.encode(data);
  
  // Add PKCS7 padding
  const paddedData = addPadding(dataBuffer, 32);
  
  // Import key for AES-CBC
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-CBC', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt with OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING equivalent
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBuffer },
    cryptoKey,
    paddedData
  );
  
  // Convert to hex (not base64!)
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const hexString = Array.from(encryptedArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return hexString;
}

/**
 * Decrypt data using AES-256-CBC (NewebPay format)
 * Used for NewebPay TradeInfo decryption
 * @param encryptedData - Hex-encoded encrypted string
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
  
  // Decode hex to bytes
  const encryptedArray = new Uint8Array(encryptedData.length / 2);
  for (let i = 0; i < encryptedData.length; i += 2) {
    encryptedArray[i / 2] = parseInt(encryptedData.substr(i, 2), 16);
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
  
  // Remove PKCS7 padding
  const decryptedArray = new Uint8Array(decryptedBuffer);
  const unpaddedData = removePadding(decryptedArray);
  
  // Convert to string
  const decryptedText = decoder.decode(unpaddedData);
  
  return decryptedText;
}
