/**
 * Contact Sync DSL Tests
 *
 * Tests for tracking sync state between contacts using SAID/SeqNo pointers
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { MemoryKv, createKerStore, DefaultJsonCesrParser, CesrHasher } from '../../src/storage';
import { createKeritsDSL } from '../../src/app/dsl';
import { exportKelIncremental, exportTelIncremental } from '../../src/app/dsl/builders/export';

describe('Contact Sync Tracking', () => {
  const parser = new DefaultJsonCesrParser();
  const hasher = new CesrHasher();

  const seed1 = new Uint8Array(32).fill(1);
  const seed2 = new Uint8Array(32).fill(2);
  const seed3 = new Uint8Array(32).fill(3);

  let issuerStore: ReturnType<typeof createKerStore>;
  let issuerDsl: ReturnType<typeof createKeritsDSL>;

  beforeEach(async () => {
    issuerStore = createKerStore(new MemoryKv(), parser, hasher);
    issuerDsl = createKeritsDSL(issuerStore);

    // Setup issuer account
    const issuerMnemonic = issuerDsl.newMnemonic(seed1);
    await issuerDsl.newAccount('issuer', issuerMnemonic);

    // Add a contact
    await issuerDsl.contacts().add('alice', 'DAliceAID123', {
      name: 'Alice',
      role: 'patient',
    });
  });

  it('should initialize empty sync state for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const state = await syncDsl.getState('alice');

    expect(state).toBeDefined();
    expect(state?.contactAlias).toBe('alice');
    expect(state?.contactAid).toBe('DAliceAID123');
    expect(state?.kelSync).toEqual({});
    expect(state?.telSync).toEqual({});
  });

  it('should track KEL sync state for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');

    // Mark KEL as synced
    await syncDsl.markKelSynced('alice', issuer!.aid, 'ESAID123', '0');

    // Verify state
    const state = await syncDsl.getState('alice');
    expect(state?.kelSync[issuer!.aid]).toBeDefined();
    expect(state?.kelSync[issuer!.aid].lastSaid).toBe('ESAID123');
    expect(state?.kelSync[issuer!.aid].lastSeq).toBe('0');
  });

  it('should track TEL sync state for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const registryId = 'ERegistryABC';

    // Mark TEL as synced
    await syncDsl.markTelSynced('alice', registryId, 'ESAID456', '2024-10-06T00:00:00Z');

    // Verify state
    const state = await syncDsl.getState('alice');
    expect(state?.telSync[registryId]).toBeDefined();
    expect(state?.telSync[registryId].lastSaid).toBe('ESAID456');
    expect(state?.telSync[registryId].lastSeq).toBe('2024-10-06T00:00:00Z');
  });

  it('should report new KEL events for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');
    const issuerAid = issuer!.aid;

    // Initially no sync - should report 1 event (icp)
    const report1 = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(report1.newEvents).toBe(1);
    expect(report1.exported).toBe(1);
    expect(report1.hasMore).toBe(false);

    // Mark as synced to first event
    const kelEvents = await issuerStore.listKel(issuerAid);
    await syncDsl.markKelSynced('alice', issuerAid, kelEvents[0].meta.d, kelEvents[0].meta.s);

    // Rotate keys (adds rot event)
    const accountDsl = await issuerDsl.account('issuer');
    const newMnemonic = issuerDsl.newMnemonic(seed2);
    await accountDsl!.rotateKeys(newMnemonic);

    // Should now report 1 new event (rot)
    const report2 = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(report2.newEvents).toBe(1);
    expect(report2.exported).toBe(1);
    expect(report2.lastSeq).toBe('1');
  });

  it('should report new TEL events for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const accountDsl = await issuerDsl.account('issuer');

    // Create registry
    const registryDsl = await accountDsl!.createRegistry('health-records');
    const registryId = registryDsl.registry.registryId;

    // Check new events (should be 1: vcp)
    const report1 = await syncDsl.getNewTelEvents('alice', registryId);
    expect(report1.newEvents).toBe(1);
    expect(report1.exported).toBe(1);

    // Mark as synced
    const telEvents = await issuerStore.listTel(registryId);
    await syncDsl.markTelSynced('alice', registryId, telEvents[0].meta.d, telEvents[0].meta.dt || '');

    // Issue credential (adds iss event)
    await issuerDsl.createSchema('test-schema', { title: 'Test' });
    await registryDsl.issue({
      schema: 'test-schema',
      holder: 'DAliceAID123',
      data: { test: 'data' },
    });

    // Should now report 1 new event (iss)
    const report2 = await syncDsl.getNewTelEvents('alice', registryId);
    expect(report2.newEvents).toBe(1);
    expect(report2.exported).toBe(1);
  });

  it('should support incremental export with limits', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');
    const issuerAid = issuer!.aid;

    // Create multiple key rotations
    const accountDsl = await issuerDsl.account('issuer');
    for (let i = 2; i <= 4; i++) {
      const seed = new Uint8Array(32).fill(i);
      await accountDsl!.rotateKeys(issuerDsl.newMnemonic(seed));
    }

    // Total: 1 icp + 3 rot = 4 events
    const allEvents = await issuerStore.listKel(issuerAid);
    expect(allEvents.length).toBe(4);

    // Export with limit
    const report = await syncDsl.getNewKelEvents('alice', issuerAid, { limit: 2 });
    expect(report.newEvents).toBe(4);
    expect(report.exported).toBe(2);
    expect(report.hasMore).toBe(true);
  });

  it('should support incremental KEL export after sync pointer', async () => {
    const issuer = await issuerDsl.getAccount('issuer');
    const issuerAid = issuer!.aid;

    // Get initial KEL
    const initialKel = await issuerStore.listKel(issuerAid);
    const firstSaid = initialKel[0].meta.d;

    // Rotate keys
    const accountDsl = await issuerDsl.account('issuer');
    await accountDsl!.rotateKeys(issuerDsl.newMnemonic(seed2));

    // Export incrementally after first event
    const incrementalExport = await exportKelIncremental(issuerStore, issuerAid, {
      afterSaid: firstSaid,
    });

    const bundle = incrementalExport.asBundle();
    expect(bundle.events.length).toBe(1); // Only rot event
  });

  it('should support incremental TEL export after sync pointer', async () => {
    const accountDsl = await issuerDsl.account('issuer');
    const registryDsl = await accountDsl!.createRegistry('test-registry');
    const registryId = registryDsl.registry.registryId;

    // Get initial TEL
    const initialTel = await issuerStore.listTel(registryId);
    const vcpSaid = initialTel[0].meta.d;

    // Issue credential
    await issuerDsl.createSchema('schema1', { title: 'Schema 1' });
    await registryDsl.issue({
      schema: 'schema1',
      holder: 'DAliceAID123',
      data: { field: 'value' },
    });

    // Export incrementally after vcp
    const incrementalExport = await exportTelIncremental(issuerStore, registryId, undefined, {
      afterSaid: vcpSaid,
    });

    const bundle = incrementalExport.asBundle();
    expect(bundle.events.length).toBe(1); // Only iss event
  });

  it('should reset sync state for a contact', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');

    // Set some sync state
    await syncDsl.markKelSynced('alice', issuer!.aid, 'ESAID123', '0');
    await syncDsl.markTelSynced('alice', 'ERegistry', 'ESAID456', '0');

    // Reset
    await syncDsl.resetState('alice');

    // Verify reset
    const state = await syncDsl.getState('alice');
    expect(state?.kelSync).toEqual({});
    expect(state?.telSync).toEqual({});
  });

  it('should list contacts with sync state', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');

    // Add another contact
    await issuerDsl.contacts().add('bob', 'DBobAID456', { name: 'Bob' });

    // Mark alice as synced
    await syncDsl.markKelSynced('alice', issuer!.aid, 'ESAID123', '0');

    // List synced contacts
    const synced = await syncDsl.listSynced();
    expect(synced).toContain('alice');
    expect(synced).not.toContain('bob'); // Bob has no sync state
  });

  it('should handle complete sync workflow', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');
    const issuerAid = issuer!.aid;

    // 1. Check what's new for alice
    const report1 = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(report1.newEvents).toBe(1);

    // 2. Export new events
    const export1 = await exportKelIncremental(issuerStore, issuerAid);
    const bundle1 = export1.asBundle();
    expect(bundle1.events.length).toBe(1);

    // 3. Mark as synced
    await syncDsl.markKelSynced('alice', issuerAid, report1.lastSaid!, report1.lastSeq!);

    // 4. Rotate keys (new event)
    const accountDsl = await issuerDsl.account('issuer');
    await accountDsl!.rotateKeys(issuerDsl.newMnemonic(seed2));

    // 5. Check what's new again
    const report2 = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(report2.newEvents).toBe(1); // Only the new rot event

    // 6. Export incrementally
    const state = await syncDsl.getState('alice');
    const export2 = await exportKelIncremental(issuerStore, issuerAid, {
      afterSaid: state!.kelSync[issuerAid].lastSaid,
    });
    const bundle2 = export2.asBundle();
    expect(bundle2.events.length).toBe(1); // Only rot

    // 7. Mark as synced
    const allKel = await issuerStore.listKel(issuerAid);
    const lastEvent = allKel[allKel.length - 1];
    await syncDsl.markKelSynced('alice', issuerAid, lastEvent.meta.d, lastEvent.meta.s);

    // 8. Verify fully synced
    const report3 = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(report3.newEvents).toBe(0);
    expect(report3.exported).toBe(0);
  });

  it('should handle multiple contacts with different sync states', async () => {
    const syncDsl = issuerDsl.sync();
    const issuer = await issuerDsl.getAccount('issuer');
    const issuerAid = issuer!.aid;

    // Add contacts
    await issuerDsl.contacts().add('bob', 'DBobAID456', { name: 'Bob' });
    await issuerDsl.contacts().add('carol', 'DCarolAID789', { name: 'Carol' });

    // Get initial KEL (1 event)
    const kel1 = await issuerStore.listKel(issuerAid);

    // Sync alice to current state
    await syncDsl.markKelSynced('alice', issuerAid, kel1[0].meta.d, kel1[0].meta.s);

    // Rotate keys
    const accountDsl = await issuerDsl.account('issuer');
    await accountDsl!.rotateKeys(issuerDsl.newMnemonic(seed2));

    // Sync bob to current state (includes rot)
    const kel2 = await issuerStore.listKel(issuerAid);
    await syncDsl.markKelSynced('bob', issuerAid, kel2[1].meta.d, kel2[1].meta.s);

    // Carol never synced

    // Check new events for each
    const aliceReport = await syncDsl.getNewKelEvents('alice', issuerAid);
    expect(aliceReport.newEvents).toBe(1); // rot event

    const bobReport = await syncDsl.getNewKelEvents('bob', issuerAid);
    expect(bobReport.newEvents).toBe(0); // Already synced

    const carolReport = await syncDsl.getNewKelEvents('carol', issuerAid);
    expect(carolReport.newEvents).toBe(2); // icp + rot
  });
});
