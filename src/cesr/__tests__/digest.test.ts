import { describe, expect, test } from 'bun:test';
import { TestKeys } from '../../keys/test-keys.js';
import { digestVerfer } from '../digest.js';

describe('digestVerfer', () => {
  test('next-key commitment equals keripy Diger(ser=verfer.qb64b)', () => {
    // setup: alice[1], whose keripy digest is n[0] of every alice inception in rotation-expected.json
    const key = TestKeys.iterator('alice').at(1).cesr;

    // call our method under test
    const digest = digestVerfer(key);

    // assertions: same key and digest as keripy 1.3.4
    expect(key).toBe('DI7RaWkGRhHCXnjysdVQXeEQ4euvcyCAh1kH8rEpHEEs');
    expect(digest).toBe('EGbgzK09e_katitXWHkL_iWViYKaA1WAyYQHFBdTTHfG');
  });
});
