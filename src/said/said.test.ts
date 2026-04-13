import { describe, expect, it } from 'bun:test';
import { encodeSAID, saidFromJson, validateSAID } from './said.js';

describe('encodeSAID', () => {
  it('should compute a SAID for a simple object', () => {
    const obj = { d: '', hello: 'world' };
    const said = encodeSAID(obj);
    expect(typeof said).toBe('string');
    expect(said.length).toBeGreaterThan(10);
    // CESR Blake3-256 digests start with 'E'
    expect(said.startsWith('E')).toBe(true);
  });

  it('should produce deterministic results', () => {
    const obj = { d: '', hello: 'world' };
    const said1 = encodeSAID(obj);
    const said2 = encodeSAID(obj);
    expect(said1).toBe(said2);
  });
});

describe('validateSAID', () => {
  it('should validate a correct SAID', () => {
    const obj = { d: '', hello: 'world' };
    const said = encodeSAID(obj);
    const objWithSaid = { ...obj, d: said };
    expect(validateSAID(said, objWithSaid)).toBe(true);
  });

  it('should reject an incorrect SAID', () => {
    const obj = { d: '', hello: 'world' };
    const said = encodeSAID(obj);
    const tampered = { d: said, hello: 'tampered' };
    expect(validateSAID(said, tampered)).toBe(false);
  });

  it('should return false for invalid SAID strings', () => {
    expect(validateSAID('not-a-said', { d: 'not-a-said' })).toBe(false);
  });
});

describe('saidFromJson', () => {
  it('should return a qb64 SAID string', () => {
    const obj = { foo: 'bar', num: 42 };
    const said = saidFromJson(obj);
    expect(typeof said).toBe('string');
    expect(said.length).toBeGreaterThan(10);
    // CESR Blake3-256 digests start with 'E'
    expect(said.startsWith('E')).toBe(true);
  });

  it('should return the same SAID for the same object', () => {
    const obj = { a: 1, b: 2 };
    const said1 = saidFromJson(obj);
    const said2 = saidFromJson(obj);
    expect(said1).toBe(said2);
  });

  it('should return different SAIDs for different objects', () => {
    const said1 = saidFromJson({ x: 1 });
    const said2 = saidFromJson({ x: 2 });
    expect(said1).not.toBe(said2);
  });

  it('should canonicalize key order', () => {
    const said1 = saidFromJson({ b: 2, a: 1 });
    const said2 = saidFromJson({ a: 1, b: 2 });
    expect(said1).toBe(said2);
  });
});
