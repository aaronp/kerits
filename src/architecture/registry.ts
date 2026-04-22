import type { Capability, Domain, Functionality, Layer } from '@kerits/architecture';
import type { CapabilityId, DomainId, FunctionalityId, LayerId } from './legend.js';

// Layers
export const coreLayer: Layer<LayerId> = {
  id: 'core',
  description: 'Pure primitives, no I/O',
};

// Domains
export const saidDomain: Domain<DomainId> = {
  id: 'SAID',
  description: 'Self-Addressing Identifier',
};

// Capabilities
export const saidComputation: Capability<CapabilityId, DomainId, LayerId> = {
  id: 'said-computation',
  domain: saidDomain,
  layers: [coreLayer],
  purpose: 'Compute and verify SAIDs over structured objects',
  invariants: [
    {
      id: 'encode-and-verify-are-compatible',
      statement:
        'encodeSAID and validateSAID operate on the same canonical form, so any SAID produced by ' +
        'encodeSAID and written back to the d-field verifies true under validateSAID.',
    },
    {
      id: 'deterministic',
      statement: 'SAID is deterministic for a given canonical form',
    },
    {
      id: 'verification-rejects-mismatch',
      statement:
        'validateSAID returns false when the computed SAID does not match the declared SAID, ' +
        'whether due to object mutation or an invalid SAID string',
    },
  ],
};

export const keriSaidDerivation: Capability<CapabilityId, DomainId, LayerId> = {
  id: 'keri-said-derivation',
  domain: saidDomain,
  layers: [coreLayer],
  purpose:
    'Compute and verify KERI-compliant SAIDs for versioned artifacts such as KEL events, ' +
    'TEL events, and ACDC-related artifacts.',
  invariants: [
    {
      id: 'said-field-binding',
      statement:
        'Each artifact family declares the authoritative SAID field used for derivation and ' +
        'verification. Preimage construction replaces exactly that field with the required ' +
        'placeholder, sealing writes the derived SAID back to that same field, and ' +
        'verification recomputes against that same location.',
    },
    {
      id: 'placeholder-at-said-field',
      statement:
        'The preimage used to derive a SAID contains the KERI-required placeholder at the ' +
        'SAID field, so digest input is independent of any previously populated value at that field.',
    },
    {
      id: 'derivation-surface-isolates-signed-fields',
      statement:
        "Only fields defined by the artifact family's derivation surface contribute to the " +
        'SAID preimage; excluded fields do not affect the digest.',
    },
    {
      id: 'version-string-size-converges',
      statement:
        'For artifact families with a version string carrying encoded size, derivation ' +
        'converges on a final serialized form whose encoded size matches the size declared ' +
        'in the sealed artifact.',
    },
    {
      id: 'sealed-artifact-verifies-against-preimage',
      statement:
        'A sealed artifact verifies only when recomputation from its declared derivation ' +
        'surface yields the same SAID; mutation of any included field invalidates verification.',
    },
    {
      id: 'keri-canonical-serialization',
      statement:
        'SAID derivation uses the canonical serialization required by KERI for the artifact ' +
        'family, so equivalent artifacts derive the same SAID as other KERI-compliant implementations.',
    },
  ],
};

// KEL Domain
export const kelDomain: Domain<DomainId> = {
  id: 'KEL',
  description: 'Key Event Log — ordered append-only log of KERI key events',
};

// KEL Validation Capability
export const kelValidation: Capability<CapabilityId, DomainId, LayerId> = {
  id: 'kel-validation',
  domain: kelDomain,
  layers: [coreLayer],
  purpose: 'Validate structural and cryptographic correctness of KEL event sequences',
  invariants: [
    {
      id: 'said-integrity',
      statement:
        "Every event's d field must match the Blake3 digest of its canonical preimage with d (and i for inception) reset to placeholder",
    },
    { id: 'aid-derivation', statement: 'For inception events (icp/dip), i must equal d — the AID is the SAID' },
    { id: 'aid-consistency', statement: 'All events in a KEL must carry the same i value' },
    {
      id: 'sequence-monotonicity',
      statement:
        'Sequence numbers must start at "0" for inception and increment by exactly 1 for each subsequent event',
    },
    {
      id: 'previous-event-chain',
      statement: "Non-inception events' p field must equal the immediately preceding event's d",
    },
    { id: 'first-event-is-inception', statement: 'The first event in a KEL must have type icp or dip' },
    {
      id: 'signature-cryptographic-validity',
      statement:
        "All attached signatures must cryptographically verify against the event's canonical (RFC 8785) bytes using the referenced public keys",
    },
    {
      id: 'signing-key-source',
      statement:
        "Establishment events sign with their own k[]; interaction events sign with the most recent establishment event's k[]",
    },
    {
      id: 'signing-threshold-simple',
      statement: 'For simple integer thresholds, at least kt valid signatures must be present',
    },
    {
      id: 'signing-threshold-weighted',
      statement:
        'For weighted thresholds, the sum of weights for signed keys must reach >= 1.0 in every clause (AND semantics)',
    },
    {
      id: 'key-commitment-chain',
      statement:
        "Rotation event k[] keys must include pre-images whose digests match the prior establishment's n[] commitments, satisfying the prior nt threshold",
    },
    {
      id: 'non-transferable-finality',
      statement:
        'If the current establishment state has empty n[], the identifier is non-transferable — ALL subsequent events must be rejected',
    },
    {
      id: 'delegation-vrc-required',
      statement: 'Delegated events (dip/drt) must have a VRC attachment from the parent',
    },
    {
      id: 'delegation-vrc-signature',
      statement:
        "The parent's VRC signature must verify over the child event's canonical (RFC 8785) bytes using the parent's signing keys at the seal-referenced sequence",
    },
    {
      id: 'witness-threshold-satisfiable',
      statement: 'bt must not exceed the witness set size after applying any deltas',
    },
    {
      id: 'witness-receipt-threshold',
      statement:
        'In fully-witnessed mode, witness receipts (rct attachments) must meet bt; each receipt is counted at most once per witness AID',
    },
    {
      id: 'witness-delta-validity',
      statement: 'In rotation, br entries must exist in current witness set; ba entries must not already exist',
    },
    {
      id: 'config-eo-enforcement',
      statement: 'If inception c[] contains "EO" (establishment-only), interaction events must be rejected',
    },
    {
      id: 'config-dnd-enforcement',
      statement: 'If inception c[] contains "DND" (do-not-delegate), the identifier cannot serve as a delegator',
    },
    {
      id: 'config-trait-immutability',
      statement: 'Config traits from inception cannot be removed by rotation; rotation can only add traits',
    },
    { id: 'no-duplicate-signing-keys', statement: 'k[] must not contain duplicate public keys' },
    { id: 'no-duplicate-next-digests', statement: 'n[] must not contain duplicate digests' },
  ],
};

