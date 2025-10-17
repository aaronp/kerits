/**
 * Access Control List types
 */

export interface ACLEntry {
  /** Contact AID */
  aid: string;

  /** Blocked (no messages) */
  blocked: boolean;

  /** Muted (no notifications) */
  muted: boolean;

  /** Hidden from contact list */
  hidden: boolean;

  /** When ACL was last updated */
  updatedAt: number;
}
