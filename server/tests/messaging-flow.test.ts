/**
 * Integration test for messaging flow with signature verification
 *
 * Tests the full flow: UI -> ConvexMessageBus -> Convex -> verifyAuth
 */
import { describe, test, expect, beforeAll } from "bun:test";
import { MessageBusClient, type AuthCredentials } from "../src/client";
import {
  generateKeyPair,
  encodeCESRKey,
  createAID,
} from "./crypto-utils";

const CONVEX_URL = process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.log("⚠️  CONVEX_URL not set - skipping integration tests");
  console.log("   Set CONVEX_URL to run these tests");
  process.exit(0);
}

describe("Messaging Flow Integration", () => {
  let client: MessageBusClient;
  let aliceKeys: { publicKey: Uint8Array; privateKey: Uint8Array };
  let aliceAid: string;
  let aliceCreds: AuthCredentials;
  let bobKeys: { publicKey: Uint8Array; privateKey: Uint8Array };
  let bobAid: string;
  let bobCreds: AuthCredentials;

  beforeAll(async () => {
    client = new MessageBusClient(CONVEX_URL!);

    // Setup Alice
    aliceKeys = await generateKeyPair();
    aliceAid = createAID(aliceKeys.publicKey);
    const aliceCesrKey = encodeCESRKey(aliceKeys.publicKey);

    // Setup Bob
    bobKeys = await generateKeyPair();
    bobAid = createAID(bobKeys.publicKey);
    const bobCesrKey = encodeCESRKey(bobKeys.publicKey);

    console.log("\n=== TEST SETUP ===");
    console.log("Alice AID:", aliceAid);
    console.log("Alice CESR Key:", aliceCesrKey);
    console.log("Bob AID:", bobAid);
    console.log("Bob CESR Key:", bobCesrKey);

    // Register both key states
    await client.registerKeyState(
      aliceAid,
      0,
      [aliceCesrKey],
      "1",
      "EAAA"
    );

    await client.registerKeyState(
      bobAid,
      0,
      [bobCesrKey],
      "1",
      "EBBB"
    );

    // Setup credentials
    aliceCreds = {
      aid: aliceAid,
      privateKey: aliceKeys.privateKey,
      ksn: 0,
    };

    bobCreds = {
      aid: bobAid,
      privateKey: bobKeys.privateKey,
      ksn: 0,
    };

    console.log("✓ Registered key states");
  });

  test("send message using MessageBusClient (like UI does)", async () => {
    console.log("\n=== TEST: Send Message ===");

    try {
      // Send message from Alice to Bob (using client that mimics backend test client)
      const messageId = await client.send(
        bobAid,
        "test-encrypted-message",
        aliceCreds,
        { ek: "", alg: "" }
      );

      console.log("✓ Message sent successfully");
      console.log("  Message ID:", messageId);
      expect(messageId).toBeDefined();
    } catch (error) {
      console.error("\n✗ Message send FAILED");
      console.error("  Error:", error);
      throw error;
    }
  });

  test("debug signature creation and verification", async () => {
    console.log("\n=== SIGNATURE DEBUG TEST ===");

    // Create a simple payload
    const payload = {
      nonce: "test-nonce",
      aid: aliceAid,
      purpose: "send",
      argsHash: "test-hash",
      aud: "merits-convex",
      ts: Date.now(),
    };

    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Sign it (using @noble/ed25519 like UI does)
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    console.log("\nCanonical:", canonical);

    const ed = await import("@noble/ed25519");
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const signature = await ed.signAsync(data, aliceKeys.privateKey);
    const sigBase64 = encodeBase64Url(signature);
    const indexedSig = `0-${sigBase64}`;

    console.log("\nSignature:", indexedSig.substring(0, 50) + "...");

    // Verify it manually (like server does)
    const aliceCesrKey = encodeCESRKey(aliceKeys.publicKey);
    const keyB64 = aliceCesrKey.slice(1); // Remove 'D' prefix
    const keyBytes = base64UrlToUint8Array(keyB64);

    const verifyKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const hyphenIndex = indexedSig.indexOf("-");
    const sigB64 = indexedSig.substring(hyphenIndex + 1);
    const sigBytes = base64UrlToUint8Array(sigB64);

    const valid = await crypto.subtle.verify(
      "Ed25519",
      verifyKey,
      sigBytes,
      data
    );

    console.log("\nManual verification:", valid ? "✓ VALID" : "✗ INVALID");
    expect(valid).toBe(true);
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
