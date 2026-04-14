/**
 * Secure hashing utilities using the Web Crypto API (supported in Cloudflare Workers)
 */

const iterations = 100000;
const hashAlgorithm = 'SHA-256';

/**
 * Hash a password using PBKDF2
 * @param password The plain text password
 * @param salt Optional salt (if not provided, a new one will be generated)
 * @returns {hash: string, salt: string} base64 encoded hash and salt
 */
export async function hashPassword(password: string, saltStr?: string): Promise<{ hash: string, salt: string }> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  let salt: Uint8Array;
  if (saltStr) {
    salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
  }

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: hashAlgorithm
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const hashArray = Array.from(new Uint8Array(exportedKey));
  const hashBase64 = btoa(String.fromCharCode.apply(null, hashArray as any));
  const saltBase64 = btoa(String.fromCharCode.apply(null, Array.from(salt) as any));

  return { hash: hashBase64, salt: saltBase64 };
}

/**
 * Verify a password against a stored hash and salt
 */
export async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt);
  return hash === storedHash;
}
