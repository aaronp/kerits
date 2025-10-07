/**
 * Test helpers for generating KEL/TEL events
 * Uses minimal mock events for testing storage layer
 */

/**
 * Create a test inception event with minimal valid structure
 */
export function createTestInception(suffix: string = '1') {
  const aid = `EAID_TEST_${suffix.padStart(40, '0')}`;
  const said = `ESAID_ICP_${suffix.padStart(40, '0')}`;
  const testKey = 'DKxy2sgzfplyr-tgwIxS19f2OchFHtLwPWD3v4oYimBx';

  const sad = {
    v: 'KERI10JSON00012a_',
    t: 'icp',
    d: said,
    i: aid,
    s: '0',
    kt: '1',
    k: [testKey],
    nt: '1',
    n: [testKey],
    bt: '0',
    b: [],
    c: [],
    a: []
  };

  // Create CESR-framed bytes
  const json = JSON.stringify(sad);
  const frameSize = json.length.toString(16).padStart(6, '0');
  const framed = `-${sad.v}${frameSize}_${json}`;
  const raw = new TextEncoder().encode(framed);

  return { sad, raw };
}

/**
 * Create a test registry inception event
 */
export function createTestRegistryInception(issuerAid: string) {
  const said = `ESAID_VCP_${issuerAid.slice(-16).padEnd(40, '0')}`;
  // For VCP events, the registry ID (ri) is the SAID itself
  const ri = said;

  const sad = {
    v: 'KERI10JSON00012a_',
    t: 'vcp',
    d: said,
    i: said,         // Registry identifier (same as SAID for VCP)
    ii: issuerAid,   // Issuer AID
    s: '0',
    bt: '0',
    b: [],
    c: [],
    ri: ri  // Registry ID is the VCP event SAID
  };

  // Create CESR-framed bytes
  const json = JSON.stringify(sad);
  const frameSize = json.length.toString(16).padStart(6, '0');
  const framed = `-${sad.v}${frameSize}_${json}`;
  const raw = new TextEncoder().encode(framed);

  return { sad, raw };
}

/**
 * Create a complete test KEL with registry
 */
export function createTestKelWithRegistry() {
  const identity = createTestInception('1');
  const { sad: icp, raw: icpRaw } = identity;

  const registry = createTestRegistryInception(icp.i);
  const { sad: vcpSad, raw: vcpRaw } = registry;

  return {
    identity: {
      aid: icp.i,
      icp: { sad: icp, raw: icpRaw }
    },
    registry: {
      ri: vcpSad.ri,
      vcp: { sad: vcpSad, raw: vcpRaw }
    }
  };
}
