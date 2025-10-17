/**
 * MessageBus Public API
 *
 * Export types and implementations for message bus abstraction.
 */

export type {
  MessageBus,
  MessageBusConfig,
  MessageBusFactory,
  SendMessageArgs,
  EncryptedMessage,
} from './types';

export { ConvexMessageBus, ConvexMessageBusFactory } from './convex-message-bus';
