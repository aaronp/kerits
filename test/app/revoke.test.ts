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
    const accountDsl = await dsl.createAccount('alice', 'password123');
    expect(accountDsl).toBeDefined();

    // 2. Create registry
    const registryDsl = await accountDsl.createRegistry('public-registry');
    expect(registryDsl).toBeDefined();

    // 3. Create schema
    const schemaDsl = await registryDsl.createSchema('person-schema', {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
    expect(schemaDsl).toBeDefined();

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
    const credentials = await registryDsl.listACDCs();
    expect(credentials.length).toBe(1);
    expect(credentials[0].status).toBe('revoked');
    expect(credentials[0].revoked).toBe(true);
  });

  it('should index revoked credential correctly', async () => {
    const store = createKerStore(new MemoryKv());
    const dsl = createKeritsDSL(store);

    const accountDsl = await dsl.createAccount('alice', 'password123');
    const registryDsl = await accountDsl.createRegistry('registry');
    const schemaDsl = await registryDsl.createSchema('schema', {
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
