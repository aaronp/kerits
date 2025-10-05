/**
 * CESR Matter - Base class for all CESR primitives
 *
 * Implements core encoding/decoding for Composable Event Streaming Representation
 */

import {
  encodeB64,
  decodeB64,
  intToB64,
  b64ToInt,
  codeB64ToB2,
  codeB2ToB64,
  nabSextets,
  sceil,
  isAllZeros,
  concatBytes,
  textToBytes,
  bytesToText,
} from './utils.js';
import { Sizes, Hards, type Sizage } from './codex.js';

export interface MatterParams {
  raw?: Uint8Array;
  code?: string;
  soft?: string;
  rize?: number;
  qb64?: string;
  qb64b?: Uint8Array;
  qb2?: Uint8Array;
}

/**
 * Matter - Base class for CESR primitives
 *
 * Fully qualified cryptographic material with derivation code
 */
export class Matter {
  protected _code!: string;
  protected _soft: string = '';
  protected _raw!: Uint8Array;

  constructor(params: MatterParams = {}) {
    if (params.qb64 !== undefined) {
      this._exfil(params.qb64);
    } else if (params.qb64b !== undefined) {
      this._exfil(bytesToText(params.qb64b));
    } else if (params.qb2 !== undefined) {
      this._bexfil(params.qb2);
    } else if (params.raw !== undefined) {
      this._code = params.code || this.defaultCode();
      this._soft = params.soft || '';
      this._raw = params.raw;

      // Validate raw size if rize provided
      if (params.rize !== undefined && this._raw.length !== params.rize) {
        throw new Error(
          `Invalid raw size: expected ${params.rize}, got ${this._raw.length}`
        );
      }

      // Validate sizes
      const sizage = Sizes.get(this._code);
      if (!sizage) {
        throw new Error(`Invalid code: ${this._code}`);
      }

      if (sizage.fs !== null) {
        // Fixed size
        const expectedRawSize = Math.floor((sizage.fs - sizage.hs - sizage.ss) * 3 / 4) - sizage.ls;
        if (this._raw.length !== expectedRawSize) {
          throw new Error(
            `Invalid raw size for code ${this._code}: expected ${expectedRawSize}, got ${this._raw.length}`
          );
        }
      }
    } else {
      throw new Error('Missing initialization parameter: need raw, qb64, qb64b, or qb2');
    }
  }

  /**
   * Default derivation code for this class
   * Subclasses should override
   */
  protected defaultCode(): string {
    throw new Error('Must provide code or override defaultCode()');
  }

  /**
   * Hard part of derivation code (stable)
   */
  get code(): string {
    return this._code;
  }

  /**
   * Soft part of derivation code (variable)
   */
  get soft(): string {
    return this._soft;
  }

  /**
   * Both hard and soft parts combined
   */
  get both(): string {
    const sizage = Sizes.get(this._code)!;
    const xtra = '_'.repeat(sizage.xs);
    return this._code + xtra + this._soft;
  }

  /**
   * Raw cryptographic material (no code)
   */
  get raw(): Uint8Array {
    return this._raw;
  }

  /**
   * Size of primitive (number of quadlets including soft)
   * Returns null for fixed-size primitives
   */
  get size(): number | null {
    const sizage = Sizes.get(this._code)!;
    if (sizage.fs !== null) {
      return null; // Fixed size
    }
    return Math.floor((this._raw.length + sizage.ls) / 3);
  }

  /**
   * Full size of primitive in characters
   */
  get fullSize(): number {
    const sizage = Sizes.get(this._code)!;

    if (sizage.fs !== null) {
      return sizage.fs;
    } else {
      // Variable sized
      const cs = sizage.hs + sizage.ss;
      const size = b64ToInt(this._soft);
      return cs + (size * 4);
    }
  }

  /**
   * Base64 fully qualified (text)
   */
  get qb64(): string {
    return bytesToText(this._infil());
  }

  /**
   * Base64 fully qualified (bytes)
   */
  get qb64b(): Uint8Array {
    return this._infil();
  }

  /**
   * Binary fully qualified
   */
  get qb2(): Uint8Array {
    return this._binfil();
  }

  /**
   * Encode to qb64 format (internal)
   */
  protected _infil(): Uint8Array {
    const sizage = Sizes.get(this._code)!;
    const { hs, ss, xs, fs, ls } = sizage;
    const cs = hs + ss;
    const both = this.both;
    const rs = this._raw.length;

    if (fs === null) {
      // Variable sized
      const vls = (3 - (rs % 3)) % 3; // Variable lead size
      const size = Math.floor((rs + vls) / 3);
      this._soft = intToB64(size, ss);
      const code = this._code + this._soft;

      // Encode with variable lead
      const prepadded = concatBytes(new Uint8Array(vls), this._raw);
      const encoded = encodeB64(prepadded);

      return textToBytes(code + encoded);
    } else {
      // Fixed sized
      const ps = (3 - ((rs + ls) % 3)) % 3; // Pad size

      // Verify alignment: ps must equal cs % 4
      if (ps !== (cs % 4)) {
        throw new Error(
          `Misaligned code: ps=${ps} != cs%4=${cs % 4} for code ${this._code}`
        );
      }

      // Prepad with ps+ls zeros, encode, then skip first ps chars
      const prepadded = concatBytes(new Uint8Array(ps + ls), this._raw);
      const encoded = encodeB64(prepadded);
      const trimmed = encoded.slice(ps);

      return textToBytes(both + trimmed);
    }
  }

