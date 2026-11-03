import { ACDC_ONLY_METADATA, type CredentialMetadataField, type HasCredential } from './types.js';

export const CredentialEligibility = {
  /** Self-asserted values cannot supply ACDC-only metadata; any such `required` entry makes them ineligible. */
  forSelfAsserted(r: HasCredential): { ok: true } | { ok: false; required: CredentialMetadataField[] } {
    const required = r.disclosure.metadata
      .filter((m) => m.required && ACDC_ONLY_METADATA.includes(m.field))
      .map((m) => m.field);
    return required.length === 0 ? { ok: true } : { ok: false, required };
  },
} as const;
