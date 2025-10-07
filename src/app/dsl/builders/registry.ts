/**
 * RegistryDSL - Credential registry operations
 */

import type { KerStore } from '../../../storage/types';
import type { RegistryDSL, Registry, Account, IssueParams, TelEvent, GraphOptions, ExportDSL, IndexedRegistry, IndexedACDC } from '../types';
import type { ACDCDSL } from '../types';
import { createACDCDSL } from './acdc';
import { exportTel } from './export';
import { TELIndexer } from '../../indexer/index.js';

/**
 * Create a RegistryDSL for a specific registry
 */
export function createRegistryDSL(
  registry: Registry,
  account: Account,
  store: KerStore
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
      const { credentialId, acdc } = await issueCredential(store, {
        registryId: registry.registryId,
        schemaId,
        issuerAid: account.aid,
        holderAid,
        credentialData: params.data,
      });

      // Store alias if provided
      if (params.alias) {
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
      };

      return createACDCDSL(acdcObj, registry, store);
    },

    async acdc(alias: string): Promise<ACDCDSL | null> {
      const credentialId = await store.aliasToId('acdc', alias);
      if (!credentialId) {
        return null;
      }

      // Get credential from storage
      const stored = await store.getEvent(credentialId);
      if (!stored) {
        return null;
      }

      // Extract ACDC data from stored event
      // This is a simplified version - in production, parse the full ACDC
      const acdcObj = {
        alias,
        credentialId,
        registryId: registry.registryId,
        schemaId: '', // Would extract from stored event
        issuerAid: account.aid,
        holderAid: '', // Would extract from stored event
        data: {},
        issuedAt: stored.meta.dt || '',
      };

      return createACDCDSL(acdcObj, registry, store);
    },

    async listACDCs(): Promise<string[]> {
      return store.listAliases('acdc');
    },

    async getTel(): Promise<TelEvent[]> {
      const events = await store.listTel(registry.registryId);
      return events.map(e => ({
        t: e.meta.t,
        d: e.meta.d,
        ri: e.meta.ri,
        s: e.meta.s,
        ...e.meta,
      }));
    },

    async graph(opts?: GraphOptions): Promise<any> {
      // For now, return global graph
      // TODO: Filter to only this registry's events
      return store.buildGraph(opts);
    },

    async export(): Promise<ExportDSL> {
      return exportTel(store, registry.registryId, account.aid);
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
      });

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

      // Store issuance event if provided
      if (issEvent) {
        const rawIss = serializeEvent(issEvent);
        await store.putEvent(rawIss);
      }

      // Store alias if provided
      if (alias) {
        await store.putAlias('acdc', credentialId, alias);
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
        issuedAt: issEvent?.dt || new Date().toISOString(),
      };

      return createACDCDSL(acdcObj, registry, store);
    },
  };
}
