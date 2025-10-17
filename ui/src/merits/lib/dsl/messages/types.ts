/**
 * Message Types
 *
 * Types for message management and blockchain-like message chains
 */

/**
 * Message status in the delivery lifecycle
 *
 * Visual representation (WhatsApp-style):
 * - sending:   ○ (gray clock/circle)
 * - sent:      ✓ (single gray check)
 * - delivered: ✓✓ (double gray checks) - recipient has the message
 * - read:      ✓✓ (double blue/green checks) - recipient viewed it
 * - failed:    ✗ (red X)
 */
export type MessageStatus =
  | 'sending'          // Message being sent to MERITS (○ gray)
  | 'sent'             // Sent to MERITS, no confirmation yet (✓ gray)
  | 'delivered'        // Delivered to recipient (✓✓ gray)
  | 'read'             // Recipient viewed message in UI (✓✓ blue)
  | 'failed';          // Failed to send (✗ red)

/**
 * Internal delivery substates (for detailed tracking)
 * Maps to MessageStatus for UI display:
 * - 'enqueued' → displays as 'delivered'
 * - 'received' → displays as 'delivered'
 */
export type DetailedMessageStatus =
  | MessageStatus
  | 'enqueued'         // MERITS confirmed recipient online (internal state)
  | 'received';        // Recipient persisted message (internal state)

/**
 * Stored message with chain metadata
 */
export interface StoredMessage {
  id: string;                    // Message hash (SHA-256)
  prevId: string | null;         // Previous message hash (blockchain chain)
  channelId: string;             // Contact AID (channel identifier)
  from: string;                  // Sender AID
  to: string;                    // Recipient AID
  content: string;               // Message content
  timestamp: number;             // When message was created
  status: DetailedMessageStatus; // Current delivery status (internal)
  seq: number;                   // Sequential number in channel (0-indexed)
  error?: string;                // Error message if status is 'failed'
}

/**
 * Utility: Map internal detailed status to UI display status
 */
export function getDisplayStatus(status: DetailedMessageStatus): MessageStatus {
  if (status === 'enqueued' || status === 'received') {
    return 'delivered';
  }
  return status as MessageStatus;
}

/**
 * Message ACK payload
 */
export interface MessageAck {
  type: 'ack';
  ackType: 'received' | 'read';
  messageId: string;             // ID of message being acknowledged
  timestamp: number;
}

/**
 * Channel metadata
 */
export interface ChannelMetadata {
  channelId: string;             // Contact AID
  headId: string | null;         // ID of most recent message
  messageCount: number;          // Total messages in channel
  lastActivity: number;          // Timestamp of last message
}
