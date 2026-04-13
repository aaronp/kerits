import { describe, expect, it } from 'bun:test';
import { canonical } from './canonical.js';

describe('canonical', () => {
  it('produces deterministic output for simple objects', () => {
    const result = canonical({ b: 2, a: 1 });
    // RFC8785: keys sorted lexicographically
    expect(result).toBe('{"a":1,"b":2}');
  });

  it('handles nested objects', () => {
    const result = canonical({ z: { y: 1, x: 2 }, a: 0 });
    expect(result).toBe('{"a":0,"z":{"x":2,"y":1}}');
  });

  it('handles arrays', () => {
    const result = canonical([3, 1, 2]);
    expect(result).toBe('[3,1,2]');
  });

  it('handles null', () => {
    expect(canonical(null)).toBe('null');
  });

  it('handles strings', () => {
    expect(canonical('hello')).toBe('"hello"');
  });

  it('handles numbers', () => {
    expect(canonical(42)).toBe('42');
  });

  it('produces same output for same input regardless of property insertion order', () => {
    const a = canonical({ a: 1, b: 2 });
    const b = canonical({ b: 2, a: 1 });
    expect(a).toBe(b);
  });
});
