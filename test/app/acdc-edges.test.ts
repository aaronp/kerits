/**
 * Tests for ACDC Edge Blocks
 *
 * Tests credential linking using edge blocks (e field)
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import type { KeritsDSL } from '../../src/app/dsl/types';

describe('ACDC Edge Blocks', () => {
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

  it('should create ACDC with edge blocks', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    // Create schema
    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create first credential
    const cred1 = await registryDsl.issue({
      alias: 'cred-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'First Credential' },
    });

    // Create second credential with edge linking to first
    const cred2 = await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Second Credential' },
      edges: {
        evidence: {
          n: cred1.acdc.credentialId,
        },
      },
    });

    // Verify edge was created
    const edges = await cred2.getEdges();
    expect(edges).toBeTruthy();
    expect(edges.evidence).toBeTruthy();
    expect(edges.evidence.n).toBe(cred1.acdc.credentialId);
  });

  it('should link to multiple credentials via edges', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create multiple credentials
    const cred1 = await registryDsl.issue({
      alias: 'cred-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Evidence 1' },
    });

    const cred2 = await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Evidence 2' },
    });

    // Create credential linking to both
    const cred3 = await registryDsl.issue({
      alias: 'cred-3',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Main Credential' },
      edges: {
        evidence1: { n: cred1.acdc.credentialId },
        evidence2: { n: cred2.acdc.credentialId },
      },
    });

    // Verify edges
    const edges = await cred3.getEdges();
    expect(Object.keys(edges)).toHaveLength(2);
    expect(edges.evidence1.n).toBe(cred1.acdc.credentialId);
    expect(edges.evidence2.n).toBe(cred2.acdc.credentialId);
  });

  it('should retrieve linked credentials via getLinkedCredentials()', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create evidence credential
    const evidenceCred = await registryDsl.issue({
      alias: 'evidence',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Evidence Document' },
    });

    // Create main credential with edge
    const mainCred = await registryDsl.issue({
      alias: 'main',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Main Document' },
      edges: {
        evidence: { n: evidenceCred.acdc.credentialId },
      },
    });

    // Retrieve linked credentials
    const linked = await mainCred.getLinkedCredentials();
    expect(linked).toHaveLength(1);
    expect(linked[0].acdc.credentialId).toBe(evidenceCred.acdc.credentialId);
    expect(linked[0].acdc.data.name).toBe('Evidence Document');
  });

  it('should track reverse edges via getLinkedFrom()', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create base credential
    const baseCred = await registryDsl.issue({
      alias: 'base',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Base Document' },
    });

    // Create credential linking to base
    const derivedCred = await registryDsl.issue({
      alias: 'derived',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Derived Document' },
      edges: {
        baseDocument: { n: baseCred.acdc.credentialId },
      },
    });

    // Verify reverse edge
    const linkedFrom = await baseCred.getLinkedFrom();
    expect(linkedFrom).toHaveLength(1);
    expect(linkedFrom[0].acdc.credentialId).toBe(derivedCred.acdc.credentialId);
  });

  it('should validate edge references exist', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Try to create credential with invalid edge
    const fakeCredentialId = 'EInvalidCredentialSAID1234567890123456789012';

    await expect(
      registryDsl.issue({
        alias: 'invalid-cred',
        schema: schemaDsl.schema.schemaId,
        holder: accountDsl!.account.aid,
        data: { name: 'Invalid Credential' },
        edges: {
          evidence: { n: fakeCredentialId },
        },
      })
    ).rejects.toThrow('Linked ACDC not found');
  });

  it('should validate schema constraints in edges', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    // Create two different schemas
    const schema1 = await dsl.createSchema('schema-1', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        type: { type: 'string' },
      },
    });

    const schema2 = await dsl.createSchema('schema-2', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Create credential with schema1
    const cred1 = await registryDsl.issue({
      alias: 'cred-1',
      schema: schema1.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { type: 'Evidence' },
    });

    // Try to create credential requiring wrong schema
    await expect(
      registryDsl.issue({
        alias: 'cred-2',
        schema: schema2.schema.schemaId,
        holder: accountDsl!.account.aid,
        data: { name: 'Main' },
        edges: {
          evidence: {
            n: cred1.acdc.credentialId,
            s: schema2.schema.schemaId, // Require schema2 but cred1 uses schema1
          },
        },
      })
    ).rejects.toThrow('edge requires schema');
  });

  it('should preserve edges through ACDC export', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    const cred1 = await registryDsl.issue({
      alias: 'cred-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Evidence' },
    });

    const cred2 = await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Main' },
      edges: {
        evidence: { n: cred1.acdc.credentialId },
      },
    });

    // Export and verify edges are included
    const exportDsl = await cred2.export();
    const bundle = exportDsl.asBundle();

    // Parse the ACDC event (first event in bundle)
    const { parseCesrStream } = await import('../../src/app/signing');
    const parsed = parseCesrStream(bundle.events[0]);
    const eventText = new TextDecoder().decode(parsed.event);
    const jsonStart = eventText.indexOf('{');
    const acdcData = JSON.parse(eventText.substring(jsonStart));

    expect(acdcData.e).toBeTruthy();
    expect(acdcData.e.evidence).toBeTruthy();
    expect(acdcData.e.evidence.n).toBe(cred1.acdc.credentialId);
  });

  it('should support credential chains via edges', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        level: { type: 'number' },
      },
    });

    // Create chain: cred1 -> cred2 -> cred3
    const cred1 = await registryDsl.issue({
      alias: 'level-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { level: 1 },
    });

    const cred2 = await registryDsl.issue({
      alias: 'level-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { level: 2 },
      edges: {
        parent: { n: cred1.acdc.credentialId },
      },
    });

    const cred3 = await registryDsl.issue({
      alias: 'level-3',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { level: 3 },
      edges: {
        parent: { n: cred2.acdc.credentialId },
      },
    });

    // Traverse chain forward
    const cred2Linked = await cred3.getLinkedCredentials();
    expect(cred2Linked).toHaveLength(1);
    expect(cred2Linked[0].acdc.data.level).toBe(2);

    const cred1Linked = await cred2Linked[0].getLinkedCredentials();
    expect(cred1Linked).toHaveLength(1);
    expect(cred1Linked[0].acdc.data.level).toBe(1);

    // Traverse chain backward
    const cred1LinkedFrom = await cred1.getLinkedFrom();
    expect(cred1LinkedFrom).toHaveLength(1);
    expect(cred1LinkedFrom[0].acdc.credentialId).toBe(cred2.acdc.credentialId);

    const cred2LinkedFrom = await cred2.getLinkedFrom();
    expect(cred2LinkedFrom).toHaveLength(1);
    expect(cred2LinkedFrom[0].acdc.credentialId).toBe(cred3.acdc.credentialId);
  });

  it('should index edges in TEL indexer', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    const cred1 = await registryDsl.issue({
      alias: 'cred-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Base' },
    });

    const cred2 = await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Derived' },
      edges: {
        base: { n: cred1.acdc.credentialId },
      },
    });

    // Index the credentials
    const indexed2 = await cred2.index();
    const indexed1 = await cred1.index();

    // Verify edge tracking
    expect(indexed2.edges.base).toBeTruthy();
    expect(indexed2.edges.base.n).toBe(cred1.acdc.credentialId);
    expect(indexed2.linkedTo).toContain(cred1.acdc.credentialId);
    expect(indexed1.linkedFrom).toContain(cred2.acdc.credentialId);
  });
});
