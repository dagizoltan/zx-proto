import { Result, Errors } from '../types.js';

const ALGO_AES = 'AES-GCM';
const ALGO_SHA = 'SHA-256';

/**
 * Low-level Crypto Utilities using Web Crypto API
 */
export const CryptoUtils = {

  /**
   * Import a raw key string (base64) or buffer into a CryptoKey
   */
  importKey: async (rawKey, usage = ['encrypt', 'decrypt']) => {
    try {
      const keyBuffer = typeof rawKey === 'string'
        ? Uint8Array.from(atob(rawKey), c => c.charCodeAt(0))
        : rawKey;

      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: ALGO_AES },
        true, // extractable
        usage
      );
    } catch (e) {
      throw new Error(`ImportKey Failed: ${e.message}`);
    }
  },

  /**
   * Generate a random AES-256 key
   */
  generateKey: async () => {
    return await crypto.subtle.generateKey(
      { name: ALGO_AES, length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  },

  /**
   * Export CryptoKey to Base64 String
   */
  exportKey: async (key) => {
    const exported = await crypto.subtle.exportKey('raw', key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
  },

  /**
   * Encrypt data (String or Object)
   * Returns { iv, ciphertext } (Base64)
   */
  encrypt: async (key, data) => {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
      const encodedData = new TextEncoder().encode(
        typeof data === 'string' ? data : JSON.stringify(data)
      );

      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: ALGO_AES, iv },
        key,
        encodedData
      );

      return Result.ok({
        iv: btoa(String.fromCharCode(...iv)),
        ciphertext: btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)))
      });
    } catch (e) {
      return Result.fail(Errors.Encryption(e.message));
    }
  },

  /**
   * Decrypt data
   */
  decrypt: async (key, { iv, ciphertext }) => {
    try {
      const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
      const dataBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: ALGO_AES, iv: ivBuffer },
        key,
        dataBuffer
      );

      const decoded = new TextDecoder().decode(decryptedBuffer);
      try {
        return Result.ok(JSON.parse(decoded));
      } catch {
        return Result.ok(decoded);
      }
    } catch (e) {
      return Result.fail(Errors.Encryption(e.message));
    }
  },

  /**
   * SHA-256 Hash
   */
  hash: async (data) => {
    const msgBuffer = new TextEncoder().encode(
      typeof data === 'string' ? data : JSON.stringify(data)
    );
    const hashBuffer = await crypto.subtle.digest(ALGO_SHA, msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return Result.ok(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
  }
};
