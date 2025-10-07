/**
 * Test event storage and chain integrity
 *
 * This test verifies that:
 * 1. Events are stored with correct SAIDs
 * 2. Prior references correctly link events in the chain
 * 3. Sequence numbers are properly indexed
 * 4. Graph builder correctly represents event relationships
 */

import { describe, test, expect } from 'bun:test';
import { createKerStore } from '../src/storage/core';
import { MemoryKv } from '../src/storage/adapters/memory';
import { incept } from '../src/incept';
import { interaction } from '../src/interaction';
import { serializeEvent } from '../src/app/dsl/utils/serialization';

describe('Event Storage and Chain Integrity', () => {
  test('stores events with correct SAIDs and sequence indexing', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Create inception event
    const icp = incept({
      keys: ['DKxy2sgzfplyr-tgwIxS19f2OchFHtLwPWD3v4oYimBx'],
      ndigs: ['ELYk1bLRCb3IEUOr1ufLkp9y0oqM7PKXZWM7RRYbvhTl'],
    });

    const icpResult = await store.putEvent(serializeEvent(icp.ked));
    console.log('ICP SAID:', icpResult.said);
    console.log('ICP meta.d:', icpResult.meta.d);
    console.log('ICP meta.s:', icpResult.meta.s);
    console.log('ICP meta.i:', icpResult.meta.i);

    expect(icpResult.said).toBe(icpResult.meta.d);
    expect(icpResult.meta.s).toBe('0');
    expect(icpResult.meta.t).toBe('icp');

    // Create first interaction event
    const ixn1 = interaction({
      pre: icp.pre,
      sn: 1,
      dig: icp.ked.d,
      seals: [],
    });

    const ixn1Result = await store.putEvent(serializeEvent(ixn1.ked));
    console.log('\nIXN1 SAID:', ixn1Result.said);
    console.log('IXN1 meta.d:', ixn1Result.meta.d);
    console.log('IXN1 meta.s:', ixn1Result.meta.s);
    console.log('IXN1 meta.p (prior):', ixn1Result.meta.p);

    expect(ixn1Result.said).toBe(ixn1Result.meta.d);
    expect(ixn1Result.meta.s).toBe('1'); // Hex string for sequence 1
    expect(ixn1Result.meta.p).toBe(icp.ked.d); // Prior should be ICP SAID
    expect(ixn1Result.meta.t).toBe('ixn');

    // Create second interaction event
    const ixn2 = interaction({
      pre: icp.pre,
      sn: 2,
      dig: ixn1.ked.d,
      seals: [],
    });

    const ixn2Result = await store.putEvent(serializeEvent(ixn2.ked));
    console.log('\nIXN2 SAID:', ixn2Result.said);
    console.log('IXN2 meta.d:', ixn2Result.meta.d);
    console.log('IXN2 meta.s:', ixn2Result.meta.s);
    console.log('IXN2 meta.p (prior):', ixn2Result.meta.p);

    expect(ixn2Result.said).toBe(ixn2Result.meta.d);
    expect(ixn2Result.meta.s).toBe('2'); // Hex string for sequence 2
    expect(ixn2Result.meta.p).toBe(ixn1.ked.d); // Prior should be IXN1 SAID
    expect(ixn2Result.meta.t).toBe('ixn');

    // Verify chain integrity by retrieving KEL
    const kel = await store.listKel(icp.pre);
    console.log('\nKEL length:', kel.length);
    console.log('KEL events:', kel.map(e => ({ t: e.meta.t, s: e.meta.s, d: e.meta.d, p: e.meta.p })));

    expect(kel.length).toBe(3);
    expect(kel[0].meta.d).toBe(icp.ked.d);
    expect(kel[1].meta.d).toBe(ixn1.ked.d);
    expect(kel[2].meta.d).toBe(ixn2.ked.d);

    // Verify prior chain
    expect(kel[0].meta.p).toBeUndefined(); // ICP has no prior
    expect(kel[1].meta.p).toBe(kel[0].meta.d); // IXN1 prior is ICP
    expect(kel[2].meta.p).toBe(kel[1].meta.d); // IXN2 prior is IXN1

    // Verify getByPrior works correctly
    const eventsAfterIcp = await store.getByPrior(icp.ked.d);
    expect(eventsAfterIcp.length).toBe(1);
    expect(eventsAfterIcp[0].meta.d).toBe(ixn1.ked.d);

    const eventsAfterIxn1 = await store.getByPrior(ixn1.ked.d);
    expect(eventsAfterIxn1.length).toBe(1);
    expect(eventsAfterIxn1[0].meta.d).toBe(ixn2.ked.d);
  });

  test('graph builder correctly links events via PRIOR edges', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Create a simple chain
    const icp = incept({
      keys: ['DKxy2sgzfplyr-tgwIxS19f2OchFHtLwPWD3v4oYimBx'],
      ndigs: ['ELYk1bLRCb3IEUOr1ufLkp9y0oqM7PKXZWM7RRYbvhTl'],
    });
    await store.putEvent(serializeEvent(icp.ked));

    const ixn1 = interaction({
      pre: icp.pre,
      sn: 1,
      dig: icp.ked.d,
      seals: [],
    });
    await store.putEvent(serializeEvent(ixn1.ked));

    const ixn2 = interaction({
      pre: icp.pre,
      sn: 2,
      dig: ixn1.ked.d,
      seals: [],
    });
    await store.putEvent(serializeEvent(ixn2.ked));

    // Build graph
    const graph = await store.buildGraph();
    console.log('\nGraph nodes:', graph.nodes.map(n => ({ id: n.id.substring(0, 20), kind: n.kind, label: n.label })));
    console.log('Graph edges:', graph.edges.map(e => ({
      from: e.from.substring(0, 20),
      to: e.to.substring(0, 20),
      kind: e.kind
    })));

    // Verify nodes exist
    const kelNodes = graph.nodes.filter(n => n.kind === 'KEL_EVT');
    expect(kelNodes.length).toBe(3); // ICP, IXN1, IXN2

    // Verify PRIOR edges
    const priorEdges = graph.edges.filter(e => e.kind === 'PRIOR');
    console.log('\nPRIOR edges:', priorEdges.map(e => ({
      from: e.from.substring(0, 20),
      to: e.to.substring(0, 20),
    })));

    expect(priorEdges.length).toBe(2); // ICP->IXN1, IXN1->IXN2

    // Verify edge from ICP to IXN1
    const edge1 = priorEdges.find(e => e.from === icp.ked.d && e.to === ixn1.ked.d);
    expect(edge1).toBeDefined();
    console.log('Edge ICP->IXN1:', edge1);

    // Verify edge from IXN1 to IXN2
    const edge2 = priorEdges.find(e => e.from === ixn1.ked.d && e.to === ixn2.ked.d);
    expect(edge2).toBeDefined();
    console.log('Edge IXN1->IXN2:', edge2);
  });

  test('sequence numbers stored and retrieved correctly in hex format', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);

    // Create events with various sequence numbers
    const icp = incept({
      keys: ['DKxy2sgzfplyr-tgwIxS19f2OchFHtLwPWD3v4oYimBx'],
      ndigs: ['ELYk1bLRCb3IEUOr1ufLkp9y0oqM7PKXZWM7RRYbvhTl'],
    });
    const icpResult = await store.putEvent(serializeEvent(icp.ked));

    let prevDig = icp.ked.d;
    const ixnResults = [];

    // Create 15 interaction events (sequence 1-15, hex: 1-f)
    for (let sn = 1; sn <= 15; sn++) {
      const ixn = interaction({
        pre: icp.pre,
        sn,
        dig: prevDig,
        seals: [],
      });
      const result = await store.putEvent(serializeEvent(ixn.ked));
      ixnResults.push(result);
      prevDig = ixn.ked.d;

      console.log(`Seq ${sn} (hex: ${sn.toString(16)}): meta.s = "${result.meta.s}"`);

      // Verify sequence number is stored as hex string
      expect(result.meta.s).toBe(sn.toString(16));
    }

    // Retrieve KEL and verify order
    const kel = await store.listKel(icp.pre);
    console.log('\nKEL retrieved in order:');
    kel.forEach(e => {
      const seqNum = parseInt(e.meta.s || '0', 16);
      console.log(`  Seq ${seqNum} (hex: ${e.meta.s}): ${e.meta.d.substring(0, 20)}`);
    });

    expect(kel.length).toBe(16); // ICP + 15 IXNs

    // Verify events are in correct order
    for (let i = 0; i < kel.length; i++) {
      const expectedSeq = i.toString(16);
      expect(kel[i].meta.s).toBe(expectedSeq);
    }
  });
});
