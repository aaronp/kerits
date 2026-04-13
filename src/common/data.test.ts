import { describe, expect, it } from 'bun:test';
import { Data, SAID_PLACEHOLDER, saidOf, schemaSaidOf } from './data.js';

describe('SAID_PLACEHOLDER', () => {
  it('is 44 characters long', () => {
    expect(SAID_PLACEHOLDER.length).toBe(44);
    expect(SAID_PLACEHOLDER).toBe('#'.repeat(44));
  });
});

describe('Data.fromJson / toJson', () => {
  it('round-trips a plain object', () => {
    const obj = { a: 1, b: 'hello' };
    const data = Data.fromJson(obj);
    expect(data.toJson()).toEqual(obj);
  });

  it('deep-clones on fromJson', () => {
    const obj = { a: 1 };
    const data = Data.fromJson(obj);
    obj.a = 999;
    expect(data.toJson()).toEqual({ a: 1 });
  });
});

describe('Data.canonicalize', () => {
  it('returns deterministic bytes and text', () => {
    const data = Data.fromJson({ b: 2, a: 1 });
    const { text, raw } = data.canonicalize();
    expect(text).toBe('{"a":1,"b":2}');
    expect(raw).toEqual(new TextEncoder().encode('{"a":1,"b":2}'));
  });
});

describe('Data.saidify', () => {
  it('returns a 44-char SAID starting with E', () => {
    const data = Data.fromJson({ name: 'test' });
    const { said, data: result } = data.saidify();
    expect(said.length).toBe(44);
    expect(said[0]).toBe('E');
    expect(result.d).toBe(said);
  });

  it('uses custom field name', () => {
    const data = Data.fromJson({ name: 'test' });
    const { said, data: result } = data.saidify('i');
    expect(result.i).toBe(said);
  });

  it('produces stable SAID for same input', () => {
    const obj = { x: 42 };
    const { said: s1 } = Data.fromJson(obj).saidify();
    const { said: s2 } = Data.fromJson(obj).saidify();
    expect(s1).toBe(s2);
  });

  it('produces different SAIDs for different inputs', () => {
    const { said: s1 } = Data.fromJson({ x: 1 }).saidify();
    const { said: s2 } = Data.fromJson({ x: 2 }).saidify();
    expect(s1).not.toBe(s2);
  });
});

describe('Data.digest', () => {
  it('returns a 44-char CESR digest starting with E', () => {
    const raw = new TextEncoder().encode('hello');
    const digest = Data.digest(raw);
    expect(digest.length).toBe(44);
    expect(digest[0]).toBe('E');
  });
});

describe('Data.digestFor', () => {
  it('digests a JSON object', () => {
    const digest = Data.digestFor({ a: 1 });
    expect(digest.length).toBe(44);
    expect(digest[0]).toBe('E');
  });

  it('is stable', () => {
    expect(Data.digestFor({ a: 1 })).toBe(Data.digestFor({ a: 1 }));
  });
});

describe('Data.computeVersionString', () => {
  it('returns a KERI version string', () => {
    const v = Data.computeVersionString({ t: 'icp', i: 'A'.repeat(44) });
    expect(v).toMatch(/^KERI10JSON\d{6}_$/);
  });

  it('supports custom protocol', () => {
    const v = Data.computeVersionString({ t: 'icp' }, 'JSON', 'ACDC');
    expect(v).toMatch(/^ACDC10JSON\d{6}_$/);
  });
});

describe('saidOf', () => {
  it('generates a SAID for an object', () => {
    const said = saidOf({ name: 'test' });
    expect(said.length).toBe(44);
    expect(said[0]).toBe('E');
  });
});

describe('schemaSaidOf', () => {
  it('generates a SAID for a schema object', () => {
    const schema = { type: 'object', properties: { name: { type: 'string' } } };
    const said = schemaSaidOf(schema);
    expect(said.length).toBe(44);
    expect(said[0]).toBe('E');
  });
});

describe('inferSchema', () => {
  it('infers a schema that accepts the original value and rejects wrong types', async () => {
    const { inferSchema } = await import('./data.js');
    const { Value } = await import('@sinclair/typebox/value');

    const example = {
      name: 'Alice',
      age: 30,
      active: true,
      scores: [1, 2, 3],
      address: { city: 'Berlin', zip: '10115' },
    };

    const schema = await inferSchema(example);

    // Original value must pass
    expect(Value.Check(schema, example)).toBe(true);

    // Wrong type on a field must fail
    expect(Value.Check(schema, { ...example, age: 'not-a-number' })).toBe(false);
  });
});

describe('createSaidMessageType', () => {
  it('returns a SAID-prefixed message type string derived from the example shape', async () => {
    const { createSaidMessageType } = await import('./data.js');

    const msgType = await createSaidMessageType({ name: 'Alice', age: 30 });

    // Must be a string in the form 'SAID:<44-char CESR digest>'
    expect(typeof msgType).toBe('string');
    expect(msgType.startsWith('SAID:')).toBe(true);
    const saidPart = msgType.slice('SAID:'.length);
    expect(saidPart.length).toBe(44);
    expect(saidPart[0]).toBe('E');

    // Same example must produce the same message type (deterministic)
    const msgType2 = await createSaidMessageType({ name: 'Alice', age: 30 });
    expect(msgType).toBe(msgType2);

    // Different shape must produce a different message type
    const msgTypeOther = await createSaidMessageType({ name: 'Alice', age: 30, extra: true });
    expect(msgType).not.toBe(msgTypeOther);
  });
});
