import { v } from "convex/values";
import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/**
 * KERI Key State
 */
export type KeyState = {
  aid: string;
  ksn: number;
  keys: string[];
  threshold: string;
  lastEvtSaid: string;
  updatedAt: number;
};

/**
 * Compute SHA256 hash (generic utility)
 */
async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute SHA256 hash of arguments to bind challenge to specific operation
 */
async function computeArgsHash(args: Record<string, any>): Promise<string> {
  const canonical = JSON.stringify(args, Object.keys(args).sort());
  return await sha256(canonical);
}

/**
 * Compute content hash (for ct binding)
 */
export async function computeCtHash(ct: string): Promise<string> {
  return await sha256(ct);
}

/**
 * Compute envelope hash (audit anchor)
 *
 * Uses canonical deterministic JSON with fixed field order and versioning.
 * NOTE: This uses server-computed timestamps (createdAt, expiresAt) since it's
 * computed AFTER authentication, not during the challenge binding.
 */
export async function computeEnvelopeHash(
  recpAid: string,
  senderAid: string,
  ctHash: string,
  alg: string | undefined,
  ek: string | undefined,
  createdAt: number,
  expiresAt: number
): Promise<string> {
  // Canonical envelope with version (deterministic order)
  const envelope = {
    ver: "envelope/1",
    recpAid,
    senderAid,
    ctHash,
    alg: alg ?? "",
    ek: ek ?? "",
    createdAt,
    expiresAt,
  };
  // Deterministic JSON: sorted keys, no whitespace
  const canonical = JSON.stringify(envelope, Object.keys(envelope).sort());
  return await sha256(canonical);
}

/**
 * Resolve and cache key state for an AID
 *
 * In production, this should resolve via OOBI/resolver.
 * For now, we cache key states with 60s TTL.
 */
export async function ensureKeyState(
  ctx: MutationCtx | QueryCtx,
  aid: string
): Promise<KeyState> {
  const now = Date.now();
  const TTL = 60_000; // 60 seconds

  // Check cache
  const cached = await ctx.db
    .query("keyStates")
    .withIndex("by_aid", (q) => q.eq("aid", aid))
    .first();

  if (cached && cached.updatedAt > now - TTL) {
    return {
      aid: cached.aid,
      ksn: cached.ksn,
      keys: cached.keys,
      threshold: cached.threshold,
      lastEvtSaid: cached.lastEvtSaid,
      updatedAt: cached.updatedAt,
    };
  }

  // TODO: In production, resolve via OOBI/resolver
  // For now, throw error requiring explicit key state registration
  throw new Error(
    `Key state for AID ${aid} not found. Register key state first.`
  );
}

/**
 * Register or update key state for an AID (admin/setup function)
 */
export const registerKeyState = mutation({
  args: {
    aid: v.string(),
    ksn: v.number(),
    keys: v.array(v.string()),
    threshold: v.string(),
    lastEvtSaid: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("keyStates")
      .withIndex("by_aid", (q) => q.eq("aid", args.aid))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ksn: args.ksn,
        keys: args.keys,
        threshold: args.threshold,
        lastEvtSaid: args.lastEvtSaid,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("keyStates", {
        aid: args.aid,
        ksn: args.ksn,
        keys: args.keys,
        threshold: args.threshold,
        lastEvtSaid: args.lastEvtSaid,
        updatedAt: now,
      });
    }
  },
});

/**
 * Decode CESR-encoded key to raw bytes with proper lead-byte handling
 *
 * CESR uses lead-byte padding to align the total length to a multiple of 4 base64 chars.
 * For code 'D' (1 char) with 32-byte keys: ps = (3 - (32 % 3)) % 3 = 1 byte padding
 */
function decodeKey(cesrKey: string): Uint8Array {
  const code = cesrKey[0];

  // Handle single-character codes (D, B, etc.)
  if (code === 'D' || code === 'B' || code === 'C') {
    const cs = 1; // Code size
    const sliceOffset = cs % 4; // How many chars were sliced during encoding

    // Extract base64 portion (after code)
    const b64Sliced = cesrKey.slice(cs);

    // Prepend padding chars that were sliced off during encoding
    // For base64 with lead zero padding, use 'A' chars (base64 for 0)
    const b64Padding = 'A'.repeat(sliceOffset);
    const b64Full = b64Padding + b64Sliced;

    // Base64 decode
    const decoded = base64UrlToUint8Array(b64Full);

    // Calculate and strip lead padding bytes
    // For 32-byte keys: ps = (3 - (32 % 3)) % 3 = 1
    // We need to determine ps from the decoded length
    // decoded.length = ps + rawSize, where rawSize % 3 === (3 - ps) % 3
    const ps = sliceOffset; // ps = cs % 4 for single-char codes

    if (ps > 0 && decoded.length > ps) {
      return decoded.slice(ps);
    }
    return decoded;
  }

  throw new Error(`Unsupported CESR key format: ${cesrKey}`);
}

