/**
 * Tests for KerStore - Modern storage layer
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { DiskKv } from '../../src/storage/adapters/disk';
import type { KerStore } from '../../src/storage/types';
import * as path from 'path';
import * as fs from 'fs/promises';

// Import test helpers
import { createTestInception, createTestRegistryInception, createTestKelWithRegistry } from '../helpers/events';

describe('KerStore', () => {
  const TEST_DIR = path.join('target', 'test-kerstore2');
  let store: KerStore;

  beforeEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (e) {
      // Directory doesn't exist, that's fine
    }

    const kv = new DiskKv({ baseDir: TEST_DIR });
    store = createKerStore(kv, { defaultEncoding: 'binary' });
  });

  describe('Event Storage', () => {
    it('should store and retrieve KEL events with binary encoding', async () => {
      // Create inception event
      const { sad, raw } = createTestInception('1');

      // Store event
      const result = await store.putKelEvent(raw, 'binary');

      expect(result.said).toBe(sad.d);
      expect(result.meta.t).toBe('icp');
      expect(result.meta.i).toBe(sad.i);

      // Verify file structure
      const eventPath = path.join(TEST_DIR, 'kel', sad.i, `${sad.d}.icp.binary.cesr`);
      const metaPath = path.join(TEST_DIR, 'meta', `${sad.d}.json`);

      const eventExists = await fs.stat(eventPath).then(() => true).catch(() => false);
      const metaExists = await fs.stat(metaPath).then(() => true).catch(() => false);

      expect(eventExists).toBe(true);
      expect(metaExists).toBe(true);

      // Retrieve event
      const retrieved = await store.getEvent(sad.d);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.meta.t).toBe('icp');
      expect(retrieved!.meta.i).toBe(sad.i);
    });

    it('should store and retrieve TEL events', async () => {
      // First create a KEL event
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      // Create TEL registry
      const { sad: vcpSad, raw: vcpRaw } = createTestRegistryInception(icp.i);
      const result = await store.putTelEvent(vcpRaw, 'binary');

      expect(result.said).toBe(vcpSad.d);
      expect(result.meta.t).toBe('vcp');
      expect(result.meta.ri).toBe(vcpSad.ri);

      // Verify file structure
      const eventPath = path.join(TEST_DIR, 'tel', vcpSad.ri, `${vcpSad.d}.vcp.binary.cesr`);
      const exists = await fs.stat(eventPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should support text encoding', async () => {
      const { sad, raw } = createTestInception('2');

      await store.putKelEvent(raw, 'text');

      // Verify text encoding in filename
      const eventPath = path.join(TEST_DIR, 'kel', sad.i, `${sad.d}.icp.text.cesr`);
      const exists = await fs.stat(eventPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('HEAD Tracking', () => {
    it('should track KEL HEAD', async () => {
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      // HEAD should be updated automatically
      const head = await store.getKelHead(icp.i);
      expect(head).toBe(icp.d);

      // Verify HEAD file
      const headPath = path.join(TEST_DIR, 'head', 'kel', icp.i);
      const exists = await fs.stat(headPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      const headContent = await fs.readFile(headPath, 'utf-8');
      expect(headContent).toBe(icp.d);
    });

    it('should track TEL HEAD', async () => {
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      const { sad: vcpSad, raw: vcpRaw } = createTestRegistryInception(icp.i);
      await store.putTelEvent(vcpRaw);

      const head = await store.getTelHead(vcpSad.ri);
      expect(head).toBe(vcpSad.d);

      // Verify HEAD file
      const headPath = path.join(TEST_DIR, 'head', 'tel', vcpSad.ri);
      const exists = await fs.stat(headPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });
  });

  describe('KEL Operations', () => {
    it('should list KEL events in order', async () => {
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      // TODO: Add rotation events once we have rotation helper

      const events = await store.listKel(icp.i);
      expect(events.length).toBe(1);
      expect(events[0].meta.t).toBe('icp');
      expect(events[0].meta.s).toBe('0');
    });
  });

  describe('TEL Operations', () => {
    it('should list TEL events', async () => {
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      const { sad: vcpSad, raw: vcpRaw } = createTestRegistryInception(icp.i);
      await store.putTelEvent(vcpRaw);

      const events = await store.listTel(vcpSad.ri);
      expect(events.length).toBe(1);
      expect(events[0].meta.t).toBe('vcp');
    });
  });

  describe('ACDC Operations', () => {
    it('should store and retrieve ACDCs by SAID', async () => {
      const acdc = {
        v: 'ACDC10JSON',
        d: 'EACDC123',
        i: 'EISSUER456',
        s: 'ESCHEMA789',
        a: {
          name: 'Alice',
          age: 30
        }
      };

      const said = await store.putACDC(acdc);
      expect(said).toBe('EACDC123');

      // Verify file
      const acdcPath = path.join(TEST_DIR, 'acdc', `${said}.json`);
      const exists = await fs.stat(acdcPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Retrieve
      const retrieved = await store.getACDC(said);
      expect(retrieved).toEqual(acdc);
    });
  });

  describe('Schema Operations', () => {
    it('should store and retrieve schemas by SAID', async () => {
      const schema = {
        $id: 'ESCHEMA123',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        }
      };

      const said = await store.putSchema(schema);
      expect(said).toBe('ESCHEMA123');

      // Verify file
      const schemaPath = path.join(TEST_DIR, 'schema', `${said}.json`);
      const exists = await fs.stat(schemaPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Retrieve
      const retrieved = await store.getSchema(said);
      expect(retrieved).toEqual(schema);
    });
  });

  describe('Alias Operations', () => {
    it('should store and retrieve aliases', async () => {
      const said = 'EAID123';
      const alias = 'alice';

      await store.putAlias('kel', said, alias);

      // Verify forward mapping
      const retrievedSaid = await store.getAliasSaid('kel', alias);
      expect(retrievedSaid).toBe(said);

      // Verify reverse mapping
      const retrievedAlias = await store.getSaidAlias('kel', said);
      expect(retrievedAlias).toBe(alias);

      // Verify files
      const aliasPath = path.join(TEST_DIR, 'alias', 'kel', alias);
      const reversePath = path.join(TEST_DIR, 'alias', 'kel', '_reverse', said);

      const aliasExists = await fs.stat(aliasPath).then(() => true).catch(() => false);
      const reverseExists = await fs.stat(reversePath).then(() => true).catch(() => false);

      expect(aliasExists).toBe(true);
      expect(reverseExists).toBe(true);
    });

    it('should list aliases', async () => {
      await store.putAlias('kel', 'EAID1', 'alice');
      await store.putAlias('kel', 'EAID2', 'bob');
      await store.putAlias('kel', 'EAID3', 'charlie');

      const aliases = await store.listAliases('kel');
      expect(aliases).toEqual(['alice', 'bob', 'charlie']);
    });

    it('should delete aliases', async () => {
      const said = 'EAID123';
      const alias = 'alice';

      await store.putAlias('kel', said, alias);
      expect(await store.getAliasSaid('kel', alias)).toBe(said);

      await store.delAlias('kel', alias);
      expect(await store.getAliasSaid('kel', alias)).toBeNull();
      expect(await store.getSaidAlias('kel', said)).toBeNull();
    });

    it('should support different scopes', async () => {
      await store.putAlias('kel', 'EAID1', 'alice');
      await store.putAlias('tel', 'EREG1', 'credentials');
      await store.putAlias('schema', 'ESCHEMA1', 'person');
      await store.putAlias('acdc', 'EACDC1', 'my-credential');

      expect(await store.getAliasSaid('kel', 'alice')).toBe('EAID1');
      expect(await store.getAliasSaid('tel', 'credentials')).toBe('EREG1');
      expect(await store.getAliasSaid('schema', 'person')).toBe('ESCHEMA1');
      expect(await store.getAliasSaid('acdc', 'my-credential')).toBe('EACDC1');
    });
  });

  describe('File Structure', () => {
    it('should create proper directory hierarchy', async () => {
      // Create various entities
      const { sad: icp, raw: icpRaw } = createTestInception();
      await store.putKelEvent(icpRaw);

      const { sad: vcpSad, raw: vcpRaw } = createTestRegistryInception(icp.i);
      await store.putTelEvent(vcpRaw);

      await store.putACDC({ d: 'EACDC1', v: 'ACDC10JSON' });
      await store.putSchema({ $id: 'ESCHEMA1' });
      await store.putAlias('kel', icp.i, 'alice');

      // Verify directory structure
      const dirs = await fs.readdir(TEST_DIR);
      expect(dirs).toContain('kel');
      expect(dirs).toContain('tel');
      expect(dirs).toContain('acdc');
      expect(dirs).toContain('schema');
      expect(dirs).toContain('meta');
      expect(dirs).toContain('head');
      expect(dirs).toContain('alias');
      expect(dirs).toContain('idx');
    });
  });
});
