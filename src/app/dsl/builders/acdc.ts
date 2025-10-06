/**
 * ACDCDSL - ACDC (credential) operations
 */

import type { KerStore } from '../../../storage/types';
import type { ACDCDSL, ACDC, Registry, CredentialStatus, ExportDSL } from '../types';
import { revokeCredential } from '../../helpers';
import { exportAcdc } from './export';

/**
 * Create an ACDCDSL for a specific ACDC
 */
export function createACDCDSL(
  acdc: ACDC,
  registry: Registry,
  store: KerStore
): ACDCDSL {
  return {
    acdc,
    registry,

    async revoke(): Promise<void> {
      await revokeCredential(store, {
        registryId: registry.registryId,
        credentialId: acdc.credentialId,
      });
    },

    async status(): Promise<CredentialStatus> {
      // Get TEL events for this registry
      const telEvents = await store.listTel(registry.registryId);

      // Find events related to this credential
      for (const event of telEvents.reverse()) {
        if (event.meta.acdcSaid === acdc.credentialId) {
          if (event.meta.t === 'rev') {
            return CredentialStatus.Revoked;
          }
          if (event.meta.t === 'iss') {
            return CredentialStatus.Issued;
          }
        }
      }

      return CredentialStatus.Issued;
    },

    async graph(): Promise<any> {
      // For now, return global graph
      // TODO: Filter to only this ACDC's events
      return store.buildGraph();
    },

    async export(): Promise<ExportDSL> {
      return exportAcdc(
        store,
        acdc.credentialId,
        registry.registryId,
        acdc.issuerAid
      );
    },
  };
}
