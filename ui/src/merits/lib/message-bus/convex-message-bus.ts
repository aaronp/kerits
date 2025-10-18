/**
 * ConvexMessageBus Implementation
 *
 * MessageBus implementation backed by Convex with KERI challenge-response authentication.
 * Based on @server/src/client.ts but adapted for UI integration.
 */

import { ConvexClient } from 'convex/browser';
import type {
  MessageBus,
  MessageBusConfig,
  MessageBusFactory,
  SendMessageArgs,
  EncryptedMessage,
} from './types';


interface ConvexConfig {
  convexUrl: string;
}

export class ConvexMessageBus implements MessageBus {
  private client: ConvexClient;
  private config: MessageBusConfig;
  private messageCallback?: (msg: EncryptedMessage) => void;
  private errorCallback?: (error: Error) => void;
  private unsubscribe?: () => void;

  private constructor(client: ConvexClient, config: MessageBusConfig) {
    this.client = client;
    this.config = config;
  }

  /**
   * Factory method to create and initialize a ConvexMessageBus
   */
  static async connect(config: MessageBusConfig): Promise<MessageBus> {
    const convexConfig = config.backendConfig as ConvexConfig | undefined;
    if (!convexConfig?.convexUrl) {
      throw new Error('ConvexMessageBus requires backendConfig.convexUrl');
    }

    const client = new ConvexClient(convexConfig.convexUrl);
    return ConvexMessageBus.connectWithClient(client, config);
  }

  /**
   * Factory method to create ConvexMessageBus with pre-created client
   * (used when key state registration needs to happen first)
   */
  static async connectWithClient(client: ConvexClient, config: MessageBusConfig): Promise<MessageBus> {
    // Note: Key state registration should be handled by the caller (e.g., KeritsMessageBusFactory)
    // before calling this method. This ensures proper KEL data is used for registration.
    if (!config.signer) {
      console.warn('[ConvexMessageBus] No signer provided - authentication will fail');
    }

    const bus = new ConvexMessageBus(client, config);

    // Subscribe to incoming messages via WebSocket
    bus.startSubscription();

    return bus;
  }

  /**
   * Send an encrypted message
   */
  async sendMessage(args: SendMessageArgs): Promise<string> {
    try {
      const ttl = args.ttl ?? 24 * 60 * 60 * 1000; // Default 24 hours

      console.log('[ConvexMessageBus] Sending message:', {
        from: this.config.userAid.substring(0, 20) + '...',
        to: args.recipientAid.substring(0, 20) + '...',
        ksn: this.config.ksn,
      });

      // Compute ctHash (server will verify)
      const ctHash = await this.computeCtHash(args.ciphertext);
      console.log('[ConvexMessageBus] ctHash:', ctHash.substring(0, 20) + '...');

      // Compute args hash - binds to ctHash, NOT ciphertext
      const argsHash = await this.computeArgsHash({
        recpAid: args.recipientAid,
        ctHash,
        ttl,
        alg: args.algorithm ?? '',
        ek: args.ephemeralKey ?? '',
      });
      console.log('[ConvexMessageBus] argsHash:', argsHash.substring(0, 20) + '...');

      // Issue challenge
      const { challengeId, payload } = await this.issueChallenge(
        this.config.userAid,
        'send',
        argsHash
      );
      console.log('[ConvexMessageBus] Challenge issued:', challengeId);
      console.log('[ConvexMessageBus] Payload:', JSON.stringify(payload, null, 2));

      // Sign payload using Signer or privateKey
      const signerOrKey = this.config.signer || this.config.privateKey;
      if (!signerOrKey) {
        throw new Error('No signer or privateKey provided in config');
      }
      const sigs = await this.signPayload(payload, signerOrKey, 0);
      console.log('[ConvexMessageBus] Signatures:', sigs.map(s => s.substring(0, 50) + '...'));

      // Send message via Convex mutation
      console.log('[ConvexMessageBus] Calling messages:send with auth:', {
        challengeId,
        ksn: this.config.ksn,
        sigCount: sigs.length,
      });

      const messageId = await this.client.mutation(
        'messages:send' as any, // TODO: Use generated API
        {
          recpAid: args.recipientAid,
          ct: args.ciphertext,
          ek: args.ephemeralKey,
          alg: args.algorithm,
          ttl,
          auth: {
            challengeId,
            sigs,
            ksn: this.config.ksn,
          },
        }
      );

      console.log('[ConvexMessageBus] Message sent successfully:', messageId);
      return messageId as string;
    } catch (error) {
      console.error('[ConvexMessageBus] Send failed:', error);
      const err = error instanceof Error ? error : new Error('Failed to send message');
      this.errorCallback?.(err);
      throw err;
    }
  }

