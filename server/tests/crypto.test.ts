import { describe, test, expect } from "bun:test";
import {
  generateKeyPair,
  sign,
  encodeCESRKey,
  createAID,
  createIndexedSignature,
  uint8ArrayToBase64Url,
  base64UrlToUint8Array,
  computeArgsHash,
} from "./crypto-utils";

describe("Crypto Utilities", () => {
  test("should generate valid Ed25519 keypair", async () => {
    const keypair = await generateKeyPair();

    expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
    expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
    expect(keypair.publicKey.length).toBe(32);
    expect(keypair.privateKey.length).toBe(32);
  });

  test("should sign data with Ed25519 private key", async () => {
    const keypair = await generateKeyPair();
    const data = new TextEncoder().encode("test message");

    const signature = await sign(data, keypair.privateKey);

    expect(signature).toBeInstanceOf(Uint8Array);
    expect(signature.length).toBe(64); // Ed25519 signatures are 64 bytes
  });

  test("should encode public key in CESR format", () => {
    const publicKey = new Uint8Array(32).fill(0xab);
    const cesr = encodeCESRKey(publicKey);

    expect(cesr).toStartWith("D");
    expect(cesr.length).toBeGreaterThan(1);
  });

  test("should create AID from public key", () => {
    const publicKey = new Uint8Array(32).fill(0xcd);
    const aid = createAID(publicKey);

    expect(aid).toStartWith("E");
    expect(aid.length).toBeGreaterThan(1);
  });

  test("should create indexed signature", () => {
    const signature = new Uint8Array(64).fill(0x42);
    const indexed = createIndexedSignature(0, signature);

    expect(indexed).toStartWith("0-");
    expect(indexed).toContain("-");
  });

  test("should base64url encode and decode round-trip", () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 255, 0, 128]);
    const encoded = uint8ArrayToBase64Url(original);
    const decoded = base64UrlToUint8Array(encoded);

    expect(decoded).toEqual(original);
  });

  test("base64url should not contain +, /, or =", () => {
    const data = new Uint8Array(32).fill(0xff);
    const encoded = uint8ArrayToBase64Url(data);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  test("should compute consistent args hash", async () => {
    const args1 = { foo: "bar", baz: 123 };
    const args2 = { baz: 123, foo: "bar" }; // Different order

    const hash1 = await computeArgsHash(args1);
    const hash2 = await computeArgsHash(args2);

    // Should be the same because JSON.stringify sorts keys
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBeGreaterThan(0);
  });

  test("should compute different hashes for different args", async () => {
    const args1 = { foo: "bar" };
    const args2 = { foo: "baz" };

    const hash1 = await computeArgsHash(args1);
    const hash2 = await computeArgsHash(args2);

    expect(hash1).not.toBe(hash2);
  });

  test("should verify signature with matching keypair", async () => {
    const keypair = await generateKeyPair();
    const message = new TextEncoder().encode("Hello, KERI!");

    const signature = await sign(message, keypair.privateKey);

    // Verify using Web Crypto API
    const key = await crypto.subtle.importKey(
      "raw",
      keypair.publicKey,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify("Ed25519", key, signature, message);
    expect(valid).toBe(true);
  });

  test("should reject signature with wrong keypair", async () => {
    const keypair1 = await generateKeyPair();
    const keypair2 = await generateKeyPair();
    const message = new TextEncoder().encode("Hello, KERI!");

    // Sign with keypair1
    const signature = await sign(message, keypair1.privateKey);

    // Try to verify with keypair2's public key
    const key = await crypto.subtle.importKey(
      "raw",
      keypair2.publicKey,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify("Ed25519", key, signature, message);
    expect(valid).toBe(false);
  });

  test("indexed signature format should be parseable", () => {
    const signature = new Uint8Array(64).fill(0x42);
    const indexed = createIndexedSignature(5, signature);

    const hyphenIndex = indexed.indexOf("-");
    const idxStr = indexed.substring(0, hyphenIndex);
    const sigPart = indexed.substring(hyphenIndex + 1);

    expect(parseInt(idxStr)).toBe(5);
    expect(sigPart.length).toBeGreaterThan(0);
  });

  test("should handle CESR key decoding", () => {
    const publicKey = new Uint8Array(32).fill(0x11);
    const cesr = encodeCESRKey(publicKey);

    // CESR format is 'D' + base64url(publicKey)
    expect(cesr[0]).toBe("D");

    // Extract and decode
    const b64 = cesr.slice(1);
    const decoded = base64UrlToUint8Array(b64);

    expect(decoded).toEqual(publicKey);
  });
});
