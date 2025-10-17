/**
 * Protocol Codec
 *
 * Pure functions for encoding/decoding messages.
 * Testable without any I/O.
 */

import type { ProtocolCodec, Message, HandshakeRequest, HandshakeResponse, ControlMessage, ErrorMessage } from '../merits-client';

interface DiscoveryResponse {
  type: 'discover-response';
  aids: string[];
}

type AnyMessage = Message | HandshakeRequest | HandshakeResponse | ControlMessage | ErrorMessage | DiscoveryResponse;

/**
 * Envelope V1 Codec
 *
 * Simple JSON encoding with minimal overhead.
 * Format: JSON string → UTF-8 bytes
 */
export class EnvelopeV1Codec implements ProtocolCodec {
  encode(message: AnyMessage): Uint8Array {
    // Convert payload to base64 if it's a Message with Uint8Array
    const serializable = this.prepareForSerialization(message);
    const json = JSON.stringify(serializable);
    return new TextEncoder().encode(json);
  }

  decode(bytes: Uint8Array): AnyMessage {
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json);

    // Convert base64 payload back to Uint8Array if present
    return this.restoreFromSerialization(parsed);
  }

  private prepareForSerialization(message: AnyMessage): any {
    if ('payload' in message && message.payload instanceof Uint8Array) {
      // Convert Uint8Array to base64 string
      return {
        ...message,
        payload: this.uint8ArrayToBase64(message.payload),
      };
    }
    return message;
  }

  private restoreFromSerialization(parsed: any): AnyMessage {
    if ('payload' in parsed && typeof parsed.payload === 'string') {
      // Convert base64 string back to Uint8Array
      return {
        ...parsed,
        payload: this.base64ToUint8Array(parsed.payload),
      };
    }
    return parsed;
  }

  private uint8ArrayToBase64(bytes: Uint8Array): string {
    // Browser-compatible base64 encoding
    return btoa(String.fromCharCode(...bytes));
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    // Browser-compatible base64 decoding
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
}

/**
 * Opaque Codec
 *
 * Passes through raw bytes without parsing.
 * Client is responsible for all framing.
 */
export class OpaqueCodec implements ProtocolCodec {
  encode(message: AnyMessage): Uint8Array {
    // Assume message is already bytes
    if ('payload' in message && message.payload instanceof Uint8Array) {
      return message.payload;
    }

    // Fallback: Encode as JSON (shouldn't happen in opaque mode)
    console.warn('[OpaqueCodec] Encoding non-Uint8Array message, falling back to JSON');
    return new TextEncoder().encode(JSON.stringify(message));
  }

  decode(bytes: Uint8Array): AnyMessage {
    // In opaque mode, we can't parse without knowing structure
    // Return a generic Message with raw payload
    return {
      to: '',
      from: '',
      type: 'opaque',
      payload: bytes,
    } as Message;
  }
}

/**
 * Create codec based on protocol name
 */
export function createCodec(protocol: string): ProtocolCodec {
  switch (protocol) {
    case 'envelope-v1':
      return new EnvelopeV1Codec();
    case 'opaque':
      return new OpaqueCodec();
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}

/**
 * Supported protocols (in preference order)
 */
export const SUPPORTED_PROTOCOLS = ['envelope-v1', 'opaque'];

/**
 * Select best protocol from client's proposed list
 *
 * Server preference order takes priority (from SUPPORTED_PROTOCOLS).
 */
export function selectProtocol(clientProposed: string[]): string {
  // Find first protocol in SERVER'S preference order that client also supports
  for (const protocol of SUPPORTED_PROTOCOLS) {
    if (clientProposed.includes(protocol)) {
      return protocol;
    }
  }

  // Default to envelope-v1 if no match
  return 'envelope-v1';
}
