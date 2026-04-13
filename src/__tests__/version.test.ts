import { describe, expect, it } from 'bun:test';
import { VERSION } from '../version.js';

describe('@kerits/core VERSION', () => {
  it('matches the bootstrap version', () => {
    expect(VERSION).toBe('0.2.29');
  });
});