  /**
   * Receive messages for the current user
   */
  async receiveMessages(): Promise<EncryptedMessage[]> {
    try {
      // Compute args hash - binds to recpAid only
      const argsHash = await this.computeArgsHash({
        recpAid: this.config.userAid,
      });

      // Issue challenge
      const { challengeId, payload } = await this.issueChallenge(
        this.config.userAid,
        'receive',
        argsHash
      );

      // Sign payload
      const signerOrKey = this.config.signer || this.config.privateKey;
      if (!signerOrKey) {
        throw new Error('No signer or privateKey provided in config');
      }
      const sigs = await this.signPayload(payload, signerOrKey, 0);

      // Receive messages via Convex mutation
      const messages = await this.client.mutation(
        'messages:receive' as any, // TODO: Use generated API
        {
          recpAid: this.config.userAid,
          auth: {
            challengeId,
            sigs,
            ksn: this.config.ksn,
          },
        }
      );

      return (messages as any[]).map((msg) => ({
        id: msg.id,
        senderAid: msg.senderAid,
        ciphertext: msg.ct,
        ephemeralKey: msg.ek,
        algorithm: msg.alg,
        createdAt: msg.createdAt,
        expiresAt: msg.expiresAt,
        envelopeHash: msg.envelopeHash,
        senderSig: msg.senderSig,
        senderKsn: msg.senderKsn,
      }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to receive messages');
      this.errorCallback?.(err);
      throw err;
    }
  }

  /**
   * Acknowledge receipt of a message
   */
  async acknowledgeMessage(messageId: string, envelopeHash: string): Promise<void> {
    try {
      // Compute args hash - binds to recpAid + messageId
      const argsHash = await this.computeArgsHash({
        recpAid: this.config.userAid,
        messageId,
      });

      // Issue challenge
      const { challengeId, payload } = await this.issueChallenge(
        this.config.userAid,
        'ack',
        argsHash
      );

      // Sign payload (for authentication)
      const signerOrKey = this.config.signer || this.config.privateKey;
      if (!signerOrKey) {
        throw new Error('No signer or privateKey provided in config');
      }
      const sigs = await this.signPayload(payload, signerOrKey, 0);

      // Sign envelopeHash for receipt (non-repudiation)
      const receiptPayload = {
        envelopeHash,
        aud: 'https://merits-convex.app',
      };
      const receipt = await this.signPayload(receiptPayload, signerOrKey, 0);

      // Acknowledge via Convex mutation
      await this.client.mutation(
        'messages:acknowledge' as any, // TODO: Use generated API
        {
          messageId,
          receipt,
          auth: {
            challengeId,
            sigs,
            ksn: this.config.ksn,
          },
        }
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to acknowledge message');
      this.errorCallback?.(err);
      throw err;
    }
  }

  /**
   * Register message callback
   */
  onMessage(callback: (msg: EncryptedMessage) => void): void {
    this.messageCallback = callback;
  }

  /**
   * Register error callback
   */
  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    this.unsubscribe?.();
    this.client.close();
  }

  // ============================================================================
  // Private Helpers (KERI Authentication)
  // ============================================================================

  private async computeArgsHash(args: Record<string, any>): Promise<string> {
    return await this.client.query('auth:computeHash' as any, { args });
  }

  private async issueChallenge(
    aid: string,
    purpose: string,
    argsHash: string
  ): Promise<{ challengeId: string; payload: any }> {
    return await this.client.mutation('auth:issueChallenge' as any, {
      aid,
      purpose,
      argsHash,
    });
  }

  private async computeCtHash(ciphertext: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ciphertext);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  private async signPayload(
    payload: any,
    signerOrKey: any | Uint8Array,
    keyIndex: number
  ): Promise<string[]> {
    // Use KERITS signing infrastructure for compatibility
    const { signPayload: keritsSigner } = await import('../../../lib/keri-signer');
    return await keritsSigner(payload, signerOrKey, keyIndex);
  }


  // ============================================================================
  // WebSocket Subscription (real-time push)
  // ============================================================================

  private startSubscription(): void {
    // Subscribe to messages:list query for real-time updates via WebSocket
    const unsubscribe = this.client.onUpdate(
      'messages:list' as any,
      { recpAid: this.config.userAid },
      (messages: any[]) => {
        // Convert to EncryptedMessage format and trigger callbacks
        for (const msg of messages) {
          this.messageCallback?.({
            id: msg.id,
            senderAid: msg.senderAid,
            ciphertext: msg.ct,
            ephemeralKey: msg.ek,
            algorithm: msg.alg,
            createdAt: msg.createdAt,
            expiresAt: msg.expiresAt,
            envelopeHash: msg.envelopeHash,
            senderSig: msg.senderSig,
            senderKsn: msg.senderKsn,
          });
        }
      }
    );

    this.unsubscribe = unsubscribe;
  }
}

/**
 * Factory export for convenience
 */
export const ConvexMessageBusFactory: MessageBusFactory = {
  connect: ConvexMessageBus.connect,
};