  /**
   * Encode to qb2 format (internal)
   */
  protected _binfil(): Uint8Array {
    const sizage = Sizes.get(this._code)!;
    const { hs, ss, xs, fs } = sizage;
    const cs = hs + ss;
    const rs = this._raw.length;

    // For variable sized, calculate and update soft
    let actualLs = sizage.ls;
    if (fs === null) {
      const vls = (3 - (rs % 3)) % 3; // Variable lead size
      const size = Math.floor((rs + vls) / 3);
      this._soft = intToB64(size, ss);
      actualLs = vls;
    }

    const both = this.both;

    // Convert code to binary
    const n = sceil(cs * 3 / 4);
    const codeInt = b64ToInt(both);
    const shiftedInt = codeInt << (2 * (cs % 4));

    const bcode = new Uint8Array(n);
    let value = shiftedInt;
    for (let i = n - 1; i >= 0; i--) {
      bcode[i] = value & 0xFF;
      value = value >>> 8;
    }

    // Concatenate: binary code + lead bytes + raw
    return concatBytes(bcode, new Uint8Array(actualLs), this._raw);
  }

  /**
   * Decode from qb64 format (internal)
   */
  protected _exfil(qb64: string | Uint8Array): void {
    const qb64str = typeof qb64 === 'string' ? qb64 : bytesToText(qb64);

    if (qb64str.length === 0) {
      throw new Error('Empty qualified base64 string');
    }

    // Get hard size from first char
    const first = qb64str[0];
    const hs = Hards.get(first);

    if (hs === undefined) {
      throw new Error(`Invalid first character in code: ${first}`);
    }

    // Extract code
    const hard = qb64str.slice(0, hs);
    const sizage = Sizes.get(hard);

    if (!sizage) {
      throw new Error(`Invalid or unknown code: ${hard}`);
    }

    const { ss, xs, fs, ls } = sizage;
    const cs = hs + ss;

    // Extract soft part
    let soft = '';
    if (ss > 0) {
      soft = qb64str.slice(hs, hs + ss);
      // Remove xtra padding
      soft = soft.slice(xs);
    }

    // Calculate full size
    let fullSize: number;
    if (fs !== null) {
      fullSize = fs;
    } else {
      const size = b64ToInt(soft);
      fullSize = cs + (size * 4);
    }

    // Validate we have enough characters
    if (qb64str.length < fullSize) {
      throw new Error(
        `Insufficient material: need ${fullSize} chars, got ${qb64str.length}`
      );
    }

    // Decode raw
    const ps = cs % 4; // Pad size
    const base = 'A'.repeat(ps) + qb64str.slice(cs, fullSize);
    const paw = decodeB64(base);

    // Extract raw (remove pre-pad and lead)
    const raw = paw.slice(ps + ls);

    // Validate midpad bytes are zero
    const midpad = paw.slice(0, ps + ls);
    if (!isAllZeros(midpad)) {
      throw new Error('Nonzero midpad bytes detected');
    }

    this._code = hard;
    this._soft = soft;
    this._raw = raw;
  }

  /**
   * Decode from qb2 format (internal)
   */
  protected _bexfil(qb2: Uint8Array): void {
    if (qb2.length === 0) {
      throw new Error('Empty qualified base2 bytes');
    }

    // Extract first sextet
    const first = nabSextets(qb2, 1);
    const hs = Hards.get(first[0]);

    if (hs === undefined) {
      throw new Error(`Invalid first sextet: ${first}`);
    }

    // Extract code
    const hard = codeB2ToB64(qb2, hs);
    const sizage = Sizes.get(hard);

    if (!sizage) {
      throw new Error(`Invalid or unknown code: ${hard}`);
    }

    const { ss, xs, fs, ls } = sizage;
    const cs = hs + ss;

    // Extract both parts
    const both = codeB2ToB64(qb2, cs);
    let soft = '';
    if (ss > 0) {
      soft = both.slice(hs + xs);
    }

    // Calculate sizes
    const bcs = sceil(cs * 3 / 4); // Binary code size
    let fullSize: number;
    let bfs: number; // Binary full size

    if (fs !== null) {
      fullSize = fs;
      bfs = sceil(fs * 3 / 4);
    } else {
      const size = b64ToInt(soft);
      fullSize = cs + (size * 4);
      bfs = sceil(fullSize * 3 / 4);
    }

    // Validate we have enough bytes
    if (qb2.length < bfs) {
      throw new Error(
        `Insufficient material: need ${bfs} bytes, got ${qb2.length}`
      );
    }

    // Validate midpad bits are zero
    const ps = cs % 4;
    const pbs = 2 * ps; // Midpad bits

    if (pbs > 0 && bcs > 0) {
      const lastCodeByte = qb2[bcs - 1];
      const midpadBits = lastCodeByte & ((1 << pbs) - 1);
      if (midpadBits !== 0) {
        throw new Error('Nonzero midpad bits detected');
      }
    }

    // Extract raw (skip binary code and lead bytes)
    const raw = qb2.slice(bcs + ls, bfs);

    this._code = hard;
    this._soft = soft;
    this._raw = raw;
  }

  /**
   * Compare this Matter with another
   */
  equals(other: Matter): boolean {
    if (this._code !== other._code) return false;
    if (this._soft !== other._soft) return false;
    if (this._raw.length !== other._raw.length) return false;

    for (let i = 0; i < this._raw.length; i++) {
      if (this._raw[i] !== other._raw[i]) return false;
    }

    return true;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.qb64;
  }
}
