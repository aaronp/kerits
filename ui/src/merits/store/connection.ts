/**
 * Connection Store (Simplified for MessageBus)
 *
 * Manages MessageBus connection lifecycle with automatic initialization.
 * No more manual connect/disconnect - just works!
 */

import { create } from 'zustand';
import type { MessageBus, MessageBusFactory, EncryptedMessage } from '../lib/message-bus';
import { ConvexMessageBusFactory } from '../lib/message-bus';

interface ConnectionState {
  bus: MessageBus | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;

  // Actions
  initialize: (userAid: string, privateKey: Uint8Array, ksn: number) => Promise<void>;
  initializeWithFactory: (factory: MessageBusFactory) => Promise<void>;
  disconnect: () => void;
}

export const useConnection = create<ConnectionState>((set, get) => ({
  bus: null,
  status: 'disconnected',
  error: null,

  // Initialize MessageBus for the current user (legacy method)
  initialize: async (userAid: string, privateKey: Uint8Array, ksn: number) => {
    console.log('[Connection] Initializing MessageBus for:', userAid.substring(0, 20));
    set({ status: 'connecting', error: null });

    try {
      // Create MessageBus instance
      const bus = await ConvexMessageBusFactory.connect({
        userAid,
        privateKey,
        ksn,
        backendConfig: {
          convexUrl: import.meta.env.VITE_CONVEX_URL || 'https://accurate-penguin-901.convex.cloud',
        },
      });

      // Register message handler
      bus.onMessage((msg: EncryptedMessage) => {
        console.log('[Connection] Received message from:', msg.senderAid.substring(0, 20));

        // Forward to messages store
        import('./messages').then(({ useMessages }) => {
          useMessages.getState().receiveEncryptedMessage(msg);
        });
      });

      // Register error handler
      bus.onError((error: Error) => {
        console.error('[Connection] MessageBus error:', error);
        set({ error: error.message, status: 'error' });
      });

      set({ bus, status: 'connected' });
      console.log('[Connection] MessageBus connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize MessageBus';
      console.error('[Connection] Initialization failed:', message);
      set({ status: 'error', error: message });
      throw error;
    }
  },

  // Initialize MessageBus with custom factory (KERITS integration)
  initializeWithFactory: async (factory: MessageBusFactory) => {
    console.log('[Connection] Initializing MessageBus with factory');
    set({ status: 'connecting', error: null });

    try {
      // Connect via factory
      const bus = await factory.connect();

      // Register message handler
      bus.onMessage((msg: EncryptedMessage) => {
        console.log('[Connection] Received message from:', msg.senderAid.substring(0, 20));

        // Forward to messages store
        import('./messages').then(({ useMessages }) => {
          useMessages.getState().receiveEncryptedMessage(msg);
        });
      });

      // Register error handler
      bus.onError((error: Error) => {
        console.error('[Connection] MessageBus error:', error);
        set({ error: error.message, status: 'error' });
      });

      set({ bus, status: 'connected' });
      console.log('[Connection] MessageBus connected successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to initialize MessageBus';
      console.error('[Connection] Initialization failed:', message);
      set({ status: 'error', error: message });
      throw error;
    }
  },

  // Disconnect and cleanup
  disconnect: () => {
    const { bus } = get();

    if (bus) {
      bus.disconnect();
      set({ bus: null, status: 'disconnected' });
      console.log('[Connection] MessageBus disconnected');
    }
  },
}));
