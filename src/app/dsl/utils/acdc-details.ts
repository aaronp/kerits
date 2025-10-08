/**
 * Utility functions for extracting ACDC details from CESR events
 */

import { parseCesrStream, parseIndexedSignatures } from '../../signing';
import type { ExportDSL } from '../types/sync';

export interface ACDCEventDetails {
  /** Public keys used to sign */
  publicKeys: string[];
  /** Signatures on the event */
  signatures: string[];
  /** JSON representation of the bundle */
  json: string;
  /** CESR representation of the bundle */
  cesr: string;
  /** Parsed event data */
  event: any;
  /** Parsed ACDC credential */
  acdcEvent: any;
  /** Parsed TEL issuance event */
  telEvent: any;
}

/**
 * Extract detailed signing information from an ACDC export
 * @param exportDsl - Export DSL from ACDC
 * @returns Detailed event information including signatures
 */
export async function extractACDCDetails(exportDsl: ExportDSL): Promise<ACDCEventDetails> {
  const bundle = exportDsl.asBundle();

  // Get JSON and CESR representations
  const json = exportDsl.toJSON();
  const cesrBytes = exportDsl.toCESR();
  const cesr = new TextDecoder().decode(cesrBytes);

  const publicKeys: string[] = [];
  const signatures: string[] = [];
  let event: any = null;
  let acdcEvent: any = null;
  let telEvent: any = null;

  // ACDC bundles contain:
  // - events[0]: The ACDC credential itself (no signatures)
  // - events[1]: The TEL issuance event (has signatures)

  // Parse the ACDC credential (first event) for event data and issuer
  if (bundle.events.length > 0) {
    try {
      const parsed = parseCesrStream(bundle.events[0]);

      // Extract event data
      const eventText = new TextDecoder().decode(parsed.event);
      const jsonStart = eventText.indexOf('{');
      if (jsonStart >= 0) {
        event = JSON.parse(eventText.substring(jsonStart));
        acdcEvent = event;

        // Get issuer AID from ACDC attributes
        if (event.a && event.a.i) {
          publicKeys.push(event.a.i);
        }
      }
    } catch (error) {
      console.warn('Failed to parse CESR ACDC:', error);
    }
  }

  // Parse the TEL issuance event (second event) for signatures and public keys
  if (bundle.events.length > 1) {
    try {
      const parsed = parseCesrStream(bundle.events[1]);

      // Extract TEL event data
      const telEventText = new TextDecoder().decode(parsed.event);
      const jsonStart = telEventText.indexOf('{');
      if (jsonStart >= 0) {
        telEvent = JSON.parse(telEventText.substring(jsonStart));
      }

      // Extract indexed signatures from TEL issuance event
      if (parsed.signatures) {
        const parsedSigs = parseIndexedSignatures(parsed.signatures);
        signatures.push(...parsedSigs.map(s => s.signature));
      }
    } catch (error) {
      console.warn('Failed to parse CESR TEL event:', error);
    }
  }

  // Create a more useful JSON representation with decoded events
  const decodedJson = JSON.stringify({
    acdc: acdcEvent,
    issuance: telEvent ? {
      ...telEvent,
      signatures: signatures,
    } : null,
  }, null, 2);

  return {
    publicKeys,
    signatures,
    json: decodedJson,
    cesr,
    event,
    acdcEvent,
    telEvent,
  };
}
