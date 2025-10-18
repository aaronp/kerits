/**
 * Auth Integration Test - Using High-Level APIs
 *
 * This test demonstrates the proper flow using high-level abstractions:
 * 1. Create accounts using Account DSL
 * 2. Send messages using MessageBus API
 *
 * This is exactly how the UI should work - using DSLs and APIs, not low-level primitives.
 */

import libsodium from "libsodium-wrappers-sumo";

// Initialize libsodium FIRST (required for cesr-ts)
await libsodium.ready;

// Now import everything else after libsodium is ready
import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createKeritsDSL } from "../../src/app/dsl";
import { createKerStore } from "../../src/storage/core";
import { MemoryKv } from "../../src/storage/adapters/memory";
import { ConvexMessageBusFactory } from "../../ui/src/merits/lib/message-bus";
import type { MessageBus } from "../../ui/src/merits/lib/message-bus/types";
import { ConvexClient } from "convex/browser";

const CONVEX_URL =
  process.env.VITE_CONVEX_URL || "https://accurate-penguin-901.convex.cloud";

/**
 * Helper to register key state with Convex
 */
async function registerKeyState(
  client: ConvexClient,
  dsl: ReturnType<typeof createKeritsDSL>,
  alias: string,
  aid: string
) {
  const accountDsl = await dsl.account(alias);
  if (!accountDsl) throw new Error(`Account ${alias} not found`);

  const kelEvents = await accountDsl.getKel();
  if (kelEvents.length === 0) throw new Error("No KEL events found");

  const latestEvent = kelEvents[kelEvents.length - 1];
  const ked = latestEvent.meta?.ked || latestEvent;

  const keys = ked.k || ked.keys || [];
  const threshold = ked.kt || ked.threshold || "1";
  const lastEvtSaid = ked.d || latestEvent.meta?.d || "";
  const ksn = kelEvents.length - 1;

  // @ts-ignore - Using Convex without generated types
  await client.mutation("auth:registerKeyState", {
    aid,
    ksn,
    keys,
    threshold,
    lastEvtSaid,
  });

  console.log(`✓ Key state registered for ${alias} (${aid})`);
}

