/**
 * Tests for DiskKv - On-disk storage adapter
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { DiskKv } from '../../src/storage/adapters/disk';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join('/tmp', 'kerits-test-disk-kv');

describe('DiskKv', () => {
  let kv: DiskKv;

  beforeEach(async () => {
    // Clean up test directory
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }

    kv = new DiskKv({ baseDir: TEST_DIR });
  });

  afterEach(async () => {
    // Clean up after tests
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('should create base directory on initialization', () => {
    expect(fs.existsSync(TEST_DIR)).toBe(true);
    expect(fs.statSync(TEST_DIR).isDirectory()).toBe(true);
  });

  it('should store and retrieve values', async () => {
    const key = 'test/key';
    const value = new Uint8Array([1, 2, 3, 4]);

    await kv.put(key, value);
    const retrieved = await kv.get(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent key', async () => {
    const value = await kv.get('non-existent');
    expect(value).toBeNull();
  });

  it('should delete keys', async () => {
    const key = 'test/delete';
    const value = new Uint8Array([5, 6, 7]);

    await kv.put(key, value);
    expect(await kv.get(key)).toEqual(value);

    await kv.del(key);
    expect(await kv.get(key)).toBeNull();
  });

  it('should handle special characters in keys', async () => {
    const specialKeys = [
      'test:key',
      'test*key',
      'test?key',
      'test|key',
      'test<key>',
      'test"key',
      'test%key',
    ];

    for (const key of specialKeys) {
      const value = new TextEncoder().encode(key);
      await kv.put(key, value);
      const retrieved = await kv.get(key);
      expect(retrieved).toEqual(value);
    }
  });

  it('should list keys with prefix', async () => {
    await kv.put('prefix/a', new Uint8Array([1]));
    await kv.put('prefix/b', new Uint8Array([2]));
    await kv.put('prefix/c', new Uint8Array([3]));
    await kv.put('other/d', new Uint8Array([4]));

    const results = await kv.list('prefix/', { keysOnly: true });
    const keys = results.map(r => r.key).sort();

    expect(keys).toEqual(['prefix/a', 'prefix/b', 'prefix/c']);
  });

  it('should list keys with values', async () => {
    await kv.put('test/1', new Uint8Array([1]));
    await kv.put('test/2', new Uint8Array([2]));

    const results = await kv.list('test/', { keysOnly: false });
    const sorted = results.sort((a, b) => a.key.localeCompare(b.key));

    expect(sorted).toHaveLength(2);
    expect(sorted[0].key).toBe('test/1');
    expect(sorted[0].value).toEqual(new Uint8Array([1]));
    expect(sorted[1].key).toBe('test/2');
    expect(sorted[1].value).toEqual(new Uint8Array([2]));
  });

  it('should respect list limit', async () => {
    await kv.put('item/1', new Uint8Array([1]));
    await kv.put('item/2', new Uint8Array([2]));
    await kv.put('item/3', new Uint8Array([3]));
    await kv.put('item/4', new Uint8Array([4]));

    const results = await kv.list('item/', { keysOnly: true, limit: 2 });
    expect(results).toHaveLength(2);
  });

  it('should support batch operations', async () => {
    await kv.batch([
      { type: 'put', key: 'batch/a', value: new Uint8Array([1]) },
      { type: 'put', key: 'batch/b', value: new Uint8Array([2]) },
      { type: 'put', key: 'batch/c', value: new Uint8Array([3]) },
    ]);

    expect(await kv.get('batch/a')).toEqual(new Uint8Array([1]));
    expect(await kv.get('batch/b')).toEqual(new Uint8Array([2]));
    expect(await kv.get('batch/c')).toEqual(new Uint8Array([3]));

    await kv.batch([
      { type: 'del', key: 'batch/a' },
      { type: 'del', key: 'batch/c' },
    ]);

    expect(await kv.get('batch/a')).toBeNull();
    expect(await kv.get('batch/b')).toEqual(new Uint8Array([2]));
    expect(await kv.get('batch/c')).toBeNull();
  });

  it('should return correct size', async () => {
    expect(await kv.size()).toBe(0);

    await kv.put('a', new Uint8Array([1]));
    expect(await kv.size()).toBe(1);

    await kv.put('b', new Uint8Array([2]));
    expect(await kv.size()).toBe(2);

    await kv.del('a');
    expect(await kv.size()).toBe(1);
  });

  it('should clear all data', async () => {
    await kv.put('test/1', new Uint8Array([1]));
    await kv.put('test/2', new Uint8Array([2]));
    await kv.put('other/3', new Uint8Array([3]));

    expect(await kv.size()).toBe(3);

    await kv.clear();

    expect(await kv.size()).toBe(0);
    expect(await kv.get('test/1')).toBeNull();
    expect(await kv.get('test/2')).toBeNull();
    expect(await kv.get('other/3')).toBeNull();
  });

  it('should list all keys', async () => {
    await kv.put('z', new Uint8Array([1]));
    await kv.put('a', new Uint8Array([2]));
    await kv.put('m', new Uint8Array([3]));

    const keys = await kv.keys();
    expect(keys).toEqual(['a', 'm', 'z']); // Should be sorted
  });

  it('should persist data across instances', async () => {
    // Create first instance and store data
    const kv1 = new DiskKv({ baseDir: TEST_DIR });
    await kv1.put('persistent', new Uint8Array([42]));

    // Create second instance pointing to same directory
    const kv2 = new DiskKv({ baseDir: TEST_DIR });
    const value = await kv2.get('persistent');

    expect(value).toEqual(new Uint8Array([42]));
  });

  it('should handle nested key hierarchies', async () => {
    await kv.put('a/b/c/d', new Uint8Array([1]));
    await kv.put('a/b/c/e', new Uint8Array([2]));
    await kv.put('a/b/f', new Uint8Array([3]));

    const results = await kv.list('a/b/c/', { keysOnly: true });
    const keys = results.map(r => r.key).sort();

    expect(keys).toEqual(['a/b/c/d', 'a/b/c/e']);
  });

  it('should handle overwriting existing keys', async () => {
    await kv.put('overwrite', new Uint8Array([1, 2, 3]));
    expect(await kv.get('overwrite')).toEqual(new Uint8Array([1, 2, 3]));

    await kv.put('overwrite', new Uint8Array([4, 5, 6]));
    expect(await kv.get('overwrite')).toEqual(new Uint8Array([4, 5, 6]));
  });

  it('should handle empty values', async () => {
    await kv.put('empty', new Uint8Array([]));
    const value = await kv.get('empty');

    expect(value).toEqual(new Uint8Array([]));
    expect(value?.length).toBe(0);
  });

  it('should not throw when deleting non-existent key', async () => {
    await expect(kv.del('does-not-exist')).resolves.toBeUndefined();
  });
});

describe('DiskKv vs MemoryKv compatibility', () => {
  it('should have same interface as MemoryKv', async () => {
    const diskKv = new DiskKv({ baseDir: TEST_DIR });

    // Check all required methods exist
    expect(typeof diskKv.get).toBe('function');
    expect(typeof diskKv.put).toBe('function');
    expect(typeof diskKv.del).toBe('function');
    expect(typeof diskKv.list).toBe('function');
    expect(typeof diskKv.batch).toBe('function');

    // Clean up
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });
});
