/**
 * Crypto utilities for testing KERI authentication
 */

/**
 * Generate Ed25519 keypair using Web Crypto API
 */
export async function generateKeyPair(): Promise<{
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}> {
  const keypair = await crypto.subtle.generateKey(
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    },
    true,
    ["sign", "verify"]
  );

  const publicKeyRaw = await crypto.subtle.exportKey("raw", keypair.publicKey);
  const privateKeyRaw = await crypto.subtle.exportKey("pkcs8", keypair.privateKey);

  // Extract raw 32-byte private key from PKCS8 format (last 32 bytes)
  const privateKeyBytes = new Uint8Array(privateKeyRaw);
  const rawPrivateKey = privateKeyBytes.slice(-32);

  return {
    publicKey: new Uint8Array(publicKeyRaw),
    privateKey: rawPrivateKey,
  };
}

/**
 * Sign data with Ed25519 private key
 */
export async function sign(
  data: Uint8Array,
  privateKey: Uint8Array
): Promise<Uint8Array> {
  // Import private key - need to reconstruct PKCS8 format
  const pkcs8 = reconstructPKCS8(privateKey);

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("Ed25519", key, data);
  return new Uint8Array(signature);
}

/**
 * Reconstruct PKCS8 format from raw 32-byte Ed25519 private key
 */
function reconstructPKCS8(rawPrivateKey: Uint8Array): Uint8Array {
  // PKCS8 Ed25519 structure (48 bytes total)
  // This is a simplified version - in production use a proper ASN.1 encoder
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, // SEQUENCE (46 bytes)
    0x02, 0x01, 0x00, // INTEGER (version = 0)
    0x30, 0x05, // SEQUENCE (5 bytes) - algorithm
    0x06, 0x03, 0x2b, 0x65, 0x70, // OID for Ed25519
    0x04, 0x22, // OCTET STRING (34 bytes)
    0x04, 0x20, // OCTET STRING (32 bytes) - the actual key
  ]);

  const result = new Uint8Array(pkcs8Header.length + rawPrivateKey.length);
  result.set(pkcs8Header, 0);
  result.set(rawPrivateKey, pkcs8Header.length);
  return result;
}

/**
 * Encode public key in CESR format (simplified)
 */
export function encodeCESRKey(publicKey: Uint8Array): string {
  // CESR Ed25519 public key: 'D' prefix + base64url
  const b64 = uint8ArrayToBase64Url(publicKey);
  return `D${b64}`;
}

/**
 * Create AID from public key (simplified - just use base64url of key)
 */
export function createAID(publicKey: Uint8Array): string {
  return `E${uint8ArrayToBase64Url(publicKey)}`;
}

/**
 * Base64url encoding
 */
export function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Base64url decoding
 */
export function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = base64 + padding;
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create indexed signature (format: "idx-signature_base64url")
 */
export function createIndexedSignature(
  idx: number,
  signature: Uint8Array
): string {
  return `${idx}-${uint8ArrayToBase64Url(signature)}`;
}

/**
 * Compute SHA256 hash
 */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hashBuffer);
}

/**
 * Compute args hash for authentication
 */
export async function computeArgsHash(args: Record<string, any>): Promise<string> {
  const canonical = JSON.stringify(args, Object.keys(args).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hash = await sha256(data);
  return uint8ArrayToBase64Url(hash);
}
