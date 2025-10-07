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
import type { KeyManager } from './keymanager';
import { signKelEvent, signTelEvent } from './signing';

// Utility to serialize events as CESR-framed bytes
function serializeEvent(event: any): Uint8Array {
  const json = JSON.stringify(event);
  // The event.v already contains the version string with size (e.g., "KERI10JSON0000fd_")
  // So we just prepend the '-' and append the JSON
  const versionString = event.v || 'KERI10JSON';
  const framed = `-${versionString}${json}`;
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
  },
  keyManager?: KeyManager
): Promise<{ aid: string; icp: any }> {
  const { alias, keys, nextKeys, witnesses = [], config = [] } = params;

  // Compute next key digests from next keys
  const nextDigests = nextKeys.map(key => diger(key));

  // Create inception event
  const icp = incept({
    keys,
    ndigs: nextDigests,
  });

  const aid = icp.pre;

  // Serialize event
  const eventBytes = serializeEvent(icp.ked);

  // Sign if keyManager provided
  let finalBytes = eventBytes;
  if (keyManager) {
    const signer = keyManager.getSigner(aid);
    if (!signer) {
      throw new Error(`Account not unlocked: ${aid}. Call keyManager.unlock() first.`);
    }

    // DEBUG: Log what we're signing
    if (globalThis.DEBUG_SIGNING) {
      console.log('[DEBUG createIdentity] Signing event:');
      console.log('  Event bytes length:', eventBytes.length);
      console.log('  Event text:', new TextDecoder().decode(eventBytes).substring(0, 150));
    }

    const signed = await signKelEvent(eventBytes, signer);
    finalBytes = signed.combined;

    if (globalThis.DEBUG_SIGNING) {
      console.log('  Signed combined length:', signed.combined.length);
    }
  }

  // Store signed event
  await store.putEvent(finalBytes);

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
  },
  keyManager?: KeyManager
): Promise<{ registryId: string; vcp: any; ixn: any }> {
  const { alias, issuerAid, backers = [], parentRegistryId } = params;

  // Create registry inception (vcp) with optional parent edge
  const vcp = registryIncept({
    issuer: issuerAid,
    backers,
    nonce: '',
    parent: parentRegistryId,  // Add parent edge if nested
  });

  const registryId = vcp.sad.i;

  // Serialize VCP
  const vcpBytes = serializeEvent(vcp.sad);

  // Sign VCP if keyManager provided
  let finalVcpBytes = vcpBytes;
  if (keyManager) {
    const signer = keyManager.getSigner(issuerAid);
    if (!signer) {
      throw new Error(`Issuer account not unlocked: ${issuerAid}`);
    }

    const signed = await signTelEvent(vcpBytes, signer);
    finalVcpBytes = signed.combined;
  }

  // Store signed VCP
  await store.putEvent(finalVcpBytes);

  // ALWAYS anchor in KEL with interaction event (even for nested registries)
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

  // Serialize IXN
  const ixnBytes = serializeEvent(ixn.ked);

  // Sign IXN if keyManager provided
  let finalIxnBytes = ixnBytes;
  if (keyManager) {
    const signer = keyManager.getSigner(issuerAid);
    if (!signer) {
      throw new Error(`Issuer account not unlocked: ${issuerAid}`);
    }

    const signed = await signKelEvent(ixnBytes, signer);
    finalIxnBytes = signed.combined;
  }

  // Store signed IXN
  await store.putEvent(finalIxnBytes);

  // If there's a parent registry, also anchor in parent TEL with IXN
  if (parentRegistryId) {
    // Get parent registry's TEL to create anchoring event
    const { interact } = await import('../tel');

    // Get parent TEL to find prior event and sequence number
    const parentTel = await store.listTel(parentRegistryId);

    if (parentTel.length === 0) {
      throw new Error(`Parent registry TEL is empty: ${parentRegistryId}`);
    }

    const lastEvent = parentTel[parentTel.length - 1];
    const sn = parentTel.length; // Next sequence number
    const priorDigest = lastEvent.meta.d;

    // Create TEL interaction event that anchors the child registry
    const ixnData = interact({
      vcdig: registryId,  // Child registry SAID (treated as credential SAID)
      regk: parentRegistryId,  // Parent registry identifier
      dig: priorDigest,  // Prior event in parent TEL
      sn,  // Sequence number in parent TEL
      data: {
        // Metadata indicating this is a registry anchor, not a credential
        registryAnchor: true,
        childRegistry: registryId,
      },
    });

    // Serialize parent TEL IXN
    const parentIxnBytes = serializeEvent(ixnData.sad);

    // Sign parent TEL IXN if keyManager provided
    let finalParentIxnBytes = parentIxnBytes;
    if (keyManager) {
      const signer = keyManager.getSigner(issuerAid);
      if (!signer) {
        throw new Error(`Issuer account not unlocked: ${issuerAid}`);
      }

      const signed = await signTelEvent(parentIxnBytes, signer);
      finalParentIxnBytes = signed.combined;
    }

    // Store signed parent TEL IXN
    await store.putEvent(finalParentIxnBytes);
  }

  // Store alias mapping
  await store.putAlias('tel', registryId, alias);

  return { registryId, vcp, ixn };
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
  },
  keyManager?: KeyManager
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

  // Store ACDC as pseudo-event (unsigned for now)
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

  // Serialize ISS
  const issBytes = serializeEvent(iss.sad);

  // Sign ISS if keyManager provided
  let finalIssBytes = issBytes;
  if (keyManager) {
    const signer = keyManager.getSigner(issuerAid);
    if (!signer) {
      throw new Error(`Issuer account not unlocked: ${issuerAid}`);
    }

    const signed = await signTelEvent(issBytes, signer);
    finalIssBytes = signed.combined;
  }

  // Store signed ISS event
  await store.putEvent(finalIssBytes);

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
    issuerAid: string;
  },
  keyManager?: KeyManager
): Promise<{ rev: any }> {
  const { registryId, credentialId, issuerAid } = params;

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

  // Serialize REV
  const revBytes = serializeEvent(rev.sad);

  // Sign REV if keyManager provided
  let finalRevBytes = revBytes;
  if (keyManager) {
    const signer = keyManager.getSigner(issuerAid);
    if (!signer) {
      throw new Error(`Issuer account not unlocked: ${issuerAid}`);
    }

    const signed = await signTelEvent(revBytes, signer);
    finalRevBytes = signed.combined;
  }

  // Store signed REV event
  await store.putEvent(finalRevBytes);

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
