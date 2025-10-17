import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export interface Message {
  id: Id<"messages">;
  senderAid: string;
  ct: string;
  ctHash: string;
  ek?: string;
  alg?: string;
  createdAt: number;
  expiresAt: number;
  senderSig: string[];
  senderKsn: number;
  senderEvtSaid: string;
  envelopeHash: string;
}

export interface SendOptions {
  ttl?: number; // Time to live in milliseconds
}

export interface AuthCredentials {
  aid: string;
  privateKey: Uint8Array;
  ksn: number;
}

export class MessageBusClient {
  private client: ConvexClient;

  constructor(convexUrl: string) {
    this.client = new ConvexClient(convexUrl);
  }

  /**
   * Register key state for an AID (setup)
   */
  async registerKeyState(
    aid: string,
    ksn: number,
    keys: string[],
    threshold: string,
    lastEvtSaid: string
  ): Promise<Id<"keyStates">> {
    return await this.client.mutation(api.auth.registerKeyState, {
      aid,
      ksn,
      keys,
      threshold,
      lastEvtSaid,
    });
  }

  /**
   * Issue a challenge for authentication
   */
  async issueChallenge(
    aid: string,
    purpose: string,
    argsHash: string
  ): Promise<{ challengeId: Id<"challenges">; payload: any }> {
    return await this.client.mutation(api.auth.issueChallenge, {
      aid,
      purpose,
      argsHash,
    });
  }

  /**
   * Compute args hash (helper)
   */
  async computeArgsHash(args: Record<string, any>): Promise<string> {
    return await this.client.query(api.auth.computeHash, { args });
  }

  /**
   * Send a message to a recipient (authenticated)
   */
  async send(
    recpAid: string,
    ct: string,
    credentials: AuthCredentials,
    options?: SendOptions & { ek?: string; alg?: string }
  ): Promise<Id<"messages">> {
    const ttl = options?.ttl ?? 24 * 60 * 60 * 1000;

    // Compute ctHash (server will verify this)
    const ctHash = await this.computeCtHash(ct);

    // Compute args hash - binds to ctHash, NOT ct!
    // Use ttl (not expiresAt) to match server computation
    const argsHash = await this.computeArgsHash({
      recpAid,
      ctHash,
      ttl, // Use ttl, not expiresAt
      alg: options?.alg ?? "",
      ek: options?.ek ?? "",
    });

    // Issue challenge
    const { challengeId, payload } = await this.issueChallenge(
      credentials.aid,
      "send",
      argsHash
    );

    // Sign payload
    const sigs = await this.signPayload(payload, credentials.privateKey, 0);

    // Send message
    const messageId = await this.client.mutation(api.messages.send, {
      recpAid,
      ct,
      ek: options?.ek,
      alg: options?.alg,
      ttl,
      auth: {
        challengeId,
        sigs,
        ksn: credentials.ksn,
      },
    });
    return messageId;
  }

  /**
   * Compute ctHash (helper)
   */
  private async computeCtHash(ct: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ct);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Receive messages for a recipient (authenticated)
   */
  async receive(
    recpAid: string,
    credentials: AuthCredentials
  ): Promise<Message[]> {
    // Compute args hash - binds to recpAid only
    const argsHash = await this.computeArgsHash({ recpAid });

    // Issue challenge
    const { challengeId, payload } = await this.issueChallenge(
      credentials.aid,
      "receive",
      argsHash
    );

    // Sign payload
    const sigs = await this.signPayload(payload, credentials.privateKey, 0);

    // Receive messages
    const messages = await this.client.mutation(api.messages.receive, {
      recpAid,
      auth: {
        challengeId,
        sigs,
        ksn: credentials.ksn,
      },
    });
    return messages;
  }

  /**
   * Subscribe to messages (not yet authenticated - would need session tokens)
   */
  subscribe(
    recipientDid: string,
    callback: (messages: Message[]) => void
  ): () => void {
    throw new Error("Subscribe not yet implemented with authentication");
  }

  /**
   * Acknowledge receipt of a message (authenticated)
   */
  async acknowledge(
    messageId: Id<"messages">,
    recpAid: string,
    envelopeHash: string,
    credentials: AuthCredentials
  ): Promise<void> {
    // Compute args hash - binds to recpAid + messageId
    const argsHash = await this.computeArgsHash({ recpAid, messageId });

    // Issue challenge
    const { challengeId, payload } = await this.issueChallenge(
      credentials.aid,
      "ack",
      argsHash
    );

    // Sign payload (for authentication)
    const sigs = await this.signPayload(payload, credentials.privateKey, 0);

    // Sign envelopeHash for receipt (non-repudiation)
    const receiptPayload = {
      envelopeHash,
      aud: "https://merits-convex.app",
    };
    const receipt = await this.signPayload(receiptPayload, credentials.privateKey, 0);

    // Acknowledge
    await this.client.mutation(api.messages.acknowledge, {
      messageId,
      receipt,
      auth: {
        challengeId,
        sigs,
        ksn: credentials.ksn,
      },
    });
  }

  /**
   * Sign payload with private key (creates indexed signature)
   */
  private async signPayload(
    payload: any,
    privateKey: Uint8Array,
    keyIndex: number
  ): Promise<string[]> {
    // Canonicalize payload
    const canonical = JSON.stringify(payload, Object.keys(payload).sort());
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);

    // Import private key for signing
    const pkcs8 = this.reconstructPKCS8(privateKey);
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

    // Sign
    const signatureBuffer = await crypto.subtle.sign("Ed25519", key, data);
    const signature = new Uint8Array(signatureBuffer);

    // Create indexed signature
    const sigBase64 = this.uint8ArrayToBase64Url(signature);
    return [`${keyIndex}-${sigBase64}`];
  }

  /**
   * Reconstruct PKCS8 format from raw 32-byte Ed25519 private key
   */
  private reconstructPKCS8(rawPrivateKey: Uint8Array): Uint8Array {
    const pkcs8Header = new Uint8Array([
      0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70,
      0x04, 0x22, 0x04, 0x20,
    ]);
    const result = new Uint8Array(pkcs8Header.length + rawPrivateKey.length);
    result.set(pkcs8Header, 0);
    result.set(rawPrivateKey, pkcs8Header.length);
    return result;
  }

  /**
   * Base64url encoding
   */
  private uint8ArrayToBase64Url(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  /**
   * Clean up expired messages
   */
  async cleanupExpired(): Promise<{ deleted: number }> {
    const result = await this.client.mutation(api.messages.cleanupExpired, {});
    return result;
  }

  /**
   * Close the client connection
   */
  close(): void {
    this.client.close();
  }
}

/**
 * Mock encryption helper (for testing without real crypto)
 */
export function mockEncrypt(plaintext: string): string {
  return Buffer.from(plaintext).toString("base64");
}

/**
 * Mock decryption helper (for testing without real crypto)
 */
export function mockDecrypt(ciphertext: string): string {
  return Buffer.from(ciphertext, "base64").toString("utf-8");
}
