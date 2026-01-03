// ============================================
// Encryption Utility - AES-256 Encryption
// ============================================

import crypto from 'crypto';
import { logger } from './logger';

// Get encryption key from environment (must be 32 characters for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-please-change-this!';

// Ensure key is 32 bytes (256 bits) for AES-256
const KEY_BUFFER = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt a string using AES-256-CBC
 */
export function encrypt(text: string): string {
  try {
    if (!text || text.trim() === '') {
      return text; // Return empty strings as-is
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data separated by colon
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string encrypted with AES-256-CBC
 */
export function decrypt(encryptedText: string): string {
  try {
    if (!encryptedText || encryptedText.trim() === '') {
      return encryptedText; // Return empty strings as-is
    }

    // Split IV and encrypted data
    const parts = encryptedText.split(':');
    if (parts.length !== 2) {
      // If format is invalid, assume it's not encrypted (legacy data)
      return encryptedText;
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Decryption failed:', error);
    // Return original text if decryption fails (might be legacy unencrypted data)
    return encryptedText;
  }
}

/**
 * Check if a string appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text || text.trim() === '') {
    return false;
  }

  // Check if it has the expected format (IV:encrypted)
  const parts = text.split(':');
  if (parts.length !== 2) {
    return false;
  }

  // Check if IV is valid hex (32 characters = 16 bytes)
  const ivPart = parts[0];
  if (ivPart.length !== IV_LENGTH * 2) {
    return false;
  }

  // Check if IV is valid hex
  return /^[0-9a-f]+$/i.test(ivPart);
}

/**
 * Generate a random encryption key (32 characters for AES-256)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a password using bcrypt-like scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, originalHash] = hash.split(':');
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hashToVerify === originalHash;
}
