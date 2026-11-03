import { decodeBase64Url, encodeBase64Url } from '../common/base64url.js';
import { canonicalizeEvent } from '../kel/event-crypto.js';
import type { CESREvent } from '../kel/types.js';
import { decodeAttachmentGroupsFromStream, encodeAttachmentGroups } from './attachments.js';

const textDecoder = new TextDecoder();

const OPEN_BRACE = 0x7b;
const CLOSE_BRACE = 0x7d;
const QUOTE = 0x22;
const BACKSLASH = 0x5c;

/**
 * Encode a single CESREvent to raw CESR wire bytes.
 *
 * Wire format: JSON-serialized event body bytes followed by CESR-encoded
 * attachment groups (signature bytes via CESR count codes and group markers).
 *
 * This is the single-event equivalent of encodeCesrStream from
 * encodeCesrStream below.
 */
export function encodeCesrEvent(event: CESREvent): Uint8Array {
  const bodyBytes = event.bytesB64 ? decodeBase64Url(event.bytesB64) : canonicalizeEvent(event.event);

  const attachmentBytes = encodeAttachmentGroups(event.attachments);

  if (attachmentBytes.length === 0) {
    return bodyBytes;
  }

  const combined = new Uint8Array(bodyBytes.length + attachmentBytes.length);
  combined.set(bodyBytes);
  combined.set(attachmentBytes, bodyBytes.length);
  return combined;
}

/**
 * Decode one CESR event from the start of a byte buffer, returning
 * both the decoded event and how many bytes were consumed.
 *
 * This is the primary decoding primitive. decodeCesrEvent wraps it
 * with a full-consumption assertion.
 */
export function decodeCesrEventFromStream(data: Uint8Array): {
  event: CESREvent;
  bytesConsumed: number;
} {
  if (data.length === 0) {
    throw new Error('Cannot decode empty CESR event bytes');
  }

  const bodyByteLength = findJsonObjectEnd(data);
  const bodyBytes = data.subarray(0, bodyByteLength);

  let event: CESREvent['event'];
  try {
    event = JSON.parse(textDecoder.decode(bodyBytes));
  } catch (e) {
    throw new Error(`Failed to decode CESR event: ${e instanceof Error ? e.message : String(e)}`);
  }

  const bytesB64 = encodeBase64Url(bodyBytes);

  const trailingBytes = data.subarray(bodyByteLength);
  const { attachments, bytesConsumed: attachmentBytesConsumed } = decodeAttachmentGroupsFromStream(trailingBytes);

  return {
    event: { event, attachments: [...attachments], bytesB64, enc: 'JSON' },
    bytesConsumed: bodyByteLength + attachmentBytesConsumed,
  };
}

/**
 * Decode raw CESR wire bytes back into a CESREvent.
 *
 * Thin wrapper over decodeCesrEventFromStream that asserts full consumption.
 * Throws if any bytes remain after the event.
 */
export function decodeCesrEvent(data: Uint8Array): CESREvent {
  const { event, bytesConsumed } = decodeCesrEventFromStream(data);
  if (bytesConsumed < data.length) {
    throw new Error(`Unexpected trailing bytes: ${data.length - bytesConsumed} bytes after event`);
  }
  return event;
}

/**
 * Find the byte offset just past the end of the first complete JSON object.
 * Handles nested braces and string literals (including escaped quotes).
 *
 * Scans bytes, never string indices: the structural characters are ASCII and
 * UTF-8 multi-byte sequences only use bytes >= 0x80, so they never collide.
 */
function findJsonObjectEnd(data: Uint8Array): number {
  if (data[0] !== OPEN_BRACE) {
    throw new Error('CESR event bytes do not start with JSON object');
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < data.length; i++) {
    const b = data[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (b === BACKSLASH && inString) {
      escaped = true;
      continue;
    }

    if (b === QUOTE) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (b === OPEN_BRACE) depth++;
    else if (b === CLOSE_BRACE) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }

  // No balanced closing brace found — return full length, let JSON.parse report the error
  return data.length;
}

/**
 * Encode a sequence of CESREvents to concatenated CESR wire bytes.
 *
 * Wire format: event₁_body + event₁_attachments + event₂_body + event₂_attachments + ...
 * Each event is encoded identically to encodeCesrEvent.
 */
export function encodeCesrStream(events: readonly CESREvent[]): Uint8Array {
  if (events.length === 0) return new Uint8Array(0);

  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  for (const event of events) {
    const bytes = encodeCesrEvent(event);
    chunks.push(bytes);
    totalLength += bytes.length;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Decode concatenated CESR wire bytes into a sequence of CESREvents.
 *
 * Iteratively decodes one event at a time using decodeCesrEventFromStream,
 * advancing through the buffer by the reported bytesConsumed.
 */
export function decodeCesrStream(data: Uint8Array): CESREvent[] {
  if (data.length === 0) return [];

  const events: CESREvent[] = [];
  let pos = 0;

  while (pos < data.length) {
    const { event, bytesConsumed } = decodeCesrEventFromStream(data.subarray(pos));
    events.push(event);
    pos += bytesConsumed;
  }

  return events;
}