describe("Auth Integration - High-Level APIs", () => {
  let aliceMessageBus: MessageBus;
  let bobMessageBus: MessageBus;
  let aliceAid: string;
  let bobAid: string;

  beforeAll(async () => {
    console.log("\n=== Creating Accounts ===");

    // Create KERITS store and DSL
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create Alice's account
    const aliceSeed = new Uint8Array(32).fill(1); // Deterministic seed for testing
    const aliceMnemonic = dsl.newMnemonic(aliceSeed);
    const aliceAccount = await dsl.newAccount("alice", aliceMnemonic);
    aliceAid = aliceAccount.aid;
    console.log("✓ Alice account created:", aliceAid);

    // Create Bob's account
    const bobSeed = new Uint8Array(32).fill(2); // Different seed
    const bobMnemonic = dsl.newMnemonic(bobSeed);
    const bobAccount = await dsl.newAccount("bob", bobMnemonic);
    bobAid = bobAccount.aid;
    console.log("✓ Bob account created:", bobAid);

    console.log("\n=== Registering Key States with Convex ===");

    // Create shared Convex client for key state registration
    const client = new ConvexClient(CONVEX_URL);

    // Register Alice's key state
    await registerKeyState(client, dsl, "alice", aliceAid);

    // Register Bob's key state
    await registerKeyState(client, dsl, "bob", bobAid);

    console.log("\n=== Setting up MessageBus ===");

    // Get Alice's DSL and extract signer
    const aliceDsl = await dsl.account("alice");
    if (!aliceDsl) throw new Error("Alice account not found");

    // Unlock Alice's account to get signer
    await dsl.keyManager.unlock(aliceAid, aliceMnemonic);
    const aliceSigner = dsl.keyManager.getSigner(aliceAid);
    if (!aliceSigner) throw new Error("Alice signer not found");

    // Get Alice's KEL to get ksn
    const aliceKel = await aliceDsl.getKel();
    const aliceKsn = aliceKel.length - 1;

    // Connect Alice's MessageBus
    aliceMessageBus = await ConvexMessageBusFactory.connect({
      userAid: aliceAid,
      signer: aliceSigner,
      ksn: aliceKsn,
      backendConfig: { convexUrl: CONVEX_URL },
    });
    console.log("✓ Alice MessageBus connected");

    // Get Bob's DSL and extract signer
    const bobDsl = await dsl.account("bob");
    if (!bobDsl) throw new Error("Bob account not found");

    // Unlock Bob's account to get signer
    await dsl.keyManager.unlock(bobAid, bobMnemonic);
    const bobSigner = dsl.keyManager.getSigner(bobAid);
    if (!bobSigner) throw new Error("Bob signer not found");

    // Get Bob's KEL to get ksn
    const bobKel = await bobDsl.getKel();
    const bobKsn = bobKel.length - 1;

    // Connect Bob's MessageBus
    bobMessageBus = await ConvexMessageBusFactory.connect({
      userAid: bobAid,
      signer: bobSigner,
      ksn: bobKsn,
      backendConfig: { convexUrl: CONVEX_URL },
    });
    console.log("✓ Bob MessageBus connected");

    // Close the setup client (each MessageBus has its own)
    client.close();
  });

  afterAll(() => {
    aliceMessageBus?.disconnect();
    bobMessageBus?.disconnect();
  });

  test("Full send/receive flow: Alice → Bob", async () => {
    console.log("\n=== Full Send/Receive Flow Test ===");

    // Step 1: Alice sends encrypted message to Bob
    console.log("\n[Step 1] Alice sending message to Bob...");
    const uniqueContent = `test-message-${Date.now()}-${Math.random()}`;
    const messageId = await aliceMessageBus.sendMessage({
      recipientAid: bobAid,
      ciphertext: uniqueContent,
      ttl: 86400000, // 24 hours
    });

    console.log("✓ Message sent successfully!");
    console.log("  Message ID:", messageId);
    console.log("  Content:", uniqueContent);

    expect(messageId).toBeDefined();
    expect(typeof messageId).toBe("string");

    // Step 2: Bob polls for messages
    console.log("\n[Step 2] Bob receiving messages...");
    const messages = await bobMessageBus.receiveMessages();

    console.log("✓ Bob received", messages.length, "message(s)");

    expect(messages.length).toBeGreaterThan(0);

    // Step 3: Verify Bob received Alice's specific message
    console.log("\n[Step 3] Verifying message delivery...");
    const aliceMessage = messages.find((m) => m.id === messageId);

    expect(aliceMessage).toBeDefined();
    expect(aliceMessage?.senderAid).toBe(aliceAid);
    expect(aliceMessage?.ciphertext).toBe(uniqueContent);

    console.log("✓ Message verified:");
    console.log("  From:", aliceMessage?.senderAid);
    console.log("  Content matches:", aliceMessage?.ciphertext === uniqueContent);
    console.log("  Message ID:", aliceMessage?.id);

    // Step 4: Verify message metadata
    console.log("\n[Step 4] Verifying message metadata...");
    expect(aliceMessage?.senderKsn).toBe(0); // Alice's key sequence number
    expect(aliceMessage?.senderSig).toBeDefined(); // Non-repudiation signature
    expect(aliceMessage?.envelopeHash).toBeDefined(); // Message integrity

    console.log("✓ Message metadata verified:");
    console.log("  Sender KSN:", aliceMessage?.senderKsn);
    console.log("  Has sender signature:", !!aliceMessage?.senderSig);
    console.log("  Has envelope hash:", !!aliceMessage?.envelopeHash);

    console.log("\n✅ Full send/receive flow completed successfully!");
  });
});