// KEL Validation Functionalities
export const validateSaid: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-said',
  capability: kelValidation,
  description: 'Verify event SAID integrity',
};
export const validateRequiredFields: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-required-fields',
  capability: kelValidation,
  description: 'Check required fields per event type',
};
export const validateAidRules: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-aid-rules',
  capability: kelValidation,
  description: 'AID derivation and consistency',
};
export const validateSequence: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-sequence',
  capability: kelValidation,
  description: 'Sequence monotonicity and first-event check',
};
export const validateChainLinkage: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-chain-linkage',
  capability: kelValidation,
  description: 'Previous event p-field chain integrity',
};
export const validateSignatures: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-signatures',
  capability: kelValidation,
  description: 'Cryptographic signature verification',
};
export const validateThreshold: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-threshold',
  capability: kelValidation,
  description: 'Simple and weighted threshold enforcement',
};
export const validateKeyRotation: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-key-rotation',
  capability: kelValidation,
  description: 'Key commitment chain and non-transferable finality',
};
export const validateDelegation: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-delegation',
  capability: kelValidation,
  description: 'VRC requirement and signature verification for delegated events',
};
export const validateWitnesses: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-witnesses',
  capability: kelValidation,
  description: 'Witness threshold, receipts, and delta validity',
};
export const validateConfigTraits: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-config-traits',
  capability: kelValidation,
  description: 'EO, DND, and trait immutability enforcement',
};
export const validateKeyUniqueness: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-key-uniqueness',
  capability: kelValidation,
  description: 'No duplicate keys in k[] or n[]',
};
export const validateChain: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'validate-chain',
  capability: kelValidation,
  description: 'End-to-end chain validation',
};

// Functionality
export const saidEncode: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'said-encode',
  capability: saidComputation,
  description: 'Compute the SAID for an object with a placeholder d-field',
};

export const saidVerify: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'said-verify',
  capability: saidComputation,
  description: 'Verify an object matches its declared SAID',
};

export const saidDerive: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'said-derive',
  capability: keriSaidDerivation,
  description:
    'Given an artifact and its derivation rules, construct the KERI-compliant preimage, ' +
    'derive the SAID, perform any required size convergence, and seal the artifact.',
};

export const saidRecompute: Functionality<FunctionalityId, CapabilityId, DomainId, LayerId> = {
  id: 'said-recompute',
  capability: keriSaidDerivation,
  description:
    'Given a sealed artifact and its derivation rules, reconstruct the derivation preimage, ' +
    'recompute the SAID, and compare it with the declared value.',
};

// Exhaustive lookup tables — the `satisfies Record<…Id, …>` clauses force every
// legend id to be covered at compile time. Never mutate these objects.
export const layers = {
  core: coreLayer,
} as const satisfies Record<LayerId, Layer<LayerId>>;

export const domains = {
  SAID: saidDomain,
  KEL: kelDomain,
} as const satisfies Record<DomainId, Domain<DomainId>>;

export const capabilities = {
  'said-computation': saidComputation,
  'keri-said-derivation': keriSaidDerivation,
  'kel-validation': kelValidation,
} as const satisfies Record<CapabilityId, Capability<CapabilityId, DomainId, LayerId>>;

export const functionality = {
  'said-encode': saidEncode,
  'said-verify': saidVerify,
  'said-derive': saidDerive,
  'said-recompute': saidRecompute,
  'validate-said': validateSaid,
  'validate-required-fields': validateRequiredFields,
  'validate-aid-rules': validateAidRules,
  'validate-sequence': validateSequence,
  'validate-chain-linkage': validateChainLinkage,
  'validate-signatures': validateSignatures,
  'validate-threshold': validateThreshold,
  'validate-key-rotation': validateKeyRotation,
  'validate-delegation': validateDelegation,
  'validate-witnesses': validateWitnesses,
  'validate-config-traits': validateConfigTraits,
  'validate-key-uniqueness': validateKeyUniqueness,
  'validate-chain': validateChain,
} as const satisfies Record<FunctionalityId, Functionality<FunctionalityId, CapabilityId, DomainId, LayerId>>;
