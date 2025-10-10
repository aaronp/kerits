/**
 * Tests for AccountDSL.listAllACDCs with filtering
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import type { KeritsDSL } from '../../src/app/dsl/types';

describe('AccountDSL.listAllACDCs', () => {
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

  it('should list all credentials issued by account', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Issue multiple credentials
    await registryDsl.issue({
      alias: 'cred-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Alice' },
    });

    await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Bob' },
    });

    // List all credentials
    const allCreds = await accountDsl!.listAllACDCs();

    expect(allCreds).toHaveLength(2);
    expect(allCreds.some(c => c.alias === 'cred-1')).toBe(true);
    expect(allCreds.some(c => c.alias === 'cred-2')).toBe(true);
  });

  it('should list credentials from multiple registries', async () => {
    const accountDsl = await dsl.account(accountAlias);

    // Create two registries
    const registry1 = await accountDsl!.createRegistry('registry-1');
    const registry2 = await accountDsl!.createRegistry('registry-2');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Issue credentials in both registries
    await registry1.issue({
      alias: 'cred-reg1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Registry 1 Cred' },
    });

    await registry2.issue({
      alias: 'cred-reg2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Registry 2 Cred' },
    });

    // List all credentials
    const allCreds = await accountDsl!.listAllACDCs();

    expect(allCreds).toHaveLength(2);
    expect(allCreds.some(c => c.alias === 'cred-reg1')).toBe(true);
    expect(allCreds.some(c => c.alias === 'cred-reg2')).toBe(true);
    expect(allCreds.some(c => c.registryId === registry1.registry.registryId)).toBe(true);
    expect(allCreds.some(c => c.registryId === registry2.registry.registryId)).toBe(true);
  });

  it('should filter credentials by data field', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
        department: { type: 'string' },
      },
    });

    // Issue multiple credentials with different data
    await registryDsl.issue({
      alias: 'employee-1',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Alice', department: 'Engineering' },
    });

    await registryDsl.issue({
      alias: 'employee-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Bob', department: 'Marketing' },
    });

    await registryDsl.issue({
      alias: 'employee-3',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Charlie', department: 'Engineering' },
    });

    // Filter by department
    const engineeringCreds = await accountDsl!.listAllACDCs('engineering');

    expect(engineeringCreds).toHaveLength(2);
    expect(engineeringCreds.every(c => c.data.department === 'Engineering')).toBe(true);
  });

  it('should filter is case-insensitive', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    await registryDsl.issue({
      alias: 'test-cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'UPPERCASE NAME' },
    });

    // Search with lowercase
    const results = await accountDsl!.listAllACDCs('uppercase');

    expect(results).toHaveLength(1);
    expect(results[0].data.name).toBe('UPPERCASE NAME');
  });

  it('should filter by alias', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    await registryDsl.issue({
      alias: 'employee-badge-001',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Alice' },
    });

    await registryDsl.issue({
      alias: 'contractor-badge-002',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Bob' },
    });

    // Filter by alias
    const employeeCreds = await accountDsl!.listAllACDCs('employee');

    expect(employeeCreds).toHaveLength(1);
    expect(employeeCreds[0].alias).toBe('employee-badge-001');
  });

  it('should filter by credential ID', async () => {
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
      data: { name: 'Test' },
    });

    await registryDsl.issue({
      alias: 'cred-2',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Other' },
    });

    // Filter by partial credential ID
    const partialId = cred1.acdc.credentialId.substring(0, 10);
    const results = await accountDsl!.listAllACDCs(partialId);

    expect(results).toHaveLength(1);
    expect(results[0].credentialId).toBe(cred1.acdc.credentialId);
  });

  it('should return empty array when no credentials match filter', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    await registryDsl.issue({
      alias: 'test-cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl!.account.aid,
      data: { name: 'Alice' },
    });

    // Filter with non-matching text
    const results = await accountDsl!.listAllACDCs('nonexistent');

    expect(results).toHaveLength(0);
  });

  it('should return all credentials when no filter provided', async () => {
    const accountDsl = await dsl.account(accountAlias);
    const registryDsl = await accountDsl!.createRegistry('test-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Issue multiple credentials
    for (let i = 0; i < 5; i++) {
      await registryDsl.issue({
        alias: `cred-${i}`,
        schema: schemaDsl.schema.schemaId,
        holder: accountDsl!.account.aid,
        data: { name: `Person ${i}` },
      });
    }

    // No filter
    const allCreds = await accountDsl!.listAllACDCs();

    expect(allCreds).toHaveLength(5);
  });

  it('should include both issued and imported credentials', async () => {
    // Create two accounts
    const seed1 = new Uint8Array(32).fill(1);
    const mnemonic1 = dsl.newMnemonic(seed1);
    await dsl.newAccount('account-1', mnemonic1);

    const seed2 = new Uint8Array(32).fill(2);
    const mnemonic2 = dsl.newMnemonic(seed2);
    await dsl.newAccount('account-2', mnemonic2);

    const account1Dsl = await dsl.account('account-1');
    const account2Dsl = await dsl.account('account-2');

    const registry1 = await account1Dsl!.createRegistry('registry-1');
    const registry2 = await account2Dsl!.createRegistry('registry-2');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Account 1 issues a credential to account 2
    const issuedCred = await registry1.issue({
      alias: 'cred-from-account1',
      schema: schemaDsl.schema.schemaId,
      holder: account2Dsl!.account.aid,
      data: { name: 'Issued to Account 2' },
    });

    // Account 1 also creates a credential for itself
    await registry1.issue({
      alias: 'cred-self-issued',
      schema: schemaDsl.schema.schemaId,
      holder: account1Dsl!.account.aid,
      data: { name: 'Self Issued' },
    });

    // Account 2 imports the credential from account 1
    const ipexGrant = await issuedCred.exportIPEX();
    const { parseExchangeMessage } = await import('../../src/ipex');
    const grantMessage = parseExchangeMessage(ipexGrant);

    await registry2.accept({
      credential: grantMessage.e.acdc,
      issEvent: grantMessage.e.iss,
      alias: 'imported-from-account1',
    });

    // Account 2 also issues its own credential
    await registry2.issue({
      alias: 'cred-account2-self',
      schema: schemaDsl.schema.schemaId,
      holder: account2Dsl!.account.aid,
      data: { name: 'Account 2 Self Issued' },
    });

    // List credentials for account 2
    const account2Creds = await account2Dsl!.listAllACDCs();

    // Should see both imported and self-issued credentials
    expect(account2Creds.length).toBeGreaterThanOrEqual(2);

    // Check that we have the imported credential (issued by account1)
    const importedCred = account2Creds.find(c => c.issuerAid === account1Dsl!.account.aid);
    expect(importedCred).toBeDefined();
    // The alias may be preserved from the original credential or use the provided alias
    expect(importedCred!.alias).toBeTruthy();

    // Check that we have the self-issued credential
    const selfIssued = account2Creds.find(c => c.alias === 'cred-account2-self');
    expect(selfIssued).toBeDefined();
    expect(selfIssued!.issuerAid).toBe(account2Dsl!.account.aid);
  });

  it('should include imported credentials when linking edges', async () => {
    // Create two accounts: issuer and holder
    const seed1 = new Uint8Array(32).fill(1);
    const mnemonic1 = dsl.newMnemonic(seed1);
    await dsl.newAccount('issuer', mnemonic1);

    const seed2 = new Uint8Array(32).fill(2);
    const mnemonic2 = dsl.newMnemonic(seed2);
    await dsl.newAccount('holder', mnemonic2);

    const issuerDsl = await dsl.account('issuer');
    const holderDsl = await dsl.account('holder');

    const issuerRegistry = await issuerDsl!.createRegistry('issuer-registry');
    const holderRegistry = await holderDsl!.createRegistry('holder-registry');

    const schemaDsl = await dsl.createSchema('test-schema', {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    });

    // Issuer creates a credential for holder
    const sourceCred = await issuerRegistry.issue({
      alias: 'source-credential',
      schema: schemaDsl.schema.schemaId,
      holder: holderDsl!.account.aid,
      data: { name: 'Source Credential' },
    });

    // Holder imports the credential
    const ipexGrant = await sourceCred.exportIPEX();
    const { parseExchangeMessage } = await import('../../src/ipex');
    const grantMessage = parseExchangeMessage(ipexGrant);

    await holderRegistry.accept({
      credential: grantMessage.e.acdc,
      issEvent: grantMessage.e.iss,
      alias: 'imported-source',
    });

    // Now holder wants to issue a new credential that links to the imported one
    // First, verify the imported credential shows up in listAllACDCs
    const availableCreds = await holderDsl!.listAllACDCs();

    expect(availableCreds.length).toBeGreaterThanOrEqual(1);
    const importedCred = availableCreds.find(c => c.alias === 'imported-source');
    expect(importedCred).toBeDefined();
    expect(importedCred!.issuerAid).toBe(issuerDsl!.account.aid);

    // Now issue a new credential with an edge to the imported credential
    const linkedCred = await holderRegistry.issue({
      alias: 'credential-with-link',
      schema: schemaDsl.schema.schemaId,
      holder: holderDsl!.account.aid,
      data: { name: 'Linked Credential' },
      edges: {
        source: { n: importedCred!.credentialId },
      },
    });

    // Verify the edge was created successfully
    const exportDsl = await linkedCred.export();
    const { extractACDCDetails } = await import('../../src/app/dsl/utils/acdc-details');
    const details = await extractACDCDetails(exportDsl);

    expect(details.acdcEvent?.e).toBeDefined();
    expect(details.acdcEvent!.e.source).toBeDefined();
    expect(details.acdcEvent!.e.source.n).toBe(importedCred!.credentialId);
  });
});
