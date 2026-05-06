import { describe, expect, test } from 'bun:test';
import { encodeBase64, decodeBase64 } from '../../common/base64.js';

describe('base64 codec', () => {
  test('round-trips arbitrary bytes', () => {
    const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const encoded = encodeBase64(input);
    const decoded = decodeBase64(encoded);
    expect(decoded).toEqual(input);
  });

  test('produces standard base64 with padding', () => {
    // 1 byte → 4 chars with padding
    const encoded = encodeBase64(new Uint8Array([255]));
    expect(encoded).toBe('/w==');
  });

  test('rejects base64url variants', () => {
    // base64url uses - and _ instead of + and /
    expect(() => decodeBase64('AQID-A')).toThrow();
    expect(() => decodeBase64('AQID_A')).toThrow();
  });

  test('rejects missing padding', () => {
    // '/w==' is correct; '/w' without padding should be rejected
    expect(() => decodeBase64('/w')).toThrow();
  });

  test('handles empty input', () => {
    expect(encodeBase64(new Uint8Array([]))).toBe('');
    expect(decodeBase64('')).toEqual(new Uint8Array([]));
  });
});
