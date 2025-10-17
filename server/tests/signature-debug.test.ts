import { describe, test, expect } from "bun:test";
import {
  generateKeyPair,
  encodeCESRKey,
  createAID,
  sign,
  createIndexedSignature,
  uint8ArrayToBase64Url,
} from "./crypto-utils";

/**
 * Debug signature verification to understand the issue
 */
describe("Signature Verification Debug", () => {
  test("should verify Ed25519 signature with Web Crypto API", async () => {
    const keypair = await generateKeyPair();
    const message = "test message";
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // Sign
    const signature = await sign(data, keypair.privateKey);

    // Verify
    const key = await crypto.subtle.importKey(
      "raw",
      keypair.publicKey,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify("Ed25519", key, signature, data);
    expect(valid).toBe(true);
  });

  test("should create and verify indexed signature", async () => {
    const keypair = await generateKeyPair();
    const payload = {
      nonce: "test-nonce",
      aid: "test-aid",
      purpose: "send",
      argsHash: "test-hash",
      aud: "test-aud",
      ts: 1234567890,
    };

    // Canonicalize payload
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    // Sign
    const signature = await sign(data, keypair.privateKey);
    const indexed = createIndexedSignature(0, signature);

    console.log("Indexed signature:", indexed);
    console.log("Canonical payload:", canonical);

    // Parse indexed signature
    const hyphenIndex = indexed.indexOf("-");
    const idx = parseInt(indexed.substring(0, hyphenIndex));
    const sigB64 = indexed.substring(hyphenIndex + 1);

    expect(idx).toBe(0);
    expect(sigB64.length).toBeGreaterThan(0);

    // Verify signature
    const key = await crypto.subtle.importKey(
      "raw",
      keypair.publicKey,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    // Decode signature from base64url
    const sigBytes = base64UrlToUint8Array(sigB64);
    const valid = await crypto.subtle.verify("Ed25519", key, sigBytes, data);

    expect(valid).toBe(true);
  });

  test("should match CESR key encoding/decoding", async () => {
    const keypair = await generateKeyPair();
    const cesrKey = encodeCESRKey(keypair.publicKey);

    console.log("Public key length:", keypair.publicKey.length);
    console.log("CESR key:", cesrKey);
    console.log("CESR key format:", cesrKey[0], "prefix, length:", cesrKey.length);

    // Decode CESR key
    const b64 = cesrKey.slice(1);
    const decoded = base64UrlToUint8Array(b64);

    expect(decoded).toEqual(keypair.publicKey);
  });

  test("should demonstrate full challenge/response flow", async () => {
    const keypair = await generateKeyPair();
    const aid = createAID(keypair.publicKey);
    const cesrKey = encodeCESRKey(keypair.publicKey);

    // 1. Challenge payload (what server creates)
    const challengePayload = {
      nonce: crypto.randomUUID(),
      aid: aid,
      purpose: "send",
      argsHash: uint8ArrayToBase64Url(new Uint8Array(32).fill(0x42)),
      aud: "merits-convex",
      ts: Date.now(),
    };

    console.log("\n=== Challenge Payload ===");
    console.log(JSON.stringify(challengePayload, null, 2));

    // 2. Client signs payload
    const canonical = JSON.stringify(
      challengePayload,
      Object.keys(challengePayload).sort()
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    console.log("\n=== Canonical Payload ===");
    console.log(canonical);

    const signature = await sign(data, keypair.privateKey);
    const indexed = createIndexedSignature(0, signature);

    console.log("\n=== Signature ===");
    console.log("Indexed:", indexed);

    // 3. Server verifies
    // Reconstruct payload (must match exactly)
    const reconstructed = {
      nonce: challengePayload.nonce,
      aid: challengePayload.aid,
      purpose: challengePayload.purpose,
      argsHash: challengePayload.argsHash,
      aud: challengePayload.aud,
      ts: challengePayload.ts,
    };

    const reconstructedCanonical = JSON.stringify(
      reconstructed,
      Object.keys(reconstructed).sort()
    );
    const reconstructedData = encoder.encode(reconstructedCanonical);

    console.log("\n=== Reconstructed Canonical ===");
    console.log(reconstructedCanonical);
    console.log("Match:", canonical === reconstructedCanonical);

    // Parse indexed signature
    const hyphenIndex = indexed.indexOf("-");
    const sigB64 = indexed.substring(hyphenIndex + 1);
    const sigBytes = base64UrlToUint8Array(sigB64);

    // Decode CESR key
    const keyBytes = base64UrlToUint8Array(cesrKey.slice(1));

    // Import and verify
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "Ed25519",
      key,
      sigBytes,
      reconstructedData
    );

    console.log("\n=== Verification Result ===");
    console.log("Valid:", valid);

    expect(valid).toBe(true);
  });
});

function base64UrlToUint8Array(base64url: string): Uint8Array {
  base64url = base64url.trim();
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4)) % 4;
  if (padding > 0) {
    base64 += "=".repeat(padding);
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
