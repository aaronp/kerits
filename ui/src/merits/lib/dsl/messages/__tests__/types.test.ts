/**
 * Message Types Unit Tests
 *
 * Tests for message status types and utility functions
 */

import { describe, it, expect } from 'vitest';
import { getDisplayStatus } from '../types';
import type { MessageStatus, DetailedMessageStatus } from '../types';

describe('Message Status Types', () => {
  describe('getDisplayStatus', () => {
    it('should map "enqueued" to "delivered"', () => {
      const status: DetailedMessageStatus = 'enqueued';
      expect(getDisplayStatus(status)).toBe('delivered');
    });

    it('should map "received" to "delivered"', () => {
      const status: DetailedMessageStatus = 'received';
      expect(getDisplayStatus(status)).toBe('delivered');
    });

    it('should pass through "sending" unchanged', () => {
      const status: DetailedMessageStatus = 'sending';
      expect(getDisplayStatus(status)).toBe('sending');
    });

    it('should pass through "sent" unchanged', () => {
      const status: DetailedMessageStatus = 'sent';
      expect(getDisplayStatus(status)).toBe('sent');
    });

    it('should pass through "delivered" unchanged', () => {
      const status: DetailedMessageStatus = 'delivered';
      expect(getDisplayStatus(status)).toBe('delivered');
    });

    it('should pass through "read" unchanged', () => {
      const status: DetailedMessageStatus = 'read';
      expect(getDisplayStatus(status)).toBe('read');
    });

    it('should pass through "failed" unchanged', () => {
      const status: DetailedMessageStatus = 'failed';
      expect(getDisplayStatus(status)).toBe('failed');
    });
  });

  describe('MessageStatus visual representation', () => {
    it('should have 5 distinct display states', () => {
      const validStatuses: MessageStatus[] = [
        'sending',
        'sent',
        'delivered',
        'read',
        'failed',
      ];

      expect(validStatuses).toHaveLength(5);
    });

    it('should have 7 detailed internal states', () => {
      const validDetailedStatuses: DetailedMessageStatus[] = [
        'sending',
        'sent',
        'enqueued',   // internal
        'received',   // internal
        'delivered',
        'read',
        'failed',
      ];

      expect(validDetailedStatuses).toHaveLength(7);
    });
  });

  describe('Status progression', () => {
    it('should follow normal delivery flow', () => {
      const flow: DetailedMessageStatus[] = [
        'sending',
        'sent',
        'enqueued',
        'received',
        'read',
      ];

      const displayFlow = flow.map(getDisplayStatus);

      expect(displayFlow).toEqual([
        'sending',
        'sent',
        'delivered',  // enqueued → delivered
        'delivered',  // received → delivered
        'read',
      ]);
    });

    it('should handle failure flow', () => {
      const flow: DetailedMessageStatus[] = [
        'sending',
        'failed',
      ];

      const displayFlow = flow.map(getDisplayStatus);

      expect(displayFlow).toEqual([
        'sending',
        'failed',
      ]);
    });

    it('should handle offline recipient flow', () => {
      const flow: DetailedMessageStatus[] = [
        'sending',
        'sent',
        // recipient offline - stays at 'sent'
      ];

      const displayFlow = flow.map(getDisplayStatus);

      expect(displayFlow).toEqual([
        'sending',
        'sent',
      ]);
    });
  });
});
