/**
 * Test CESR encoding variants (binary vs text)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { DiskKv } from '../../src/storage/adapters/disk';
import type { StorageKey } from '../../src/storage/types';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('CESR Encoding Variants', () => {
  const TEST_DIR = path.join('target', 'test-cesr-encoding');
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

  it('should create binary CESR files with .binary.cesr extension', async () => {
    const key: StorageKey = {
      path: ['kel', 'EAID123', 'ESAID456'],
      type: 'cesr',
      meta: {
        eventType: 'icp',
        cesrEncoding: 'binary',
        immutable: true
      }
    };

    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    await kv.putStructured(key, data);

    // Check file exists with proper extension
    const expectedPath = path.join(TEST_DIR, 'kel', 'EAID123', 'ESAID456.icp.binary.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content is raw binary
    const fileContent = await fs.readFile(expectedPath);
    expect(new Uint8Array(fileContent)).toEqual(data);

    // Verify retrieval
    const retrieved = await kv.getStructured(key);
    expect(retrieved).toEqual(data);
  });

  it('should create text CESR files with .text.cesr extension', async () => {
    const key: StorageKey = {
      path: ['kel', 'EAID123', 'ESAID789'],
      type: 'cesr',
      meta: {
        eventType: 'rot',
        cesrEncoding: 'text',
        immutable: true
      }
    };

    const data = new TextEncoder().encode('-FABAA...');
    await kv.putStructured(key, data);

    // Check file exists with proper extension
    const expectedPath = path.join(TEST_DIR, 'kel', 'EAID123', 'ESAID789.rot.text.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify content is text
    const fileContent = await fs.readFile(expectedPath, 'utf-8');
    expect(fileContent).toBe('-FABAA...');

    // Verify retrieval
    const retrieved = await kv.getStructured(key);
    expect(new TextDecoder().decode(retrieved!)).toBe('-FABAA...');
  });

  it('should default to binary encoding when not specified', async () => {
    const key: StorageKey = {
      path: ['kel', 'EAID123', 'ESAID999'],
      type: 'cesr',
      meta: {
        eventType: 'ixn',
        immutable: true
        // cesrEncoding not specified
      }
    };

    const data = new Uint8Array([0xFF, 0xFE]);
    await kv.putStructured(key, data);

    // Should default to binary
    const expectedPath = path.join(TEST_DIR, 'kel', 'EAID123', 'ESAID999.ixn.binary.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should handle TEL events with binary encoding', async () => {
    const key: StorageKey = {
      path: ['tel', 'EREG456', 'ESAID111'],
      type: 'cesr',
      meta: {
        eventType: 'vcp',
        cesrEncoding: 'binary',
        immutable: true
      }
    };

    const data = new Uint8Array([0xAA, 0xBB, 0xCC]);
    await kv.putStructured(key, data);

    const expectedPath = path.join(TEST_DIR, 'tel', 'EREG456', 'ESAID111.vcp.binary.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should handle TEL events with text encoding', async () => {
    const key: StorageKey = {
      path: ['tel', 'EREG456', 'ESAID222'],
      type: 'cesr',
      meta: {
        eventType: 'iss',
        cesrEncoding: 'text',
        immutable: true
      }
    };

    const data = new TextEncoder().encode('-IAB...');
    await kv.putStructured(key, data);

    const expectedPath = path.join(TEST_DIR, 'tel', 'EREG456', 'ESAID222.iss.text.cesr');
    const exists = await fs.stat(expectedPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should parse encoding from filename when listing', async () => {
    // Create files with different encodings
    await kv.putStructured({
      path: ['kel', 'EAID1', 'ESAID1'],
      type: 'cesr',
      meta: { eventType: 'icp', cesrEncoding: 'binary' }
    }, new Uint8Array([1]));

    await kv.putStructured({
      path: ['kel', 'EAID1', 'ESAID2'],
      type: 'cesr',
      meta: { eventType: 'rot', cesrEncoding: 'text' }
    }, new TextEncoder().encode('text'));

    // List all kel keys
    const results = await kv.listStructured({ path: ['kel'] }, { keysOnly: true });

    expect(results.length).toBe(2);

    const binaryKey = results.find(r => r.key.path[2] === 'ESAID1');
    expect(binaryKey?.key.meta?.cesrEncoding).toBe('binary');
    expect(binaryKey?.key.meta?.eventType).toBe('icp');

    const textKey = results.find(r => r.key.path[2] === 'ESAID2');
    expect(textKey?.key.meta?.cesrEncoding).toBe('text');
    expect(textKey?.key.meta?.eventType).toBe('rot');
  });

  it('should maintain encoding through round-trip', async () => {
    const originalKey: StorageKey = {
      path: ['kel', 'EAID_TEST', 'ESAID_TEST'],
      type: 'cesr',
      meta: {
        eventType: 'icp',
        cesrEncoding: 'text',
        immutable: true
      }
    };

    const data = new TextEncoder().encode('test-data');
    await kv.putStructured(originalKey, data);

    // List and verify the key is parsed correctly
    const results = await kv.listStructured({ path: ['kel'] }, { keysOnly: true });
    expect(results.length).toBe(1);

    const parsedKey = results[0].key;
    expect(parsedKey.path).toEqual(originalKey.path);
    expect(parsedKey.type).toBe('cesr');
    expect(parsedKey.meta?.eventType).toBe('icp');
    expect(parsedKey.meta?.cesrEncoding).toBe('text');
  });
});
