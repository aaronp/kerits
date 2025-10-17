/**
 * MessageBus Interface
 *
 * Transport-agnostic messaging interface for sending/receiving encrypted messages.
 * Designed to be simple, minimal, and easily swappable.
 */

export interface MessageBusConfig {
  /** User's AID (self-certifying identifier) */
  userAid: string;

  /** KERITS Signer for creating signatures (preferred) */
  signer?: any;

  /** User's private key for signing (raw 32-byte Ed25519 key) - DEPRECATED: use signer instead */
  privateKey?: Uint8Array;

  /** Key sequence number (from KERI key state) */
  ksn: number;

  /** Backend configuration (implementation-specific) */
  backendConfig?: Record<string, any>;
}

export interface SendMessageArgs {
  /** Recipient's AID */
  recipientAid: string;

  /** Encrypted message content (ciphertext) */
  ciphertext: string;

  /** Optional ephemeral key for forward secrecy */
  ephemeralKey?: string;

  /** Optional algorithm identifier */
  algorithm?: string;

  /** Optional time-to-live in milliseconds (default: 24 hours) */
  ttl?: number;
}

export interface EncryptedMessage {
  /** Server-assigned message ID */
  id: string;

  /** Sender's AID */
  senderAid: string;

  /** Encrypted message content */
  ciphertext: string;

  /** Optional ephemeral key */
  ephemeralKey?: string;

  /** Optional algorithm identifier */
  algorithm?: string;

  /** Message creation timestamp */
  createdAt: number;

  /** Message expiration timestamp */
  expiresAt: number;

  /** Envelope hash for non-repudiation */
  envelopeHash: string;

  /** Sender's signature */
  senderSig: string[];

  /** Sender's key sequence number */
  senderKsn: number;
}

export interface MessageBus {
  /**
   * Send an encrypted message to a recipient
   * @returns Server-assigned message ID
   */
  sendMessage(args: SendMessageArgs): Promise<string>;

  /**
   * Poll for new messages (Convex will auto-retrieve)
   * @returns Array of encrypted messages
   */
  receiveMessages(): Promise<EncryptedMessage[]>;

  /**
   * Acknowledge receipt of a message
   * @param messageId Server message ID
   */
  acknowledgeMessage(messageId: string, envelopeHash: string): Promise<void>;

  /**
   * Register callback for new messages (if backend supports push)
   * @param callback Function to call when new messages arrive
   */
  onMessage(callback: (msg: EncryptedMessage) => void): void;

  /**
   * Register callback for errors
   * @param callback Function to call on errors
   */
  onError(callback: (error: Error) => void): void;

  /**
   * Disconnect and cleanup resources
   */
  disconnect(): void;
}

/**
 * MessageBus Factory
 *
 * Static factory method for creating connected MessageBus instances.
 */
export interface MessageBusFactory {
  /**
   * Create and connect a MessageBus instance
   * @param config Configuration for the message bus
   * @returns Connected MessageBus instance
   */
  connect(config: MessageBusConfig): Promise<MessageBus>;
}
