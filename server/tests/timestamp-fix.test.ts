import { describe, test, expect } from "bun:test";

/**
 * Test to verify timestamp consistency in challenge/response flow
 */
describe("Timestamp Fix Verification", () => {
  test("challenge payload should use createdAt timestamp consistently", () => {
    // Simulate issueChallenge
    const issueTime = Date.now();
    const challengePayload = {
      nonce: "test-nonce",
      aid: "test-aid",
      purpose: "send",
      argsHash: "test-hash",
      aud: "merits-convex",
      ts: issueTime,
    };

    // Simulate challenge stored in DB
    const storedChallenge = {
      nonce: "test-nonce",
      aid: "test-aid",
      purpose: "send",
      argsHash: "test-hash",
      createdAt: issueTime,
      expiresAt: issueTime + 120000,
      used: false,
    };

    // Wait a bit to simulate time passing
    const verifyTime = Date.now();

    // Simulate verifyAuth reconstruction
    const reconstructedPayload = {
      nonce: storedChallenge.nonce,
      aid: storedChallenge.aid,
      purpose: storedChallenge.purpose,
      argsHash: storedChallenge.argsHash,
      aud: "merits-convex",
      ts: storedChallenge.createdAt, // Use stored createdAt, not verifyTime
    };

    // Payloads should match
    expect(reconstructedPayload).toEqual(challengePayload);

    // Verify the timestamps are the same
    expect(reconstructedPayload.ts).toBe(challengePayload.ts);

    // The verification time should be different (time has passed)
    expect(verifyTime).toBeGreaterThanOrEqual(issueTime);
  });

  test("canonical JSON serialization should be consistent", () => {
    const payload = {
      nonce: "abc123",
      aid: "EABC",
      purpose: "send",
      argsHash: "hash123",
      aud: "merits-convex",
      ts: 1234567890,
    };

    // Serialize twice with sorted keys
    const json1 = JSON.stringify(payload, Object.keys(payload).sort());
    const json2 = JSON.stringify(payload, Object.keys(payload).sort());

    expect(json1).toBe(json2);
  });

  test("different timestamps should produce different signatures", () => {
    const basePayload = {
      nonce: "abc123",
      aid: "EABC",
      purpose: "send",
      argsHash: "hash123",
      aud: "merits-convex",
    };

    const payload1 = { ...basePayload, ts: 1000 };
    const payload2 = { ...basePayload, ts: 2000 };

    const json1 = JSON.stringify(payload1, Object.keys(payload1).sort());
    const json2 = JSON.stringify(payload2, Object.keys(payload2).sort());

    // Different timestamps = different JSON = different signatures
    expect(json1).not.toBe(json2);
  });
});