function base64UrlToUint8Array(base64url: string): Uint8Array {
  // Remove any whitespace
  base64url = base64url.trim();

  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  const padding = (4 - (base64.length % 4)) % 4;
  if (padding > 0) {
    base64 += "=".repeat(padding);
  }

  // Decode base64
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Verify Ed25519 signature using Web Crypto API
 */
async function verifyEd25519(
  signature: Uint8Array,
  data: Uint8Array,
  publicKey: Uint8Array
): Promise<boolean> {
  try {
    // Import Ed25519 public key
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey,
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      },
      false,
      ["verify"]
    );

    // Verify signature
    return await crypto.subtle.verify("Ed25519", key, signature, data);
  } catch (error) {
    return false;
  }
}

/**
 * Verify KERI indexed signatures against key state
 *
 * @param payload - Canonical payload that was signed
 * @param sigs - Array of indexed signatures (format: "idx-base64url")
 * @param keyState - Current key state with keys and threshold
 * @returns true if signatures meet threshold, false otherwise
 */
async function verifyIndexedSigs(
  payload: Record<string, any>,
  sigs: string[],
  keyState: KeyState
): Promise<boolean> {
  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(canonical);

  const threshold = parseInt(keyState.threshold, 16);
  let validSigs = 0;

  for (const sig of sigs) {
    // Parse indexed signature: "idx-signature"
    // Split on first hyphen only, as base64url may contain hyphens
    const hyphenIndex = sig.indexOf("-");
    if (hyphenIndex === -1) {
      continue; // Invalid format
    }

    const idxStr = sig.substring(0, hyphenIndex);
    const sigB64 = sig.substring(hyphenIndex + 1);
    const idx = parseInt(idxStr);

    if (idx >= keyState.keys.length) {
      continue; // Invalid index
    }

    const sigBytes = base64UrlToUint8Array(sigB64);
    const keyBytes = decodeKey(keyState.keys[idx]);

    try {
      const valid = await verifyEd25519(sigBytes, data, keyBytes);
      if (valid) {
        validSigs++;
      }
    } catch (error) {
      continue; // Invalid signature
    }
  }

  return validSigs >= threshold;
}

/**
 * Issue a challenge for authentication
 */
export const issueChallenge = mutation({
  args: {
    aid: v.string(),
    purpose: v.string(), // "send" | "receive" | "ack"
    argsHash: v.string(),
    ttl: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ttl = args.ttl ?? 120_000; // Default 120 seconds
    const expiresAt = now + ttl;

    // Verify AID has registered key state
    await ensureKeyState(ctx, args.aid);

    const nonce = crypto.randomUUID();

    const challengeId = await ctx.db.insert("challenges", {
      aid: args.aid,
      purpose: args.purpose,
      argsHash: args.argsHash,
      nonce,
      createdAt: now,
      expiresAt,
      used: false,
    });

    // Canonical payload for KERI signing (with version and audience)
    const payload = {
      ver: "msg-auth/1", // Payload schema version
      aud: "https://merits-convex.app", // Audience - your server origin
      ts: now,
      nonce,
      aid: args.aid,
      purpose: args.purpose,
      argsHash: args.argsHash,
    };

    return { challengeId, payload };
  },
});

/**
 * Prove challenge by providing signatures
 */
export const proveChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    sigs: v.array(v.string()),
    ksn: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Fetch challenge
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.used) {
      throw new Error("Challenge already used");
    }

    if (challenge.expiresAt < now) {
      throw new Error("Challenge expired");
    }

    // Fetch key state
    const keyState = await ensureKeyState(ctx, challenge.aid);

    // Verify KSN is not ahead of current state (prevent future key use)
    if (args.ksn > keyState.ksn) {
      throw new Error("Invalid KSN - ahead of current state");
    }

    // Reconstruct payload - use the original timestamp from when challenge was issued
    const payload = {
      nonce: challenge.nonce,
      aid: challenge.aid,
      purpose: challenge.purpose,
      argsHash: challenge.argsHash,
      aud: "merits-convex",
      ts: challenge.createdAt,
    };

    // Verify signatures
    const valid = await verifyIndexedSigs(payload, args.sigs, keyState);
    if (!valid) {
      throw new Error("Invalid signatures or threshold not met");
    }

    // Mark challenge as used
    await ctx.db.patch(args.challengeId, { used: true });

    // Return auth token (in production, sign this with server key)
    // For now, return proof of authentication
    return {
      authenticated: true,
      aid: challenge.aid,
      purpose: challenge.purpose,
      argsHash: challenge.argsHash,
    };
  },
});

