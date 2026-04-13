import { describe, expect, it } from 'bun:test';
import type { Brand, BrandValidator } from './brand.js';

describe('Brand', () => {
  it('allows casting a string to a branded type', () => {
    type MyId = Brand<'MyId'>;
    const id = 'abc' as MyId;
    expect(id).toBe('abc');
  });

  it('supports branded number type', () => {
    type Count = Brand<'Count', number>;
    const n = 42 as Count;
    expect(n).toBe(42);
  });
});

describe('BrandValidator', () => {
  it('accepts a validator function signature', () => {
    type MyId = Brand<'MyId'>;
    const validate: BrandValidator<MyId> = (input: string) => {
      if (input.length === 0) throw new Error('empty');
      return input as MyId;
    };
    expect(validate('hello')).toBe('hello');
  });
});
