/**
 * Authentication Service
 * Handles password hashing and JWT token management using Web Crypto API
 */

import { SignJWT, jwtVerify } from 'jose';
import type { User, JWTPayload } from '../types/env';

/**
 * Hash a password using PBKDF2 with Web Crypto API
 * Replaces bcrypt for Workers compatibility
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Verify a password against a hashed password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Decode stored hash
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0));
    
    // Extract salt and stored hash
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Derive key using same parameters
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const computedHash = new Uint8Array(derivedBits);
    
    // Compare hashes in constant time
    if (storedHash.length !== computedHash.length) {
      return false;
    }
    
    let diff = 0;
    for (let i = 0; i < storedHash.length; i++) {
      diff |= storedHash[i] ^ computedHash[i];
    }
    
    return diff === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Issue a JWT token for a user
 */
export async function issueToken(
  user: { id: number; email: string; is_admin: number },
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(secret);
  
  const token = await new SignJWT({
    sub: String(user.id),
    email: user.email,
    is_admin: user.is_admin
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload | null> {
  try {
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret);
    
    const { payload } = await jwtVerify(token, secretKey);
    
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      is_admin: payload.is_admin as number,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Extract user from JWT payload
 */
export function getUserFromPayload(payload: JWTPayload): User {
  return {
    id: parseInt(payload.sub),
    email: payload.email,
    is_admin: payload.is_admin
  };
}
