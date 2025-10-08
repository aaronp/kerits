/**
 * Parse KERI event from raw CESR bytes
 * Extracts public keys and signatures
 */

export interface ParsedEventData {
  parsed?: any;
  publicKeys: string[];
  signatures: string[];
}

export function parseKeriEvent(raw: Uint8Array): ParsedEventData {
  let parsed: any = null;
  let publicKeys: string[] = [];
  let signatures: string[] = [];

  try {
    const decoder = new TextDecoder();
    const text = decoder.decode(raw);

    // Parse JSON event
    const lines = text.split('\n');
    const jsonLine = lines.find(line => line.trim().startsWith('{'));

    if (jsonLine) {
      parsed = JSON.parse(jsonLine);

      // Extract public keys
      if (parsed.k) {
        publicKeys = Array.isArray(parsed.k) ? parsed.k : [parsed.k];
      }
      // For TEL events, check backers (b)
      if (parsed.b) {
        publicKeys = Array.isArray(parsed.b) ? parsed.b : [parsed.b];
      }
    }

    // Extract signatures from CESR indexed signature section
    // Look for "-AAD" which indicates indexed signatures
    const sigStart = text.indexOf('-AAD');
    if (sigStart !== -1) {
      // Parse the indexed signature section
      // Format: -AAD{count}{index}{sig}{index}{sig}...
      const sigSection = text.substring(sigStart);
      const countHex = sigSection.substring(4, 6);
      const count = parseInt(countHex, 16);

      if (!isNaN(count) && count > 0) {
        let pos = 6; // Start after "-AAD{count}"

        for (let i = 0; i < count; i++) {
          // Skip index character(s)
          if (sigSection[pos] === '0') {
            pos += 2; // Two-character index (0A-0Z)
          } else {
            pos += 1; // Single character index (A-Z, a-z)
          }

          // Extract signature (typically "0B" prefix + 86 base64 chars for Ed25519)
          if (pos + 88 <= sigSection.length) {
            const sig = sigSection.substring(pos, pos + 88);
            signatures.push(sig);
            pos += 88;
          } else {
            // Try to extract whatever signature data is available
            const remainingSig = sigSection.substring(pos).split(/[-\n]/)[0];
            if (remainingSig) {
              signatures.push(remainingSig);
            }
            break;
          }
        }
      }
    }
  } catch (parseErr) {
    console.warn('Failed to parse KERI event:', parseErr);
  }

  return {
    parsed,
    publicKeys,
    signatures,
  };
}
