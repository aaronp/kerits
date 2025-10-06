/**
 * Example: Account key rotation and graph visualization
 *
 * Demonstrates AccountDSL with key rotation and graph building
 */

import { createKerStore, MemoryKv } from '../src/storage';
import { createKeritsDSL } from '../src/app/dsl';

async function main() {
  console.log('\n=== Account Key Rotation Example ===\n');

  // Setup
  const kv = new MemoryKv();
  const store = createKerStore(kv);
  const dsl = createKeritsDSL(store);

  // Create account with initial keys
  const initialSeed = new Uint8Array(32).fill(1);
  const initialMnemonic = dsl.newMnemonic(initialSeed);
  const account = await dsl.newAccount('alice', initialMnemonic);

  console.log('Created account:');
  console.log('  Alias:', account.alias);
  console.log('  AID:', account.aid);
  console.log('  Initial verfer:', account.verfer.substring(0, 20) + '...');

  // Get AccountDSL
  const accountDsl = await dsl.account('alice');
  if (!accountDsl) {
    throw new Error('Failed to get AccountDSL');
  }

  // Check initial KEL
  let kel = await accountDsl.getKel();
  console.log('\nInitial KEL:');
  kel.forEach((event, i) => {
    console.log(`  ${i}: ${event.t} (s=${event.s})`);
  });

  // Check initial graph
  let graph = await dsl.graph();
  console.log('\nInitial Graph:');
  console.log('  Nodes:', graph.nodes.length);
  console.log('  Edges:', graph.edges.length);
  console.log('  KEL events:', graph.nodes.filter(n => n.kind === 'KEL_EVT').length);

  // Perform first key rotation
  console.log('\n--- First Key Rotation ---');
  const rotation1Seed = new Uint8Array(32).fill(2);
  const rotation1Mnemonic = dsl.newMnemonic(rotation1Seed);
  const rotated1 = await accountDsl.rotateKeys(rotation1Mnemonic);

  console.log('Rotated keys:');
  console.log('  New verfer:', rotated1.verfer.substring(0, 20) + '...');
  console.log('  AID (unchanged):', rotated1.aid === account.aid ? '✓' : '✗');

  // Check KEL after first rotation
  kel = await accountDsl.getKel();
  console.log('\nKEL after first rotation:');
  kel.forEach((event, i) => {
    console.log(`  ${i}: ${event.t} (s=${event.s})`);
  });

  // Check graph after first rotation
  graph = await dsl.graph();
  console.log('\nGraph after first rotation:');
  console.log('  Nodes:', graph.nodes.length);
  console.log('  Edges:', graph.edges.length);
  console.log('  KEL events:', graph.nodes.filter(n => n.kind === 'KEL_EVT').length);
  console.log('  Prior edges:', graph.edges.filter(e => e.kind === 'PRIOR').length);

  // Perform second key rotation
  console.log('\n--- Second Key Rotation ---');
  const rotation2Seed = new Uint8Array(32).fill(3);
  const rotation2Mnemonic = dsl.newMnemonic(rotation2Seed);
  const rotated2 = await accountDsl.rotateKeys(rotation2Mnemonic);

  console.log('Rotated keys again:');
  console.log('  New verfer:', rotated2.verfer.substring(0, 20) + '...');

  // Final KEL
  kel = await accountDsl.getKel();
  console.log('\nFinal KEL:');
  kel.forEach((event, i) => {
    console.log(`  ${i}: ${event.t} (s=${event.s}, d=${event.d.substring(0, 12)}...)`);
  });

  // Final graph
  graph = await dsl.graph();
  console.log('\nFinal Graph:');
  console.log('  Nodes:', graph.nodes.length);
  console.log('  Edges:', graph.edges.length);
  console.log('  KEL events:', graph.nodes.filter(n => n.kind === 'KEL_EVT').length);
  console.log('  Prior edges:', graph.edges.filter(e => e.kind === 'PRIOR').length);

  // Detailed graph structure
  console.log('\nDetailed Graph Structure:');
  console.log('\nNodes:');
  graph.nodes.forEach(node => {
    console.log(`  - ${node.kind}: ${node.label || node.id.substring(0, 20) + '...'}`);
  });

  console.log('\nEdges:');
  graph.edges.forEach(edge => {
    console.log(`  - ${edge.kind}: ${edge.from.substring(0, 12)}... → ${edge.to.substring(0, 12)}...`);
  });

  // Demonstrate graph with multiple accounts
  console.log('\n--- Multiple Accounts ---');
  const bobSeed = new Uint8Array(32).fill(10);
  const bobMnemonic = dsl.newMnemonic(bobSeed);
  const bob = await dsl.newAccount('bob', bobMnemonic);

  console.log('Created second account (bob):', bob.aid.substring(0, 20) + '...');

  // Multi-account graph
  graph = await dsl.graph();
  console.log('\nGraph with multiple accounts:');
  console.log('  Total nodes:', graph.nodes.length);
  console.log('  AID nodes:', graph.nodes.filter(n => n.kind === 'AID').length);
  console.log('  KEL event nodes:', graph.nodes.filter(n => n.kind === 'KEL_EVT').length);

  // List all accounts
  const accountNames = await dsl.accountNames();
  console.log('\nAll accounts:', accountNames);

  console.log('\n=== Example Complete ===\n');
}

main().catch(console.error);
