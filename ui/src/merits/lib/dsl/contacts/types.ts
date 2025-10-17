/**
 * Contact data types
 */

export interface Contact {
  /** Contact's AID (their SAID) */
  aid: string;

  /** User-provided nickname/alias */
  alias?: string;

  /** Whether this contact is an unknown sender (auto-created) */
  isUnknown: boolean;

  /** Public key (retrieved from MERITS backend) */
  publicKey?: string;

  /** When contact was added */
  addedAt: number;

  /** Last message timestamp */
  lastMessageAt?: number;

  /** Last read message ID (for unread tracking) */
  lastReadMessageId?: string | null;

  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface ContactListOptions {
  /** Include hidden contacts */
  includeHidden?: boolean;

  /** Sort by field */
  sortBy?: 'alias' | 'addedAt' | 'lastMessageAt';

  /** Sort direction */
  sortDir?: 'asc' | 'desc';
}
