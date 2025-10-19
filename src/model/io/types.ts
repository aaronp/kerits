/**
 * Core IO types for Kerits
 * 
 * This package provides the fundamental storage and transport abstractions
 * that enable pluggable backends for different environments.
 */

export type Bytes = Uint8Array;

// Re-export core types for convenience
export type { SAID, AID } from '../types';

// Re-export all interfaces from their individual files
export type { KeyValueStore, NamespacedStore } from './key-value-store';
export type { Hasher } from './hasher';
export type { ContentAddressedStore } from './content-addressed-store';
export type { Message, Channel, Transport } from './transport';
export type { OOBIResolver } from './oobi-resolver';
