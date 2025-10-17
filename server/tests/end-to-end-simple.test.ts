/**
 * Simple end-to-end test to verify signature flow without Convex
 */
import { describe, test, expect } from "bun:test";
import {
  generateKeyPair,
  encodeCESRKey,
  createAID,
  uint8ArrayToBase64Url,
  base64UrlToUint8Array,
} from "./crypto-utils";

describe("End-to-End Signature Flow (No Server)", () => {
  test("full authentication flow simulation", async () => {
    // 1. Setup - Alice generates keys
    const aliceKeys = await generateKeyPair();
    const aliceAid = createAID(aliceKeys.publicKey);
    const aliceCesrKey = encodeCESRKey(aliceKeys.publicKey);

    console.log("\n=== SETUP ===");
    console.log("Alice AID:", aliceAid);
    console.log("Alice CESR Key:", aliceCesrKey);

    // 2. Register key state (simulated)
    const keyState = {
      aid: aliceAid,
      ksn: 0,
      keys: [aliceCesrKey],
      threshold: "1",
      lastEvtSaid: "EAAA",
      updatedAt: Date.now(),
    };

    // 3. Compute args hash (simulated)
    const args = {
      recipientDid: "recipient-aid",
      ciphertext: "encrypted-message",
      ttl: 24 * 60 * 60 * 1000,
    };
    const argsHash = await computeArgsHash(args);

    console.log("\n=== ARGS ===");
    console.log("Args:", JSON.stringify(args));
    console.log("Args hash:", argsHash);

    // 4. Issue challenge (simulated)
    const challenge = {
      nonce: crypto.randomUUID(),
      aid: aliceAid,
      purpose: "send",
      argsHash,
      createdAt: Date.now(),
      expiresAt: Date.now() + 120000,
      used: false,
    };

    const challengePayload = {
      nonce: challenge.nonce,
      aid: challenge.aid,
      purpose: challenge.purpose,
      argsHash: challenge.argsHash,
      aud: "merits-convex",
      ts: challenge.createdAt,
    };

    console.log("\n=== CHALLENGE ===");
    console.log("Challenge payload:", JSON.stringify(challengePayload, null, 2));

    // 5. Client signs (using client logic)
    const canonical = JSON.stringify(
      challengePayload,
      Object.keys(challengePayload).sort()
    );
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    console.log("\n=== CLIENT SIGNING ===");
    console.log("Canonical:", canonical);

    // Sign using client's reconstructPKCS8
    const pkcs8 = reconstructPKCS8(aliceKeys.privateKey);
    const key = await crypto.subtle.importKey(
      "pkcs8",
      pkcs8,
      { name: "Ed25519" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign("Ed25519", key, data);
    const signature = new Uint8Array(signatureBuffer);
    const sigBase64 = uint8ArrayToBase64Url(signature);
    const indexedSig = `0-${sigBase64}`;

    console.log("Indexed signature:", indexedSig);

    // 6. Server verifies (using server logic)
    console.log("\n=== SERVER VERIFICATION ===");

    // Reconstruct payload
    const reconstructedPayload = {
      nonce: challenge.nonce,
      aid: challenge.aid,
      purpose: challenge.purpose,
      argsHash: challenge.argsHash,
      aud: "merits-convex",
      ts: challenge.createdAt,
    };

    const reconstructedCanonical = JSON.stringify(
      reconstructedPayload,
      Object.keys(reconstructedPayload).sort()
    );
    const reconstructedData = encoder.encode(reconstructedCanonical);

    console.log("Reconstructed canonical:", reconstructedCanonical);
    console.log("Canonical match:", canonical === reconstructedCanonical);

    // Parse signature
    const hyphenIndex = indexedSig.indexOf("-");
    const idx = parseInt(indexedSig.substring(0, hyphenIndex));
    const sigB64 = indexedSig.substring(hyphenIndex + 1);

    console.log("Signature index:", idx);
    console.log("Signature B64:", sigB64.substring(0, 20) + "...");

    // Decode signature
    const sigBytes = base64UrlToUint8Array(sigB64);
    console.log("Signature bytes length:", sigBytes.length);

    // Decode CESR key
    const cesrKey = keyState.keys[idx];
    const keyB64 = cesrKey.slice(1); // Remove 'D' prefix
    const keyBytes = base64UrlToUint8Array(keyB64);
    console.log("Key bytes length:", keyBytes.length);

    // Verify
    const verifyKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "Ed25519",
      verifyKey,
      sigBytes,
      reconstructedData
    );

    console.log("\n=== RESULT ===");
    console.log("Signature valid:", valid);

    expect(valid).toBe(true);
  });
});

function reconstructPKCS8(rawPrivateKey: Uint8Array): Uint8Array {
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04,
    0x22, 0x04, 0x20,
  ]);
  const result = new Uint8Array(pkcs8Header.length + rawPrivateKey.length);
  result.set(pkcs8Header, 0);
  result.set(rawPrivateKey, pkcs8Header.length);
  return result;
}

async function computeArgsHash(args: Record<string, any>): Promise<string> {
  const canonical = JSON.stringify(args, Object.keys(args).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
