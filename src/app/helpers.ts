/**
 * Functional helpers for KERI operations with storage
 *
 * Pure functions that combine kerits core functions with storage API
 */

import type { KerStore } from '../storage/types';
import { incept } from '../incept';
import { interaction } from '../interaction';
import { registryIncept, issue, revoke } from '../tel';
import { diger } from '../diger';
import { saidify } from '../saidify';

// Utility to serialize events as CESR-framed bytes
function serializeEvent(event: any): Uint8Array {
  const json = JSON.stringify(event);
  const versionString = event.v || 'KERI10JSON';
  const frameSize = json.length.toString(16).padStart(6, '0');
  const framed = `-${versionString}${frameSize}_${json}`;
  return new TextEncoder().encode(framed);
}

/**
 * Create a new identifier (KEL inception) with alias
 */
export async function createIdentity(
  store: KerStore,
  params: {
    alias: string;
    keys: string[];
    nextKeys: string[];
    witnesses?: string[];
    config?: string[];
  }
): Promise<{ aid: string; icp: any }> {
  const { alias, keys, nextKeys, witnesses = [], config = [] } = params;

  // Create inception event
  const icp = incept({
    keys,
    nextKeys,
    witnesses,
    wits: witnesses.length,
    toad: 0,
    config,
  });

  const aid = icp.pre;

  // Store inception event
  const rawCesr = serializeEvent(icp.ked);
  await store.putEvent(rawCesr);

  // Store alias mapping
  await store.putAlias('kel', aid, alias);

  return { aid, icp };
}

/**
 * Create a credential registry (TEL inception) with alias and anchor it in KEL
 */
export async function createRegistry(
  store: KerStore,
  params: {
    alias: string;
    issuerAid: string;
    backers?: string[];
    parentRegistryId?: string;
  }
): Promise<{ registryId: string; vcp: any; ixn: any }> {
  const { alias, issuerAid, backers = [], parentRegistryId } = params;

  // Create registry inception (vcp)
  const vcp = registryIncept({
    issuer: issuerAid,
    backers,
    nonce: '',
  });

  const registryId = vcp.sad.i;

  // Store registry inception
  const rawVcp = serializeEvent(vcp.sad);
  await store.putEvent(rawVcp);

  // If there's a parent registry, anchor in parent TEL instead of KEL
  if (parentRegistryId) {
    // Get parent registry's TEL to create anchoring event
    const { issue } = await import('../tel');

    const issData = issue({
      vcdig: registryId,  // The sub-registry is treated like a credential
      regk: parentRegistryId,  // Anchor in parent registry
    });

    const rawIss = serializeEvent(issData.sad);
    await store.putEvent(rawIss);
  } else {
    // Original behavior: anchor in KEL with interaction event
    const kelEvents = await store.listKel(issuerAid);
    const lastEvent = kelEvents[kelEvents.length - 1];

    if (!lastEvent) {
      throw new Error(`No KEL found for issuer: ${issuerAid}`);
    }

    const sn = kelEvents.length; // Next sequence number
    const priorSaid = lastEvent.meta.d;

    // Create interaction event that anchors the registry
    const ixn = interaction({
      pre: issuerAid,
      sn,
      dig: priorSaid,
      seals: [{
        i: registryId,
        d: vcp.sad.d,
      }],
    });

    // Store interaction event
    const rawIxn = serializeEvent(ixn.ked);
    await store.putEvent(rawIxn);
  }

  // Store alias mapping
  await store.putAlias('tel', registryId, alias);

  return { registryId, vcp, ixn: null };
}

/**
 * Create a schema with alias
 */
export async function createSchema(
  store: KerStore,
  params: {
    alias: string;
    schema: {
      title: string;
      description?: string;
      properties: Record<string, any>;
      required?: string[];
    };
  }
): Promise<{ schemaId: string; schema: any }> {
  const { alias, schema } = params;

  // Add 'd' field for SAID computation
  const schemaWithD = { ...schema, d: '' };

  // SAIDify the schema
  const saidified = saidify(schemaWithD);
  const schemaId = saidified.d;

  // Store schema as a special event
  // For now, we'll store it as a pseudo-event with type "schema"
  const schemaEvent = {
    v: 'KERI10JSON',
    t: 'schema',
    d: schemaId,
    ...saidified,
  };

  const rawSchema = serializeEvent(schemaEvent);
  await store.putEvent(rawSchema);

  // Store alias mapping
  await store.putAlias('schema', schemaId, alias);

  return { schemaId, schema: saidified };
}

/**
 * Issue a credential (ACDC) in a registry
 */
export async function issueCredential(
  store: KerStore,
  params: {
    registryId: string;
    schemaId: string;
    issuerAid: string;
    holderAid: string;
    credentialData: Record<string, any>;
  }
): Promise<{ credentialId: string; acdc: any; iss: any }> {
  const { registryId, schemaId, issuerAid, holderAid, credentialData } = params;

  // Create ACDC structure
  const acdc = {
    v: 'ACDC10JSON',
    d: '', // Will be filled by saidify
    i: issuerAid,
    ri: registryId,
    s: schemaId,
    a: {
      d: '', // Will be filled by saidify
      i: holderAid,
      ...credentialData,
    },
  };

  // SAIDify the ACDC
  const saidified = saidify(acdc);
  const credentialId = saidified.d;

  // Store ACDC as pseudo-event
  const acdcEvent = {
    v: 'ACDC10JSON',
    t: 'acdc',
    ...saidified,
  };

  const rawAcdc = serializeEvent(acdcEvent);
  await store.putEvent(rawAcdc);

  // Create issuance event in TEL
  const telEvents = await store.listTel(registryId);
  const sn = telEvents.length; // Next sequence number

  const iss = issue({
    vcdig: credentialId,
    regk: registryId,
  });

  // Store issuance event
  const rawIss = serializeEvent(iss.sad);
  await store.putEvent(rawIss);

  return { credentialId, acdc: saidified, iss };
}

/**
 * Revoke a credential in a registry
 */
export async function revokeCredential(
  store: KerStore,
  params: {
    registryId: string;
    credentialId: string;
  }
): Promise<{ rev: any }> {
  const { registryId, credentialId } = params;

  // Find the issuance event to get its SAID (dig)
  const telEvents = await store.listTel(registryId);
  const issEvent = telEvents.find(
    e => e.meta.t === 'iss' && e.meta.acdcSaid === credentialId
  );

  if (!issEvent) {
    throw new Error(`Issuance event not found for credential: ${credentialId}`);
  }

  // Create revocation event
  const rev = revoke({
    vcdig: credentialId,
    regk: registryId,
    dig: issEvent.meta.d, // Prior event digest is the issuance event SAID
  });

  // Store revocation event
  const rawRev = serializeEvent(rev.sad);
  await store.putEvent(rawRev);

  return { rev };
}

/**
 * Get entity by alias (resolves to ID first)
 */
export async function getByAlias(
  store: KerStore,
  scope: string,
  alias: string
): Promise<string | null> {
  return store.aliasToId(scope, alias);
}

/**
 * List all events for an identifier
 */
export async function listIdentityEvents(
  store: KerStore,
  aid: string
) {
  return store.listKel(aid);
}

/**
 * List all events for a registry
 */
export async function listRegistryEvents(
  store: KerStore,
  registryId: string
) {
  return store.listTel(registryId);
}
