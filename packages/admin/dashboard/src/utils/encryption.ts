const SECRET_KEY_STRING = __ENCRYPTION_KEY__;

// Convert hex string to ArrayBuffer
function hexStringToArrayBuffer(hexString: string): ArrayBuffer {
  const bytes = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    bytes[i / 2] = parseInt(hexString.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to hex string
function arrayBufferToHexString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Import the key for Web Crypto API
let cryptoKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) {
    return cryptoKey;
  }

  const keyBuffer = hexStringToArrayBuffer(SECRET_KEY_STRING ?? "");

  cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);

  return cryptoKey;
}

// Helper function to check if a key should be excluded from encryption
function shouldExcludeKey(keyPath: string, excludeKeys: string[]): boolean {
  return excludeKeys.some(excludeKey => {
    // Support both simple key names and dot-notation paths
    return keyPath === excludeKey || keyPath.endsWith(`.${excludeKey}`);
  });
}

async function deriveIV(value: string): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", stringToArrayBuffer(value));
  return new Uint8Array(hashBuffer).slice(0, 12); // AES-GCM IV = 12 bytes
}

// Helper function to encrypt a single value
async function encryptValue(value: any, key: CryptoKey): Promise<string> {
  // Generate a random 96-bit IV
  // const iv = crypto.getRandomValues(new Uint8Array(12));
  const iv = await deriveIV(value);

  // Convert value to ArrayBuffer
  const data = stringToArrayBuffer(String(value));

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Format: IV (12 bytes = 24 hex chars) + Encrypted data (includes auth tag)
  return arrayBufferToHexString(iv.buffer) + arrayBufferToHexString(encrypted);
}

// Helper function to decrypt a single value
async function decryptValue(encryptedValue: string, key: CryptoKey): Promise<string> {
  // The IV is the first 24 hex characters (12 bytes)
  const iv = hexStringToArrayBuffer(encryptedValue.substring(0, 24));

  // The remaining characters are the encrypted data (includes auth tag)
  const encryptedData = hexStringToArrayBuffer(encryptedValue.substring(24));

  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );

  return arrayBufferToString(decrypted);
}

// Recursive function to process nested objects
async function processObjectRecursively(
  obj: any,
  excludeKeys: string[],
  keyPath: string,
  cryptoKey: CryptoKey,
  isEncryption: boolean
): Promise<any> {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return processArray(obj, excludeKeys, keyPath, cryptoKey, isEncryption);
  }

  if (typeof obj === "object") {
    return processObject(obj, excludeKeys, keyPath, cryptoKey, isEncryption);
  }

  return processPrimitive(obj, excludeKeys, keyPath, cryptoKey, isEncryption);
}

async function processArray(
  arr: any[],
  excludeKeys: string[],
  keyPath: string,
  cryptoKey: CryptoKey,
  isEncryption: boolean
): Promise<any[]> {
  return Promise.all(
    arr.map((item, index) =>
      processObjectRecursively(item, excludeKeys, `${keyPath}[${index}]`, cryptoKey, isEncryption)
    )
  );
}

async function processObject(
  obj: Record<string, any>,
  excludeKeys: string[],
  keyPath: string,
  cryptoKey: CryptoKey,
  isEncryption: boolean
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key;
    result[key] = await processValue(value, excludeKeys, currentPath, cryptoKey, isEncryption);
  }

  return result;
}

async function processValue(
  value: any,
  excludeKeys: string[],
  currentPath: string,
  cryptoKey: CryptoKey,
  isEncryption: boolean
): Promise<any> {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "object") {
    return processObjectRecursively(value, excludeKeys, currentPath, cryptoKey, isEncryption);
  }

  return processPrimitive(value, excludeKeys, currentPath, cryptoKey, isEncryption);
}

async function processPrimitive(
  value: any,
  excludeKeys: string[],
  keyPath: string,
  cryptoKey: CryptoKey,
  isEncryption: boolean
): Promise<any> {
  try {
    if (shouldExcludeKey(keyPath, excludeKeys)) {
      return value;
    }

    if (isEncryption) {
      return await encryptValue(value, cryptoKey);
    }

    if (typeof value === "string" && value.length > 24) {
      return await decryptValue(value, cryptoKey);
    }

    return value;
  } catch (error) {
    // Optional: log error
    // console.error(`Error processing value at path ${keyPath}:`, error);
    return value;
  }
}

/**
 * Encrypts the values of an object using AES-256-GCM, including nested objects.
 * @param obj The object to encrypt
 * @param excludeKeys Array of key names or paths to exclude from encryption
 * @returns A new object with encrypted values
 */
export async function encryptObject(
  obj: Record<string, any>,
  excludeKeys: string[] = []
): Promise<Record<string, any>> {
  const key = await getCryptoKey();

  return await processObjectRecursively(obj, excludeKeys, "", key, true);
}

/**
 * Decrypts the values of an object using AES-256-GCM, including nested objects.
 * @param obj The object with encrypted values
 * @param excludeKeys Array of key names or paths that were excluded from encryption
 * @returns A new object with decrypted values
 */
export async function decryptObject(
  obj: Record<string, any>,
  excludeKeys: string[] = []
): Promise<Record<string, any>> {
  const key = await getCryptoKey();
  return await processObjectRecursively(obj, excludeKeys, "", key, false);
}

// Synchronous wrapper functions for backward compatibility
// Note: These will return Promises, so you'll need to update your usage

/**
 * @deprecated Use encryptObject directly. This is for backward compatibility only.
 */
export function encryptObjectSync(
  obj: Record<string, any>,
  excludeKeys: string[] = []
): Promise<Record<string, any>> {
  console.warn("encryptObjectSync is deprecated. Use encryptObject which returns a Promise.");
  return encryptObject(obj, excludeKeys);
}

/**
 * @deprecated Use decryptObject directly. This is for backward compatibility only.
 */
export function decryptObjectSync(
  obj: Record<string, any>,
  excludeKeys: string[] = []
): Promise<Record<string, any>> {
  console.warn("decryptObjectSync is deprecated. Use decryptObject which returns a Promise.");
  return decryptObject(obj, excludeKeys);
}
