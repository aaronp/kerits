import { describe, expect, it } from 'bun:test';
import { decodeBase64Url, encodeBase64Url } from './base64url.js';

describe('encodeBase64Url', () => {
  it('encodes bytes to base64url without padding', () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    expect(encodeBase64Url(bytes)).toBe('AQIDBA');
  });

  it('does not contain +, /, or = characters', () => {
    // Use bytes that would produce + or / in standard base64
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe]);
    const result = encodeBase64Url(bytes);
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });

  it('encodes empty bytes to empty string', () => {
    expect(encodeBase64Url(new Uint8Array([]))).toBe('');
  });
});

describe('decodeBase64Url', () => {
  it('decodes base64url to bytes', () => {
    const decoded = decodeBase64Url('AQIDBA');
    expect(decoded).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('round-trips encode/decode', () => {
    const original = new Uint8Array([0, 1, 2, 3, 255, 254, 253]);
    const encoded = encodeBase64Url(original);
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toEqual(original);
  });

  it('handles base64url with - and _ characters', () => {
    // 0xfb 0xff 0xfe → base64 "+//" → base64url "-__"
    const bytes = new Uint8Array([0xfb, 0xff, 0xfe]);
    const encoded = encodeBase64Url(bytes);
    expect(encoded).toContain('-');
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toEqual(bytes);
  });
});
