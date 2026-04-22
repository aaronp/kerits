import { describe, expect, test } from 'bun:test';
import { serializeInsertionOrder, type JsonValue } from './serialize-insertion-order.js';

describe('serializeInsertionOrder', () => {
  // --- Key order preservation ---

  test('preserves top-level key order', () => {
    const obj = { z: 1, a: 2, m: 3 } as JsonValue;
    expect(serializeInsertionOrder(obj)).toBe('{"z":1,"a":2,"m":3}');
  });

  test('preserves nested object key order recursively', () => {
    const obj = { b: { z: 1, a: 2 }, a: { y: 3, x: 4 } } as JsonValue;
    expect(serializeInsertionOrder(obj)).toBe('{"b":{"z":1,"a":2},"a":{"y":3,"x":4}}');
  });

  test('same logical object with different insertion order produces different bytes', () => {
    const a = { x: 1, y: 2 } as JsonValue;
    const b = { y: 2, x: 1 } as JsonValue;
    expect(serializeInsertionOrder(a)).not.toBe(serializeInsertionOrder(b));
  });

  // --- Arrays ---

  test('arrays preserved in index order', () => {
    expect(serializeInsertionOrder([3, 1, 2])).toBe('[3,1,2]');
  });

  test('arrays with mixed types', () => {
    const arr = [1, 'two', true, null, { a: 3 }] as JsonValue;
    expect(serializeInsertionOrder(arr)).toBe('[1,"two",true,null,{"a":3}]');
  });

  // --- Compact JSON ---

  test('compact JSON, no whitespace', () => {
    const obj = { a: [1, 2], b: { c: 3 } } as JsonValue;
    const result = serializeInsertionOrder(obj);
    expect(result).not.toMatch(/\s/);
    expect(result).toBe('{"a":[1,2],"b":{"c":3}}');
  });

  // --- Primitives ---

  test('strings with escaping', () => {
    expect(serializeInsertionOrder('hello "world"')).toBe('"hello \\"world\\""');
    expect(serializeInsertionOrder('line\nnewline')).toBe('"line\\nnewline"');
    expect(serializeInsertionOrder('tab\there')).toBe('"tab\\there"');
    expect(serializeInsertionOrder('back\\slash')).toBe('"back\\\\slash"');
  });

  test('numbers', () => {
    expect(serializeInsertionOrder(42)).toBe('42');
    expect(serializeInsertionOrder(3.14)).toBe('3.14');
    expect(serializeInsertionOrder(0)).toBe('0');
    expect(serializeInsertionOrder(-1)).toBe('-1');
  });

  test('booleans', () => {
    expect(serializeInsertionOrder(true)).toBe('true');
    expect(serializeInsertionOrder(false)).toBe('false');
  });

  test('null', () => {
    expect(serializeInsertionOrder(null)).toBe('null');
  });

  // --- Empty containers ---

  test('empty object serializes to {}', () => {
    expect(serializeInsertionOrder({} as JsonValue)).toBe('{}');
  });

  test('empty array serializes to []', () => {
    expect(serializeInsertionOrder([])).toBe('[]');
  });

  // --- Strict rejection of non-JSON values ---

  test('throws on undefined at root', () => {
    expect(() => serializeInsertionOrder(undefined as any)).toThrow(TypeError);
  });

  test('throws on undefined as object property value', () => {
    expect(() => serializeInsertionOrder({ a: undefined } as any)).toThrow(TypeError);
  });

  test('throws on undefined as array element', () => {
    expect(() => serializeInsertionOrder([undefined] as any)).toThrow(TypeError);
  });

  test('throws on function', () => {
    expect(() => serializeInsertionOrder((() => {}) as any)).toThrow(TypeError);
  });

  test('throws on symbol', () => {
    expect(() => serializeInsertionOrder(Symbol('x') as any)).toThrow(TypeError);
  });

  test('throws on BigInt', () => {
    expect(() => serializeInsertionOrder(BigInt(42) as any)).toThrow(TypeError);
  });

  test('throws on NaN', () => {
    expect(() => serializeInsertionOrder(NaN as any)).toThrow(TypeError);
  });

  test('throws on Infinity', () => {
    expect(() => serializeInsertionOrder(Infinity as any)).toThrow(TypeError);
  });

  test('throws on -Infinity', () => {
    expect(() => serializeInsertionOrder(-Infinity as any)).toThrow(TypeError);
  });

  test('throws on non-plain object (Date)', () => {
    expect(() => serializeInsertionOrder(new Date() as any)).toThrow(TypeError);
  });

  test('throws on typed array', () => {
    expect(() => serializeInsertionOrder(new Uint8Array([1, 2]) as any)).toThrow(TypeError);
  });

  test('accepts null-prototype plain object', () => {
    const obj = Object.create(null);
    obj.z = 1;
    obj.a = 2;
    expect(serializeInsertionOrder(obj as any)).toBe('{"z":1,"a":2}');
  });
});
