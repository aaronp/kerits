/**
 * Comprehensive Application Tests
 *
 * Tests the complete user journey through the KERI ecosystem:
 * 1. Account creation and management
 * 2. Registry (TEL) creation
 * 3. Credential issuance and acceptance
 * 4. Data sharing between users
 * 5. Nested/recursive TELs
 *
 * These tests follow the design in docs/design.md
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { createKeritsDSL } from '../../src/app/dsl';
import type { KeritsDSL } from '../../src/app/dsl/types';
import { DiskKv } from '../../src';
import * as path from 'path';

const SEED_ALICE = new Uint8Array(32).fill(1);
const SEED_BOB = new Uint8Array(32).fill(2);
const SEED_UNIVERSITY = new Uint8Array(32).fill(3);

describe('Complete Application Flow', () => {
  let dsl: KeritsDSL;
  let testCounter = 0;

  beforeEach(async () => {
    // Use unique directory for each test to avoid state leakage
    const TEST_DIR = path.join('target', 'app-integration', `test-${Date.now()}-${testCounter++}`);

    const kv = new DiskKv({ baseDir: TEST_DIR });
    const store = createKerStore(kv);
    dsl = createKeritsDSL(store);
  });

  describe('1. Account Creation and Management', () => {
    test('should create account with mnemonic', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      expect(mnemonic).toBeDefined();
      expect(mnemonic.split(' ').length).toBe(24);

      const account = await dsl.newAccount('alice', mnemonic);
      expect(account).toBeDefined();
      expect(account.aid).toBeDefined();
      expect(account.aid.startsWith('D')).toBe(true); // Ed25519 prefix
    });

    test('should retrieve account by alias', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const account = await dsl.getAccount('alice');
      expect(account).toBeDefined();
      expect(account!.alias).toBe('alice');
    });

    test('should retrieve account by AID', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      const created = await dsl.newAccount('alice', mnemonic);

      const account = await dsl.getAccountByAid(created.aid);
      expect(account).toBeDefined();
      expect(account!.aid).toBe(created.aid);
      expect(account!.alias).toBe('alice');
    });

    test('should list all accounts', async () => {
      const mnemonic1 = dsl.newMnemonic(SEED_ALICE);
      const mnemonic2 = dsl.newMnemonic(SEED_BOB);

      await dsl.newAccount('alice', mnemonic1);
      await dsl.newAccount('bob', mnemonic2);

      const accounts = await dsl.accountNames();
      expect(accounts).toContain('alice');
      expect(accounts).toContain('bob');
      expect(accounts.length).toBe(2);
    });

    test('should get AccountDSL for operations', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const accountDsl = await dsl.account('alice');
      expect(accountDsl).toBeDefined();
      expect(accountDsl!.account.alias).toBe('alice');
    });
  });

  describe('2. Registry (TEL) Creation', () => {
    test('should create credential registry', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const accountDsl = await dsl.account('alice');
      const registryDsl = await accountDsl!.createRegistry('credentials');

      expect(registryDsl).toBeDefined();
      expect(registryDsl.registry.registryId).toBeDefined();
      expect(registryDsl.registry.registryId.startsWith('E')).toBe(true);
    });

    test('should list registries for account', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const accountDsl = await dsl.account('alice');
      await accountDsl!.createRegistry('personal-creds');
      await accountDsl!.createRegistry('work-creds');

      const registries = await accountDsl!.listRegistries();
      expect(registries).toContain('personal-creds');
      expect(registries).toContain('work-creds');
      expect(registries.length).toBe(2);
    });

    test('should retrieve registry by alias', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const accountDsl = await dsl.account('alice');
      const created = await accountDsl!.createRegistry('credentials');

      const retrieved = await accountDsl!.registry('credentials');
      expect(retrieved).toBeDefined();
      expect(retrieved!.registry.registryId).toBe(created.registry.registryId);
    });

    test('should anchor registry in KEL', async () => {
      const mnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', mnemonic);

      const accountDsl = await dsl.account('alice');
      const registryDsl = await accountDsl!.createRegistry('credentials');

      // Verify KEL has IXN event that anchors the registry
      const kel = await accountDsl!.getKel();
      expect(kel.length).toBeGreaterThanOrEqual(2); // ICP + IXN

      // Check graph shows ANCHOR edge
      const graph = await accountDsl!.graph();
      const anchorEdges = graph.edges.filter(e => e.kind === 'ANCHOR');
      expect(anchorEdges.length).toBeGreaterThanOrEqual(1);

      // Verify ANCHOR edge links to registry
      const regAnchor = anchorEdges.find(e => e.to === registryDsl.registry.registryId);
      expect(regAnchor).toBeDefined();
    });
  });

  describe('3. Schema Management', () => {
    test('should create schema', async () => {
      const schema = {
        $id: 'https://example.com/schemas/person',
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      const schemaDsl = await dsl.createSchema('person', schema);
      expect(schemaDsl).toBeDefined();
      expect(schemaDsl.schema.schemaSaid).toBeDefined();
    });

    test('should retrieve schema by alias', async () => {
      const schema = {
        $id: 'https://example.com/schemas/person',
        type: 'object',
        properties: { name: { type: 'string' } },
      };

      await dsl.createSchema('person', schema);
      const retrieved = await dsl.schema('person');

      expect(retrieved).toBeDefined();
      expect(retrieved!.schema.alias).toBe('person');
    });

    test('should validate data against schema', async () => {
      const schema = {
        $id: 'https://example.com/schemas/person',
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
        required: ['name'],
      };

      const schemaDsl = await dsl.createSchema('person', schema);

      // Valid data
      expect(schemaDsl.validate({ name: 'Alice', age: 30 })).toBe(true);

      // Invalid data (missing required field)
      expect(schemaDsl.validate({ age: 30 })).toBe(false);

      // Invalid data (wrong type)
      expect(schemaDsl.validate({ name: 123 })).toBe(false);
    });
  });

  describe('4. Credential Issuance', () => {
    test('should issue credential', async () => {
      // Setup issuer
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const registryDsl = await issuerDsl!.createRegistry('degrees');

      // Create schema
      const degreeSchema = {
        $id: 'https://university.edu/schemas/degree',
        type: 'object',
        properties: {
          degree: { type: 'string' },
          major: { type: 'string' },
          graduationYear: { type: 'number' },
        },
        required: ['degree', 'major', 'graduationYear'],
      };
      const schemaDsl = await dsl.createSchema('degree', degreeSchema);

      // Setup holder
      const holderMnemonic = dsl.newMnemonic(SEED_ALICE);
      const holder = await dsl.newAccount('alice', holderMnemonic);

      // Issue credential
      const acdcDsl = await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: {
          degree: 'Bachelor of Science',
          major: 'Computer Science',
          graduationYear: 2024,
        },
        alias: 'alice-degree',
      });

      expect(acdcDsl).toBeDefined();
      expect(acdcDsl.acdc.credentialId).toBeDefined();
      expect(acdcDsl.acdc.holderAid).toBe(holder.aid);
    });

    test('should list credentials in registry', async () => {
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const registryDsl = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      const holder1 = await dsl.newAccount('alice', dsl.newMnemonic(SEED_ALICE));
      const holder2 = await dsl.newAccount('bob', dsl.newMnemonic(SEED_BOB));

      await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder1.aid,
        data: { degree: 'BS' },
        alias: 'alice-bs',
      });

      await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder2.aid,
        data: { degree: 'MS' },
        alias: 'bob-ms',
      });

      const credentials = await registryDsl!.listACDCs();
      expect(credentials).toContain('alice-bs');
      expect(credentials).toContain('bob-ms');
      expect(credentials.length).toBe(2);
    });

    test('should retrieve credential by alias', async () => {
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const registryDsl = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      const holder = await dsl.newAccount('alice', dsl.newMnemonic(SEED_ALICE));

      const issued = await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: { degree: 'BS' },
        alias: 'alice-degree',
      });

      const retrieved = await registryDsl!.acdc('alice-degree');
      expect(retrieved).toBeDefined();
      expect(retrieved!.acdc.credentialId).toBe(issued.acdc.credentialId);
    });
  });

  describe('5. Credential Acceptance', () => {
    test('holder should accept issued credential', async () => {
      // Setup issuer
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const issuerRegistry = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      // Setup holder
      const holderMnemonic = dsl.newMnemonic(SEED_ALICE);
      const holder = await dsl.newAccount('alice', holderMnemonic);
      const holderDsl = await dsl.account('alice');
      const holderRegistry = await holderDsl!.createRegistry('my-credentials');

      // Issue credential
      const issuedCred = await issuerRegistry!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: { degree: 'Bachelor of Science' },
        alias: 'alice-bs',
      });

      // Export credential for sharing
      const credData = {
        credentialId: issuedCred.acdc.credentialId,
        issuerAid: issuerDsl!.account.aid,
        holderAid: holder.aid,
        registryId: issuerRegistry.registry.registryId,
        schemas: [schemaDsl.schema.schemaSaid],
        data: { degree: 'Bachelor of Science' },
        issuedAt: new Date().toISOString(),
      };

      // Holder accepts credential
      const acceptedCred = await holderRegistry!.accept({
        credential: {
          v: 'ACDC10JSON',
          d: credData.credentialId,
          i: credData.issuerAid,
          ri: credData.registryId,
          s: schemaDsl.schema.schemaSaid,
          a: {
            d: '',
            i: credData.holderAid,
            ...credData.data,
          },
        },
        alias: 'my-degree',
      });

      expect(acceptedCred).toBeDefined();
      expect(acceptedCred.acdc.credentialId).toBe(issuedCred.acdc.credentialId);

      // Verify credential appears in holder's registry
      const holderCreds = await holderRegistry!.listACDCs();
      expect(holderCreds).toContain('my-degree');
    });

    test('accepted credential should appear in holder TEL', async () => {
      // Setup
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const issuerRegistry = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      const holderMnemonic = dsl.newMnemonic(SEED_ALICE);
      const holder = await dsl.newAccount('alice', holderMnemonic);
      const holderDsl = await dsl.account('alice');
      const holderRegistry = await holderDsl!.createRegistry('my-credentials');

      // Issue
      const issuedCred = await issuerRegistry!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: { degree: 'BS' },
      });

      // Accept
      await holderRegistry!.accept({
        credential: {
          v: 'ACDC10JSON',
          d: issuedCred.acdc.credentialId,
          i: issuerDsl!.account.aid,
          ri: issuerRegistry.registry.registryId,
          s: schemaDsl.schema.schemaSaid,
          a: { d: '', i: holder.aid, degree: 'BS' },
        },
        alias: 'my-bs',
      });

      // Verify in TEL
      const tel = await holderRegistry!.getTel();
      const issEvents = tel.filter(e => e.t === 'iss');
      expect(issEvents.length).toBeGreaterThanOrEqual(1);

      // Verify in indexed view
      const indexed = await holderRegistry!.index();
      expect(indexed.credentials.length).toBe(1);
      expect(indexed.credentials[0]!.credentialId).toBe(issuedCred.acdc.credentialId);
    });
  });

  describe('6. Credential Revocation', () => {
    test('issuer should revoke credential', async () => {
      // Setup
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const registryDsl = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      const holder = await dsl.newAccount('alice', dsl.newMnemonic(SEED_ALICE));

      // Issue
      const cred = await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: { degree: 'BS' },
        alias: 'alice-bs',
      });

      // Verify active
      let status = await cred.status();
      expect(status.revoked).toBe(false);

      // Revoke
      await cred.revoke();

      // Verify revoked
      status = await cred.status();
      expect(status.revoked).toBe(true);
    });

    test('revocation should appear in TEL', async () => {
      const issuerMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', issuerMnemonic);
      const issuerDsl = await dsl.account('university');
      const registryDsl = await issuerDsl!.createRegistry('degrees');

      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      const holder = await dsl.newAccount('alice', dsl.newMnemonic(SEED_ALICE));

      const cred = await registryDsl!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: holder.aid,
        data: { degree: 'BS' },
      });

      await cred.revoke();

      // Check TEL has revocation event
      const tel = await registryDsl!.getTel();
      const revEvents = tel.filter(e => e.t === 'rev');
      expect(revEvents.length).toBe(1);
      expect(revEvents[0]!.acdcSaid).toBe(cred.acdc.credentialId);
    });
  });

  describe('7. Data Sharing Between Users', () => {
    test('should export and import credential between users', async () => {
      // Alice issues credential to Bob
      const aliceMnemonic = dsl.newMnemonic(SEED_ALICE);
      await dsl.newAccount('alice', aliceMnemonic);
      const aliceDsl = await dsl.account('alice');
      const aliceRegistry = await aliceDsl!.createRegistry('endorsements');

      const schemaDsl = await dsl.createSchema('endorsement', {
        type: 'object',
        properties: { skill: { type: 'string' } },
      });

      const bob = await dsl.newAccount('bob', dsl.newMnemonic(SEED_BOB));

      const cred = await aliceRegistry!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: bob.aid,
        data: { skill: 'TypeScript' },
      });

      // Export credential
      const exportDsl = await cred.export();
      const bundle = exportDsl.asBundle();

      expect(bundle).toBeDefined();
      expect(bundle.events.length).toBeGreaterThan(0);

      // TODO: Import into Bob's system
      // This would require a separate DSL instance or ImportDSL
    });
  });

  describe('8. Recursive/Nested TELs', () => {
    test('should create sub-registry within a registry', async () => {
      // University creates main registry
      const uniMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', uniMnemonic);
      const uniDsl = await dsl.account('university');
      const mainRegistry = await uniDsl!.createRegistry('all-credentials');

      // TODO: Implement nested registry creation
      // const subRegistry = await mainRegistry!.createRegistry('cs-department');
      // expect(subRegistry).toBeDefined();
      // expect(subRegistry.registry.parentRegistryId).toBe(mainRegistry.registry.registryId);

      // For now, just verify we can create multiple registries
      const csRegistry = await uniDsl!.createRegistry('cs-dept');
      const mathRegistry = await uniDsl!.createRegistry('math-dept');

      const registries = await uniDsl!.listRegistries();
      expect(registries).toContain('all-credentials');
      expect(registries).toContain('cs-dept');
      expect(registries).toContain('math-dept');
      expect(registries.length).toBe(3);
    });
  });

  describe('9. Graph Visualization', () => {
    test('should build complete graph showing all relationships', async () => {
      // Create accounts
      const uniMnemonic = dsl.newMnemonic(SEED_UNIVERSITY);
      await dsl.newAccount('university', uniMnemonic);
      const uniDsl = await dsl.account('university');

      const aliceMnemonic = dsl.newMnemonic(SEED_ALICE);
      const alice = await dsl.newAccount('alice', aliceMnemonic);

      // Create registry
      const registry = await uniDsl!.createRegistry('degrees');

      // Create schema
      const schemaDsl = await dsl.createSchema('degree', {
        type: 'object',
        properties: { degree: { type: 'string' } },
      });

      // Issue credential
      await registry!.issue({
        schema: schemaDsl.schema.schemaSaid,
        holder: alice.aid,
        data: { degree: 'BS' },
      });

      // Build graph
      const graph = await dsl.graph();

      // Verify nodes
      const aidNodes = graph.nodes.filter(n => n.kind === 'AID');
      const kelNodes = graph.nodes.filter(n => n.kind === 'KEL_EVT');
      const registryNodes = graph.nodes.filter(n => n.kind === 'TEL_REGISTRY');
      const telNodes = graph.nodes.filter(n => n.kind === 'TEL_EVT');
      const acdcNodes = graph.nodes.filter(n => n.kind === 'ACDC');

      expect(aidNodes.length).toBeGreaterThanOrEqual(1);
      expect(kelNodes.length).toBeGreaterThanOrEqual(2); // ICP + IXN
      expect(registryNodes.length).toBe(1);
      expect(telNodes.length).toBeGreaterThanOrEqual(1); // ISS
      expect(acdcNodes.length).toBe(1);

      // Verify edges
      const priorEdges = graph.edges.filter(e => e.kind === 'PRIOR');
      const anchorEdges = graph.edges.filter(e => e.kind === 'ANCHOR');
      const issuesEdges = graph.edges.filter(e => e.kind === 'ISSUES');

      expect(priorEdges.length).toBeGreaterThanOrEqual(1);
      expect(anchorEdges.length).toBeGreaterThanOrEqual(1);
      expect(issuesEdges.length).toBe(1);
    });
  });
});
