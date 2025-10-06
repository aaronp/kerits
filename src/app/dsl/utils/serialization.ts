/**
 * Serialization utilities for KERI events
 */

/**
 * Serialize an event as CESR-framed bytes
 */
export function serializeEvent(event: any): Uint8Array {
  const json = JSON.stringify(event);
  const versionString = event.v || 'KERI10JSON';
  const frameSize = json.length.toString(16).padStart(6, '0');
  const framed = `-${versionString}${frameSize}_${json}`;
  return new TextEncoder().encode(framed);
}

/**
 * Serialize an ACDC as CESR-framed bytes
 */
export function serializeACDC(acdc: any): Uint8Array {
  const json = JSON.stringify(acdc);
  const versionString = acdc.v || 'ACDC10JSON';
  const frameSize = json.length.toString(16).padStart(6, '0');
  const framed = `-${versionString}${frameSize}_${json}`;
  return new TextEncoder().encode(framed);
}
