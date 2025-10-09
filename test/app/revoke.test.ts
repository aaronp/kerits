/**
 * Test credential revocation flow
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl/index.js';
import { createKerStore, MemoryKv } from '../../src/storage/index.js';

describe('Credential Revocation', () => {
  it('should issue and revoke a credential', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    // 1. Create account
    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    const mnemonic = dsl.newMnemonic(seed);
    await dsl.newAccount('alice', mnemonic);
    const accountDsl = await dsl.account('alice');
    expect(accountDsl).toBeDefined();

    // 2. Create schema (at DSL level, not registry level)
    const schemaDsl = await dsl.createSchema('person-schema', {
      title: 'Person Schema',
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
    expect(schemaDsl).toBeDefined();

    // 3. Create registry
    const registryDsl = await accountDsl!.createRegistry('public-registry');
    expect(registryDsl).toBeDefined();

    // 4. Issue credential
    const credentialDsl = await registryDsl.issue({
      alias: 'test-credential',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl.account.aid, // Self-signed
      data: { name: 'Alice', age: 30 },
    });
    expect(credentialDsl).toBeDefined();

    // 5. Check status before revocation
    let status = await credentialDsl.status();
    expect(status.revoked).toBe(false);
    expect(status.status).toBe('issued');

    // 6. Revoke credential
    await credentialDsl.revoke();

    // 7. Check status after revocation
    status = await credentialDsl.status();
    expect(status.revoked).toBe(true);
    expect(status.status).toBe('revoked');

    // 8. Verify revocation event in TEL
    const telEvents = await registryDsl.getTel();
    const revEvents = telEvents.filter(e => e.t === 'rev');
    expect(revEvents.length).toBe(1);
    expect(revEvents[0].i).toBe(credentialDsl.acdc.credentialId);

    // 9. Verify credential appears as revoked in list
    const credentials = await registryDsl.listCredentials();
    expect(credentials.length).toBe(1);
    expect(credentials[0].status).toBe('revoked');
  });

  it('should index revoked credential correctly', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    const seed = new Uint8Array(32);
    crypto.getRandomValues(seed);
    const mnemonic = dsl.newMnemonic(seed);
    await dsl.newAccount('alice', mnemonic);
    const accountDsl = await dsl.account('alice');
    const registryDsl = await accountDsl!.createRegistry('registry');
    const schemaDsl = await dsl.createSchema('schema', {
      title: 'schema',
      type: 'object',
      properties: { name: { type: 'string' } },
    });

    const credentialDsl = await registryDsl.issue({
      alias: 'cred',
      schema: schemaDsl.schema.schemaId,
      holder: accountDsl.account.aid,
      data: { name: 'Test' },
    });

    // Revoke
    await credentialDsl.revoke();

    // Index credential
    const indexed = await credentialDsl.index();
    expect(indexed.status).toBe('revoked');
    expect(indexed.revokedAt).toBeDefined();
    expect(indexed.revocationEventSaid).toBeDefined();
    expect(indexed.telEvents).toHaveLength(2); // ISS + REV
    expect(indexed.telEvents[0].eventType).toBe('iss');
    expect(indexed.telEvents[1].eventType).toBe('rev');

    // Index registry
    const registryIndexed = await registryDsl.index();
    expect(registryIndexed.credentialCount).toBe(1);
    expect(registryIndexed.issuedCount).toBe(1);
    expect(registryIndexed.revokedCount).toBe(1);
  });
});
