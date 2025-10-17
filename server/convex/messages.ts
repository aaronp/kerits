import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { verifyAuth, computeCtHash, computeEnvelopeHash } from "./auth";

/**
 * Send a message to a recipient (authenticated)
 *
 * SECURITY: senderAid is DERIVED from verified challenge, never trusted from client!
 */
export const send = mutation({
  args: {
    recpAid: v.string(),
    ct: v.string(), // Ciphertext
    ek: v.optional(v.string()), // Ephemeral key for PFS
    alg: v.optional(v.string()), // Algorithm identifier
    ttl: v.optional(v.number()), // TTL in milliseconds
    auth: v.object({
      challengeId: v.id("challenges"),
      sigs: v.array(v.string()),
      ksn: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Enforce TTL limits
    const MIN_TTL = 1000; // 1 second
    const MAX_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
    const ttl = args.ttl ?? 24 * 60 * 60 * 1000; // Default 24 hours

    if (ttl < MIN_TTL || ttl > MAX_TTL) {
      throw new Error(`Invalid TTL: must be between ${MIN_TTL}ms and ${MAX_TTL}ms`);
    }

    // Enforce ciphertext size limit
    const MAX_CT_SIZE = 64 * 1024; // 64 KiB
    if (args.ct.length > MAX_CT_SIZE) {
      throw new Error(`Ciphertext too large: max ${MAX_CT_SIZE} bytes`);
    }

    const expiresAt = now + ttl;

    // Compute ctHash for binding
    const ctHash = await computeCtHash(args.ct);

    // Verify authentication - argsHash MUST include ctHash, not ct!
    // Use ttl (not expiresAt) to avoid timing issues
    const verified = await verifyAuth(
      ctx,
      args.auth,
      "send",
      {
        recpAid: args.recpAid,
        ctHash, // Bind to hash, not plaintext
        ttl, // Use ttl, not expiresAt (timing-independent)
        alg: args.alg ?? "",
        ek: args.ek ?? "",
      }
    );

    // SECURITY: Use server-verified AID, NEVER trust client!
    const senderAid = verified.aid;

    // Compute envelope hash (audit anchor)
    const envelopeHash = await computeEnvelopeHash(
      args.recpAid,
      senderAid,
      ctHash,
      args.alg,
      args.ek,
      now,
      expiresAt
    );

    const messageId = await ctx.db.insert("messages", {
      recpAid: args.recpAid,
      senderAid, // Server-verified, not client-supplied!
      ct: args.ct,
      ctHash,
      ek: args.ek,
      alg: args.alg,
      createdAt: now,
      expiresAt,
      retrieved: false,
      senderSig: args.auth.sigs,
      senderKsn: verified.ksn,
      senderEvtSaid: verified.evtSaid,
      envelopeHash,
      usedChallengeId: verified.challengeId,
    });

    return messageId;
  },
});

/**
 * Retrieve messages for a recipient (authenticated)
 */
export const receive = mutation({
  args: {
    recpAid: v.string(),
    auth: v.object({
      challengeId: v.id("challenges"),
      sigs: v.array(v.string()),
      ksn: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Verify authentication - argsHash binds to recpAid only
    const verified = await verifyAuth(
      ctx,
      args.auth,
      "receive",
      {
        recpAid: args.recpAid,
      }
    );

    // SECURITY: Ensure the verified AID matches the recipient
    if (verified.aid !== args.recpAid) {
      throw new Error("Cannot receive messages for different AID");
    }

    // Get all unretrieved messages for the recipient that haven't expired
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) =>
        q.eq("recpAid", args.recpAid).eq("retrieved", false)
      )
      .filter((q) => q.gt(q.field("expiresAt"), now))
      .collect();

    return messages.map((msg) => ({
      id: msg._id,
      senderAid: msg.senderAid,
      ct: msg.ct,
      ctHash: msg.ctHash,
      ek: msg.ek,
      alg: msg.alg,
      createdAt: msg.createdAt,
      expiresAt: msg.expiresAt,
      senderSig: msg.senderSig,
      senderKsn: msg.senderKsn,
      senderEvtSaid: msg.senderEvtSaid,
      envelopeHash: msg.envelopeHash,
    }));
  },
});

/**
 * Mark a message as retrieved (acknowledge receipt) - authenticated
 *
 * SECURITY: Stores recipient's signature over envelopeHash for non-repudiable
 * proof of delivery.
 */
export const acknowledge = mutation({
  args: {
    messageId: v.id("messages"),
    receipt: v.array(v.string()), // Recipient signs envelopeHash
    auth: v.object({
      challengeId: v.id("challenges"),
      sigs: v.array(v.string()),
      ksn: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    // Fetch message to get recpAid
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify authentication - argsHash binds to recpAid + messageId
    const verified = await verifyAuth(
      ctx,
      args.auth,
      "ack",
      {
        recpAid: message.recpAid,
        messageId: args.messageId,
      }
    );

    // SECURITY: Ensure the verified AID matches the recipient
    if (verified.aid !== message.recpAid) {
      throw new Error("Cannot acknowledge message for different AID");
    }

    // TODO: Verify receipt signatures over envelopeHash
    // This requires importing verifyIndexedSigs or creating a public version
    // For now, we trust that the auth challenge proves control
    // In production, add:
    // const receiptPayload = { envelopeHash: message.envelopeHash, aud: "https://merits-convex.app" };
    // const receiptValid = await verifyIndexedSigs(receiptPayload, args.receipt, recipientKeyState);

    await ctx.db.patch(args.messageId, {
      retrieved: true,
      receiptSig: args.receipt,
      receiptKsn: verified.ksn,
      receiptEvtSaid: verified.evtSaid,
    });
  },
});

/**
 * Clean up expired messages (can be called periodically)
 */
export const cleanupExpired = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expiredMessages = await ctx.db
      .query("messages")
      .withIndex("by_expiration")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();

    for (const msg of expiredMessages) {
      await ctx.db.delete(msg._id);
    }

    return { deleted: expiredMessages.length };
  },
});

/**
 * List messages for a recipient (reactive query for WebSocket subscriptions)
 *
 * This is a pure query - no mutations, no popping/dequeuing.
 * Use messages:acknowledge to mark messages as retrieved.
 */
export const list = query({
  args: {
    recpAid: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all non-expired, unretrieved messages for recipient
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_recipient", (q) => q.eq("recpAid", args.recpAid))
      .filter((q) =>
        q.and(
          q.gt(q.field("expiresAt"), now), // Not expired
          q.eq(q.field("retrieved"), false)  // Not yet retrieved
        )
      )
      .order("desc") // Newest first
      .collect();

    // Return in the format expected by UI
    return messages.map((msg) => ({
      id: msg._id,
      senderAid: msg.senderAid,
      ct: msg.ct,
      ek: msg.ek,
      alg: msg.alg,
      createdAt: msg.createdAt,
      expiresAt: msg.expiresAt,
      envelopeHash: msg.envelopeHash,
      senderSig: msg.senderSig,
      senderKsn: msg.senderKsn,
    }));
  },
});
