/**
 * Tests for ACDC details extraction
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { extractACDCDetails } from '../../src/app/dsl/utils/acdc-details';
import type { KeritsDSL } from '../../src/app/dsl/types';

describe('ACDC Details Extraction', () => {
  let dsl: KeritsDSL;
  let accountAlias: string;

  beforeEach(async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    dsl = createKeritsDSL(store);
    accountAlias = 'test-account';

    // Create account
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    const mnemonic = dsl.newMnemonic(seed);
    await dsl.newAccount(accountAlias, mnemonic);
  });

  it('should extract CESR and JSON formats from credential', async () => {
    // Create registry and schema
    const accountDsl = await dsl.account(accountAlias);
    expect(accountDsl).not.toBeNull();

    const registryDsl = await accountDsl!.createRegistry('test-registry');
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      alias: 'test-cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: {
        name: 'Alice',
        age: 30,
      },
    });

    // Extract details
    const exportDsl = await acdcDsl.export();
    const details = await extractACDCDetails(exportDsl);

    // Verify CESR format
    expect(details.cesr).toBeTruthy();
    expect(details.cesr.length).toBeGreaterThan(0);
    expect(typeof details.cesr).toBe('string');

    // Verify JSON format (now shows decoded events)
    expect(details.json).toBeTruthy();
    expect(details.json.length).toBeGreaterThan(0);
    const parsed = JSON.parse(details.json);
    expect(parsed.acdc).toBeTruthy();
    expect(parsed.acdc.t).toBe('acdc');
    expect(parsed.issuance).toBeTruthy();
    expect(parsed.issuance.t).toBe('iss');
    expect(parsed.issuance.signatures).toBeInstanceOf(Array);
  });

  it('should extract public keys from credential signatures', async () => {
    // Create registry and schema
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        value: { type: 'string' },
      },
    });

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      alias: 'signed-cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { value: 'test' },
    });

    // Extract details
    const exportDsl = await acdcDsl.export();
    const details = await extractACDCDetails(exportDsl);

    // Verify public keys extracted
    expect(details.publicKeys).toBeInstanceOf(Array);
    expect(details.publicKeys.length).toBeGreaterThan(0);

    // Public keys should be KERI identifiers (44+ chars starting with letter)
    for (const key of details.publicKeys) {
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThanOrEqual(44);
      expect(/^[A-Z]/.test(key)).toBe(true);
    }
  });

  it('should extract signatures from credential', async () => {
    // Create registry and schema
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        data: { type: 'string' },
      },
    });

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      alias: 'sig-test',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { data: 'value' },
    });

    // Extract details
    const exportDsl = await acdcDsl.export();
    const details = await extractACDCDetails(exportDsl);

    // Verify signatures extracted
    expect(details.signatures).toBeInstanceOf(Array);
    expect(details.signatures.length).toBeGreaterThan(0);

    // Signatures should be base64-like strings
    for (const sig of details.signatures) {
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    }
  });

  it('should extract event data from credential', async () => {
    // Create registry and schema
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        field: { type: 'string' },
      },
    });

    // Issue credential
    const acdcDsl = await registryDsl.issue({
      alias: 'event-test',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { field: 'eventValue' },
    });

    // Extract details
    const exportDsl = await acdcDsl.export();
    const details = await extractACDCDetails(exportDsl);

    // Verify event data extracted
    expect(details.event).toBeTruthy();
    expect(typeof details.event).toBe('object');
    expect(details.event.v).toBeTruthy(); // Version field
    expect(details.event.t).toBeTruthy(); // Type field
  });

  it('should handle credentials with nested data', async () => {
    // Create registry and schema
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('nested-registry');
    const schemaDsl = await dsl.createSchema('nested-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                zip: { type: 'string' },
              },
            },
          },
        },
      },
    });

    // Issue credential with nested data
    const acdcDsl = await registryDsl.issue({
      alias: 'nested-cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: {
        person: {
          name: 'Bob',
          address: {
            city: 'NYC',
            zip: '10001',
          },
        },
      },
    });

    // Extract details
    const exportDsl = await acdcDsl.export();
    const details = await extractACDCDetails(exportDsl);

    // Verify all components extracted successfully
    expect(details.publicKeys.length).toBeGreaterThan(0);
    expect(details.signatures.length).toBeGreaterThan(0);
    expect(details.json).toBeTruthy();
    expect(details.cesr).toBeTruthy();
    expect(details.event).toBeTruthy();
  });
});
