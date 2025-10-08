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

      // Extract indexed signatures from TEL issuance event
      if (parsed.signatures) {
        const parsedSigs = parseIndexedSignatures(parsed.signatures);
        signatures.push(...parsedSigs.map(s => s.signature));
      }
    } catch (error) {
      console.warn('Failed to parse CESR TEL event:', error);
    }
  }

  return {
    publicKeys,
    signatures,
    json,
    cesr,
    event,
  };
}
