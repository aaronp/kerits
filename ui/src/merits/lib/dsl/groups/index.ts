/**
 * Group Chat Module Exports
 */

export { GroupManager } from './manager';
export type { GroupManagerOptions } from './manager';

export { SyncStrategy, SmartSyncStrategy } from './sync-strategy';
export type { SyncOptions } from './sync-strategy';

export {
  VectorClock,
  QuorumUtils,
  type Group,
  type GroupMember,
  type GroupMessage,
  type GroupSettings,
  type VoteMessage,
  type SyncRequestMessage,
  type SyncResponseMessage,
  type MetadataUpdateMessage,
  type GroupControlMessage,
} from './types';
