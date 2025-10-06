/**
 * Generate sample KERI data for demo purposes
 */

import { MemoryKv, createKerStore, DefaultJsonCesrParser, CesrHasher } from '../../src/storage';
import { createKeritsDSL } from '../../src/app/dsl';

export async function generateSampleData() {
  const hasher = new CesrHasher();
  const parser = new DefaultJsonCesrParser(hasher);
  const store = createKerStore(new MemoryKv(), { parser, hasher });
  const dsl = createKeritsDSL(store);

  // Create accounts
  const seed1 = new Uint8Array(32).fill(1);
  const seed2 = new Uint8Array(32).fill(2);
  const seed3 = new Uint8Array(32).fill(3);

  const issuerMnemonic = dsl.newMnemonic(seed1);
  const holderMnemonic = dsl.newMnemonic(seed2);

  const issuer = await dsl.newAccount('health-provider', issuerMnemonic);
  const holder = await dsl.newAccount('patient-alice', holderMnemonic);

  // Rotate issuer keys once
  const issuerDsl = await dsl.account('health-provider');
  await issuerDsl!.rotateKeys(dsl.newMnemonic(seed3));

  // Create schema
  await dsl.createSchema('blood-pressure', {
    title: 'Blood Pressure Reading',
    properties: {
      systolic: { type: 'number' },
      diastolic: { type: 'number' },
      timestamp: { type: 'string' },
    },
    required: ['systolic', 'diastolic'],
  });

  // Create registry
  const registryDsl = await issuerDsl!.createRegistry('health-records');

  // Issue credentials
  await registryDsl.issue({
    alias: 'alice-bp-reading-1',
    schema: 'blood-pressure',
    holder: holder.aid,
    data: {
      systolic: 120,
      diastolic: 80,
      timestamp: new Date().toISOString(),
    },
  });

  await registryDsl.issue({
    alias: 'alice-bp-reading-2',
    schema: 'blood-pressure',
    holder: holder.aid,
    data: {
      systolic: 118,
      diastolic: 78,
      timestamp: new Date().toISOString(),
    },
  });

  // Add contacts
  await dsl.contacts().add('witness-1', 'EWitness1AID...', {
    name: 'Primary Witness',
    role: 'witness',
  });

  await dsl.contacts().add('alice', holder.aid, {
    name: 'Alice (Patient)',
    role: 'patient',
  });

  // Get graph
  const graph = await dsl.graph();

  return {
    store,
    dsl,
    graph,
    accounts: {
      issuer,
      holder,
    },
  };
}