/**
 * Verify auth for a mutation/query
 *
 * @param ctx - Mutation or query context
 * @param auth - Auth object with challengeId and sigs
 * @param expectedPurpose - Expected purpose ("send" | "receive" | "ack")
 * @param args - Arguments to hash and verify
 * @returns Verification result with AID, KSN, and event SAID
 */
export async function verifyAuth(
  ctx: MutationCtx,
  auth: { challengeId: Id<"challenges">; sigs: string[]; ksn: number },
  expectedPurpose: string,
  args: Record<string, any>
): Promise<{
  aid: string;
  ksn: number;
  evtSaid: string;
  challengeId: Id<"challenges">;
}> {
  const now = Date.now();

  // Fetch challenge
  const challenge = await ctx.db.get(auth.challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  if (challenge.used) {
    throw new Error("Challenge already used");
  }

  if (challenge.expiresAt < now) {
    throw new Error("Challenge expired");
  }

  // Enforce timestamp skew (max 2 minutes)
  const MAX_SKEW = 2 * 60 * 1000;
  const skew = Math.abs(now - challenge.createdAt);
  if (skew > MAX_SKEW) {
    throw new Error("Challenge timestamp skew too large");
  }

  if (challenge.purpose !== expectedPurpose) {
    throw new Error(`Invalid purpose: expected ${expectedPurpose}, got ${challenge.purpose}`);
  }

  // Verify argsHash matches (ALWAYS recompute server-side)
  const argsHash = await computeArgsHash(args);
  if (challenge.argsHash !== argsHash) {
    throw new Error("Args hash mismatch - authentication not valid for these args");
  }

  // Fetch key state
  const keyState = await ensureKeyState(ctx, challenge.aid);

  // Verify KSN (only allow current KSN for strict verification)
  if (auth.ksn !== keyState.ksn) {
    throw new Error(`Invalid KSN: expected ${keyState.ksn}, got ${auth.ksn}`);
  }

  // Reconstruct canonical payload (MUST match what client signed)
  const payload = {
    ver: "msg-auth/1",
    aud: "https://merits-convex.app",
    ts: challenge.createdAt,
    nonce: challenge.nonce,
    aid: challenge.aid,
    purpose: challenge.purpose,
    argsHash: challenge.argsHash,
  };

  // Verify signatures
  const valid = await verifyIndexedSigs(payload, auth.sigs, keyState);
  if (!valid) {
    throw new Error("Invalid signatures");
  }

  // Mark challenge as used
  await ctx.db.patch(auth.challengeId, { used: true });

  // Return verified AID and key state info (NEVER trust client values!)
  return {
    aid: challenge.aid,
    ksn: keyState.ksn,
    evtSaid: keyState.lastEvtSaid,
    challengeId: auth.challengeId,
  };
}

/**
 * Compute args hash (helper for clients)
 */
export const computeHash = query({
  args: {
    args: v.any(),
  },
  handler: async (ctx, { args }) => {
    return await computeArgsHash(args);
  },
});

/**
 * Cleanup expired challenges (can be called periodically)
 */
export const cleanupExpiredChallenges = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expiredChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_expiration")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const ch of expiredChallenges) {
      await ctx.db.delete(ch._id);
    }

    return { deleted: expiredChallenges.length };
  },
});

/**
 * Debug function to verify signatures manually
 */
export const debugVerify = mutation({
  args: {
    challengeId: v.id("challenges"),
    sigs: v.array(v.string()),
    ksn: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();

      // Fetch challenge
      const challenge = await ctx.db.get(args.challengeId);
      if (!challenge) {
        return { success: false, error: "Challenge not found" };
      }

      if (challenge.used) {
        return { success: false, error: "Challenge already used" };
      }

      if (challenge.expiresAt < now) {
        return { success: false, error: "Challenge expired" };
      }

      // Fetch key state
      const keyState = await ensureKeyState(ctx, challenge.aid);

      // Verify KSN
      if (args.ksn > keyState.ksn) {
        return { success: false, error: `Invalid KSN: ${args.ksn} > ${keyState.ksn}` };
      }

      // Reconstruct payload - must match issueChallenge exactly
      const payload = {
        ver: "msg-auth/1",
        aud: "https://merits-convex.app",
        ts: challenge.createdAt,
        nonce: challenge.nonce,
        aid: challenge.aid,
        purpose: challenge.purpose,
        argsHash: challenge.argsHash,
      };

      // Verify signatures
      const valid = await verifyIndexedSigs(payload, args.sigs, keyState);
      if (!valid) {
        return {
          success: false,
          error: "Invalid signatures or threshold not met",
          debug: {
            payload,
            sigs: args.sigs,
            keyState,
            canonical: JSON.stringify(payload, Object.keys(payload).sort()),
          },
        };
      }

      return {
        success: true,
        aid: challenge.aid,
        purpose: challenge.purpose,
        keyState,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
