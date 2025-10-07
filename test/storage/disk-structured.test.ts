/**
 * Test structured keys with DiskKv
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { DiskKv } from '../../src/storage/adapters/disk';
import type { StorageKey } from '../../src/storage/types';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('DiskKv Structured Keys', () => {
  const TEST_DIR = path.join('target', 'test-structured-keys');
  let kv: DiskKv;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Directory doesn't exist, that's fine
    }

    kv = new DiskKv({ baseDir: TEST_DIR });
  });

  it('should create files with proper .cesr extension', async () => {
    const key: StorageKey = {
      path: ['kel', 'EAID123', 'ESAID456'],
      type: 'cesr',
      meta: { eventType: 'icp', immutable: true }
    };

    const data = new Uint8Array([1, 2, 3, 4]);
    await kv.putStructured(key, data);

    // Check file exists with proper extension
    const expectedPath = path.join(TEST_DIR, 'kel', 'EAID123', 'ESAID456.icp.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content
    const retrieved = await kv.getStructured(key);
    expect(retrieved).toEqual(data);
  });

  it('should create files with .json extension', async () => {
    const key: StorageKey = {
      path: ['acdc', 'EACDC789'],
      type: 'json',
      meta: { immutable: true }
    };

    const data = new TextEncoder().encode(JSON.stringify({ test: 'data' }));
    await kv.putStructured(key, data);

    // Check file exists
    const expectedPath = path.join(TEST_DIR, 'acdc', 'EACDC789.json');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content
    const retrieved = await kv.getStructured(key);
    expect(retrieved).toEqual(data);
  });

  it('should create text files without extension', async () => {
    const key: StorageKey = {
      path: ['head', 'kel', 'EAID123'],
      type: 'text'
    };

    const data = new TextEncoder().encode('ESAID456');
    await kv.putStructured(key, data);

    // Check file exists
    const expectedPath = path.join(TEST_DIR, 'head', 'kel', 'EAID123');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content
    const retrieved = await kv.getStructured(key);
    expect(retrieved).toEqual(data);
  });

  it('should handle different event types', async () => {
    const eventTypes: Array<'icp' | 'rot' | 'ixn' | 'vcp' | 'iss' | 'rev'> =
      ['icp', 'rot', 'ixn', 'vcp', 'iss', 'rev'];

    for (const eventType of eventTypes) {
      const key: StorageKey = {
        path: ['kel', 'EAID123', `ESAID_${eventType}`],
        type: 'cesr',
        meta: { eventType, immutable: true }
      };

      const data = new TextEncoder().encode(`event-${eventType}`);
      await kv.putStructured(key, data);

      // Check file has correct extension
      const expectedPath = path.join(TEST_DIR, 'kel', 'EAID123', `ESAID_${eventType}.${eventType}.cesr`);
      const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    }
  });

  it('should list structured keys', async () => {
    // Create multiple files
    const keys: StorageKey[] = [
      { path: ['kel', 'EAID1', 'ESAID1'], type: 'cesr', meta: { eventType: 'icp' } },
      { path: ['kel', 'EAID1', 'ESAID2'], type: 'cesr', meta: { eventType: 'rot' } },
      { path: ['kel', 'EAID2', 'ESAID3'], type: 'cesr', meta: { eventType: 'icp' } },
    ];

    for (const key of keys) {
      await kv.putStructured(key, new Uint8Array([1, 2, 3]));
    }

    // List all kel keys
    const prefix: StorageKey = { path: ['kel'] };
    const results = await kv.listStructured(prefix, { keysOnly: true });

    expect(results.length).toBe(3);
    expect(results[0].key.path).toEqual(['kel', 'EAID1', 'ESAID1']);
    expect(results[0].key.meta?.eventType).toBe('icp');
  });

  it('should delete structured keys', async () => {
    const key: StorageKey = {
      path: ['kel', 'EAID123', 'ESAID456'],
      type: 'cesr',
      meta: { eventType: 'icp' }
    };

    await kv.putStructured(key, new Uint8Array([1, 2, 3]));
    expect(await kv.getStructured(key)).not.toBeNull();

    await kv.delStructured(key);
    expect(await kv.getStructured(key)).toBeNull();
  });

  it('should handle alias paths', async () => {
    const key: StorageKey = {
      path: ['alias', 'kel', 'alice'],
      type: 'text'
    };

    const data = new TextEncoder().encode('EAID123');
    await kv.putStructured(key, data);

    const expectedPath = path.join(TEST_DIR, 'alias', 'kel', 'alice');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should handle hierarchical directory structure', async () => {
    // Create nested structure
    await kv.putStructured(
      { path: ['kel', 'EAID1', 'ESAID1'], type: 'cesr', meta: { eventType: 'icp' } },
      new Uint8Array([1])
    );
    await kv.putStructured(
      { path: ['tel', 'EREG1', 'ESAID2'], type: 'cesr', meta: { eventType: 'vcp' } },
      new Uint8Array([2])
    );
    await kv.putStructured(
      { path: ['acdc', 'EACDC1'], type: 'json' },
      new Uint8Array([3])
    );

    // Verify directory structure
    const kelDir = await fs.readdir(path.join(TEST_DIR, 'kel'));
    expect(kelDir).toContain('EAID1');

    const telDir = await fs.readdir(path.join(TEST_DIR, 'tel'));
    expect(telDir).toContain('EREG1');

    const acdcDir = await fs.readdir(path.join(TEST_DIR, 'acdc'));
    expect(acdcDir.some(f => f.startsWith('EACDC1'))).toBe(true);
  });
});
