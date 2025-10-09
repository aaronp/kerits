/**
 * RegistryDSL - Credential registry operations
 */

import type { KerStore } from '../../../storage/types';
import type { RegistryDSL, Registry, Account, IssueParams, TelEvent, GraphOptions, ExportDSL, IndexedRegistry, IndexedACDC } from '../types';
import type { ACDCDSL } from '../types';
import type { KeyManager } from '../../keymanager';
import type { ExportOptions } from '../types/sync';
import { createACDCDSL } from './acdc';
import { exportTel } from './export';
import { TELIndexer } from '../../indexer/index.js';
import { WriteTimeIndexer } from '../../indexer/write-time-indexer';

/**
 * Create a RegistryDSL for a specific registry
 */
export function createRegistryDSL(
  registry: Registry,
  account: Account,
  store: KerStore,
  keyManager?: KeyManager
): RegistryDSL {
  return {
    registry,
    account,

    async issue(params: IssueParams): Promise<ACDCDSL> {
      const { issueCredential } = await import('../../helpers');

      // Validate params
      if (!params.schema) {
        throw new Error('Schema is required');
      }
      if (!params.holder) {
        throw new Error('Holder is required');
      }

      // Ensure account is unlocked if keyManager is available
      if (keyManager && !keyManager.isUnlocked(account.aid)) {
        const unlocked = await keyManager.unlockFromStore(account.aid);
        if (!unlocked) {
          throw new Error(`Account ${account.aid} is locked. Call keyManager.unlock() first or provide mnemonic.`);
        }
      }

      // Resolve schema
      let schemaId = params.schema;
      if (!schemaId.startsWith('E')) {
        // Assume it's an alias
        const resolvedSchemaId = await store.aliasToId('schema', params.schema);
        if (!resolvedSchemaId) {
          throw new Error(`Schema not found: ${params.schema}`);
        }
        schemaId = resolvedSchemaId;
      }

      // Resolve holder
      let holderAid = params.holder;
      if (!holderAid.startsWith('D') && !holderAid.startsWith('E')) {
        // Assume it's an alias
        const resolvedHolderAid = await store.aliasToId('kel', params.holder);
        if (!resolvedHolderAid) {
          throw new Error(`Holder account not found: ${params.holder}`);
        }
        holderAid = resolvedHolderAid;
      }

      // Issue credential
      const { credentialId, acdc, iss } = await issueCredential(store, {
        registryId: registry.registryId,
        schemaId,
        issuerAid: account.aid,
        holderAid,
        credentialData: params.data,
        edges: params.edges,
      }, keyManager);

      // Store ISS event metadata with signatures and keys (for IPEX export)
      const issMetaKey = {
        path: ['acdc', credentialId, 'iss-meta'],
        type: 'json' as const,
        meta: { immutable: true },
      };
      const encodeJson = (obj: any) => new TextEncoder().encode(JSON.stringify(obj));
      await store.kv.putStructured!(issMetaKey, encodeJson(iss.sad));

      // Store alias if provided
      if (params.alias) {
        // Check if alias already exists
        const existingCredentialId = await store.getAliasSaid('acdc', params.alias);
        if (existingCredentialId) {
          throw new Error(`Credential alias "${params.alias}" already exists`);
        }
        await store.putAlias('acdc', credentialId, params.alias);
      }

      const acdcObj = {
        alias: params.alias,
        credentialId,
        registryId: registry.registryId,
        schemaId,
        issuerAid: account.aid,
        holderAid,
        data: params.data,
        issuedAt: new Date().toISOString(),
        edges: params.edges,
        issEvent: iss.sad.d, // Store ISS event SAID for traversal
      };

      return createACDCDSL(acdcObj, registry, store, keyManager);
    },

    async acdc(alias: string): Promise<ACDCDSL | null> {
      const credentialId = await store.aliasToId('acdc', alias);
      if (!credentialId) {
        return null;
      }

      // Get credential data from JSON storage (dual storage fix)
      const acdcData = await store.getACDC(credentialId);
      if (!acdcData) {
        console.warn(`ACDC data not found for ${alias} (${credentialId})`);
        return null;
      }

      // Find the ISS event SAID from TEL
      let issEventSaid: string | undefined;
      try {
        const telEvents = await store.listTel(acdcData.ri || registry.registryId);
        const issEvent = telEvents.find(e =>
          e.meta.t === 'iss' && e.meta.i === credentialId
        );
        if (issEvent) {
          issEventSaid = issEvent.meta.d;
        }
      } catch (error) {
        console.warn(`Could not find ISS event for ${alias} (${credentialId})`, error);
      }

      // Build ACDC object from stored data
      const acdcObj: ACDC = {
        alias,
        credentialId,
        registryId: acdcData.ri || registry.registryId,
        schemaId: acdcData.s || '',
        issuerAid: acdcData.i || account.aid,
        holderAid: acdcData.a?.i || '',
        data: acdcData.a || {},
        issuedAt: acdcData.dt || new Date().toISOString(),
        issEvent: issEventSaid, // Store ISS event SAID for traversal
      };

      return createACDCDSL(acdcObj, registry, store, keyManager);
    },

    async listACDCs(): Promise<string[]> {
      // Get all ACDC aliases
      const allAcdcAliases = await store.listAliases('acdc');
      const filteredAliases: string[] = [];

      // Filter to only include ACDCs that belong to this registry
      for (const alias of allAcdcAliases) {
        const credentialId = await store.getAliasSaid('acdc', alias);
        if (!credentialId) {
          continue;
        }

        // Get the ACDC data
        const acdcData = await store.getACDC(credentialId);
        if (!acdcData) {
          continue;
        }

        // Check if this ACDC belongs to this registry
        if (acdcData.ri === registry.registryId) {
          filteredAliases.push(alias);
        }
      }

      return filteredAliases;
    },

    async getTel(): Promise<TelEvent[]> {
      const { parseCesrStream, parseIndexedSignatures } = await import('../../signing');

      const events = await store.listTel(registry.registryId);

      // Parse each event to extract signatures and full event data
      return events.map(e => {
        let signatures: Array<{index: number; signature: string}> | undefined;
        let eventData: any = {};

        // Parse signatures and event JSON from raw CESR
        try {
          const parsed = parseCesrStream(e.raw);

          // Parse signatures
          if (parsed.signatures) {
            signatures = parseIndexedSignatures(parsed.signatures);
          }

          // Parse event JSON to get all fields
          const eventText = new TextDecoder().decode(parsed.event);
          const jsonStart = eventText.indexOf('{');
          if (jsonStart >= 0) {
            eventData = JSON.parse(eventText.substring(jsonStart));
          }
        } catch (err) {
          console.error(`Failed to parse TEL event ${e.meta.d}:`, err);
          throw err;
        }

        return {
          ...eventData,  // Full event fields
          t: e.meta.t,
          d: e.meta.d,
          ri: e.meta.ri,
          s: e.meta.s,
          signatures,
          raw: e.raw,
        };
      });
    },

    async export(options?: ExportOptions): Promise<ExportDSL> {
      return exportTel(store, registry.registryId, account.aid, options);
    },

    async index(): Promise<IndexedRegistry> {
      const indexer = new TELIndexer(store);
      return indexer.indexRegistry(registry.registryId);
    },

    async listCredentials(): Promise<IndexedACDC[]> {
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexRegistry(registry.registryId);
      return indexed.credentials;
    },

    async revoke(credentialId: string): Promise<void> {
      const { revokeCredential } = await import('../../helpers');

      // Ensure account is unlocked if keyManager is available
      if (keyManager && !keyManager.isUnlocked(account.aid)) {
        const unlocked = await keyManager.unlockFromStore(account.aid);
        if (!unlocked) {
          throw new Error(`Account ${account.aid} is locked. Call keyManager.unlock() first or provide mnemonic.`);
        }
      }

      // Validate credential exists and belongs to this registry
      const indexer = new TELIndexer(store);
      const indexed = await indexer.indexRegistry(registry.registryId);
      const credential = indexed.credentials.find(c => c.credentialId === credentialId);

      if (!credential) {
        throw new Error(`Credential not found in registry: ${credentialId}`);
      }

      if (credential.status === 'revoked') {
        throw new Error(`Credential already revoked: ${credentialId}`);
      }

      // Revoke the credential
      await revokeCredential(store, {
        registryId: registry.registryId,
        credentialId,
        issuerAid: account.aid,
      }, keyManager);

      // Note: Credential status will be updated automatically when re-indexed
      // The TEL indexer reads the revocation event and sets status='revoked'
    },

    async accept(params: { credential: any; issEvent?: any; alias?: string }): Promise<ACDCDSL> {
      const { credential, issEvent, alias } = params;

      // Parse credential if it's a string (SAID only)
      let credentialObj: any;
      let credentialId: string;

      if (typeof credential === 'string') {
        // Just a SAID - we need the full credential object
        // For now, we'll create a minimal placeholder
        credentialId = credential;
        credentialObj = {
          d: credentialId,
          v: 'ACDC10JSON',
          i: '', // Unknown issuer
          ri: registry.registryId,
          s: '', // Unknown schema
          a: { d: '', i: account.aid }, // Holder is current account
        };
      } else {
        // Full credential object
        credentialObj = credential;
        credentialId = credential.d;

        if (!credentialId) {
          throw new Error('Invalid credential: missing SAID (d field)');
        }

        // Update registry ID to the holder's registry (Bob accepting Alice's credential)
        // This allows the credential to appear in Bob's registry while preserving the original issuer
        credentialObj = {
          ...credentialObj,
          ri: registry.registryId,
        };
      }

      // Serialize and store the ACDC
      const serializeEvent = (event: any): Uint8Array => {
        const json = JSON.stringify(event);
        const versionString = event.v || 'ACDC10JSON';
        const frameSize = json.length.toString(16).padStart(6, '0');
        const framed = `-${versionString}${frameSize}_${json}`;
        return new TextEncoder().encode(framed);
      };

      const acdcEvent = {
        ...credentialObj,
        t: 'acdc',
      };

      const rawAcdc = serializeEvent(acdcEvent);
      await store.putEvent(rawAcdc);

      // Store ACDC as JSON for quick retrieval (dual storage pattern)
      const acdcKey = {
        path: ['acdc', credentialId],
        type: 'json' as const,
        meta: { immutable: true },
      };
      const encodeJson = (obj: any) => new TextEncoder().encode(JSON.stringify(obj));
      await store.kv.putStructured!(acdcKey, encodeJson(credentialObj));

      // Store original ISS event metadata if provided (for IPEX re-export)
      // This preserves the issuer's signature and public keys
      if (issEvent) {
        const issMetaKey = {
          path: ['acdc', credentialId, 'iss-meta'],
          type: 'json' as const,
          meta: { immutable: true },
        };
        await store.kv.putStructured!(issMetaKey, encodeJson(issEvent));
      }

      // Create an issuance event in the holder's registry so the credential shows up in their TEL
      // This represents the holder accepting/anchoring the credential in their registry
      const { issue } = await import('../../../tel');

      const issData = issue({
        vcdig: credentialId,
        regk: registry.registryId,
      });

      const rawIss = serializeEvent(issData.sad);

      // Sign ISS event with holder's keys if keyManager available
      let finalIssBytes = rawIss;
      if (keyManager) {
        const { signTelEvent } = await import('../../signing');
        const signer = keyManager.getSigner(account.aid);
        if (signer) {
          const signed = await signTelEvent(rawIss, signer);
          finalIssBytes = signed.combined;
        }
      }

      // Store signed ISS event
      await store.putEvent(finalIssBytes);

      // ===== INDEXER UPDATE: ISS event (credential acceptance) =====
      // Add the acceptance ISS event to the indexer for graph visualization
      try {
        await WriteTimeIndexer.withStore(store).addTelEvent(registry.registryId, finalIssBytes);
      } catch (error) {
        // If indexer update fails (e.g., unsigned event), log but don't fail the operation
        console.warn(`Failed to index credential acceptance: ${error}`);
      }

      // Store alias if provided
      if (alias) {
        await store.putAlias('acdc', credentialId, alias);

        // ===== INDEXER UPDATE: ACDC alias =====
        await WriteTimeIndexer.withStore(store).setAlias('ACDCs', credentialId, alias);
      }

      // Create ACDC DSL object
      const acdcObj = {
        alias,
        credentialId,
        registryId: registry.registryId,
        schemaId: credentialObj.s || '',
        issuerAid: credentialObj.i || '',
        holderAid: credentialObj.a?.i || account.aid,
        data: credentialObj.a || {},
        issuedAt: issData.sad.dt || new Date().toISOString(),
      };

      return createACDCDSL(acdcObj, registry, store, keyManager);
    },

    async createRegistry(alias: string, opts?: any): Promise<RegistryDSL> {
      const { createRegistry: createRegistryHelper } = await import('../../helpers');

      // Check if alias already exists
      const existingRegistryId = await store.getAliasSaid('tel', alias);
      if (existingRegistryId) {
        throw new Error(`Registry alias "${alias}" already exists`);
      }

      // Ensure account is unlocked if keyManager is available
      if (keyManager && !keyManager.isUnlocked(account.aid)) {
        const unlocked = await keyManager.unlockFromStore(account.aid);
        if (!unlocked) {
          throw new Error(`Account ${account.aid} is locked. Call keyManager.unlock() first or provide mnemonic.`);
        }
      }

      // Create sub-registry anchored in this registry's TEL
      const { registryId } = await createRegistryHelper(store, {
        alias,
        issuerAid: account.aid,
        backers: opts?.backers || [],
        parentRegistryId: registry.registryId,  // Pass parent registry ID
      }, keyManager);

      const subRegistry = {
        alias,
        registryId,
        issuerAid: account.aid,
        createdAt: new Date().toISOString(),
        parentRegistryId: registry.registryId,  // Set parent registry ID
      };

      return createRegistryDSL(subRegistry, account, store, keyManager);
    },
  };
}
