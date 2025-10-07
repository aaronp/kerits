/**
 * CESR parser using existing kerits CESR infrastructure
 */

import type { Parser, Hasher, ParsedEvent, EventMeta, Attachment, AttachmentType, SAID } from './types';
import { Diger } from '../cesr/diger.js';
import { Matter } from '../cesr/matter.js';

// Utility functions
function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function slicePrefix(s: string, pref: string): string {
  return s.startsWith(pref) ? s.slice(pref.length) : s;
}

/**
 * Default JSON/CESR parser using kerits CESR infrastructure
 *
 * Assumes the raw is UTF-8 text where line 1 is the SAD JSON
 * (prefixed with "-KERI...") and subsequent lines are CESR attachments
 */
export class DefaultJsonCesrParser implements Parser {
  constructor(private hasher: Hasher) {}

  parse(raw: Uint8Array): ParsedEvent {
    const txt = utf8Decode(raw).trim();
    const lines = txt.split(/\r?\n/);
    if (lines.length === 0) throw new Error("Empty event payload");

    // Event SAD line (may start with "-KERI..." or "-ACDC..." framing)
    const sadLine = lines[0];
    const stripped = slicePrefix(sadLine, "-");
    const hasFrame = stripped.startsWith("KERI") || stripped.startsWith("ACDC");
    const sadJsonStr = hasFrame
      ? sadLine.replace(/^-(KERI|ACDC)[^\{]*({.*)$/s, "$2")
      : sadLine;

    let sad: any;
    try {
      sad = JSON.parse(sadJsonStr);
    } catch (e) {
      throw new Error("Failed to parse SAD JSON line");
    }

    // Attachments: lines starting with "-"
    const atts: Attachment[] = [];
    for (let i = 1; i < lines.length; i++) {
      const L = lines[i].trim();
      if (!L.startsWith("-")) continue;
      const code = L.slice(1, 4).toUpperCase();
      const type: AttachmentType =
        code === "AAB" ? "AAB" :
        code === "FAB" ? "FAB" :
        code === "VRC" ? "VRC" :
        code === "SAB" ? "SEAL" : "OTHER";

      atts.push({
        eventSaid: sad.d,
        type,
        qb64: L.slice(1),
        rawSegment: utf8Encode(L),
      });
    }

    // Compute SAID from the canonical SAD bytes
    const sadBytes = utf8Encode(JSON.stringify(sad));
    const said = this.hasher.computeSaid(sadBytes);

    // Build meta
    const meta: EventMeta = {
      v: sad.v,
      t: sad.t,
      d: sad.d ?? said,
      i: sad.i,
      s: sad.s,
      p: sad.p,
      dt: sad.dt,
      // For VCP, registry ID is the `i` field (same as SAID); for other TEL events, it's in the `ri` field
      ri: sad.t === 'vcp' ? (sad.i ?? sad.d ?? said) : sad.ri,
    };

    // VCP (registry inception) - extract issuer AID
    if (sad.t === 'vcp' && sad.ii) {
      meta.issuerAid = sad.ii;
    }

    // TEL iss/rev carrier for ACDC SAID & parties
    if (sad.t === "iss" || sad.t === "rev") {
      if (sad.i) meta.acdcSaid = sad.i;
      if (sad.a?.i) meta.holderAid = sad.a.i;
    }

    const kind = typeof sad.v === "string" && sad.v.startsWith("KERI") ? sad.v : "KERI10JSON";
    return {
      stored: { raw, kind },
      meta,
      attachments: atts,
    };
  }
}

/**
 * Blake3 SAID hasher using kerits CESR Diger
 */
export class CesrHasher implements Hasher {
  computeSaid(sadBytes: Uint8Array): SAID {
    const diger = new Diger({ ser: sadBytes });
    return diger.qb64;
  }
}

/**
 * Non-cryptographic hasher (for development/testing only)
 * Uses FNV-1a 64-bit hash. NOT CRYPTO-SECURE.
 */
export class NonCryptoHasher implements Hasher {
  computeSaid(sadBytes: Uint8Array): SAID {
    // Fowler–Noll–Vo 1a 64-bit
    let h = BigInt("0xcbf29ce484222325");
    const prime = BigInt("0x100000001b3");
    for (const b of sadBytes) {
      h ^= BigInt(b);
      h = (h * prime) & BigInt("0xFFFFFFFFFFFFFFFF");
    }
    // Represent as a pseudo qb64-ish string for dev
    return "E" + h.toString(36).toUpperCase().padStart(20, "0");
  }
}
