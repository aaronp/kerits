import { describe, expect, test } from 'bun:test';
import {
  validateInceptionSignRequest,
  type ValidateInceptionSignRequestParams,
  type ExpectedCeremonyGovernance,
} from '../msig-sign-validation.js';
import { KELEvents } from '../events.js';
import { KeriKeyPairs } from '../../crypto/index.js';
import { digestVerfer } from '../../cesr/digest.js';
import { decodeKey } from '../../cesr/keys.js';
import { encodeSig } from '../../cesr/sigs.js';
import { sign } from '../../signature/primitives.js';
import type { Threshold, PublicKey, Signature } from '../../common/types.js';
import type { SAID } from '../../common/types.js';

// ── Test helpers ─────────────────────────────────────────────────────────────

function createTestIcpScenario(opts: { keyCount: number; threshold: Threshold }) {
  const pairs = Array.from({ length: opts.keyCount }, () => KeriKeyPairs.create());
  const nextPairs = Array.from({ length: opts.keyCount }, () => KeriKeyPairs.create());
  const nextDigests = nextPairs.map((p) => digestVerfer(p.publicKey));

  const { unsignedEvent } = KELEvents.buildIcp({
    keys: pairs.map((p) => p.publicKey),
    nextKeyDigests: nextDigests,
    signingThreshold: opts.threshold,
    nextThreshold: opts.threshold,
  });
  const finalized = KELEvents.computeSaid(unsignedEvent, true);

  // Orchestrator signs at index 0
  const orchestratorPrivRaw = decodeKey(pairs[0]!.privateKey).raw;
  const sigRaw = sign(finalized.canonFinal.raw, orchestratorPrivRaw);
  const orchestratorSig = encodeSig(sigRaw, true).qb64 as Signature;

  return {
    pairs,
    nextPairs,
    nextDigests,
    finalized,
    orchestratorSig,
    orchestratorPublicKey: pairs[0]!.publicKey as PublicKey,
  };
}

function buildValidParams(
  scenario: ReturnType<typeof createTestIcpScenario>,
  participantIndex: number,
  governance: ExpectedCeremonyGovernance,
): ValidateInceptionSignRequestParams {
  return {
    event: scenario.finalized.event,
    expectedEventSaid: scenario.finalized.said,
    governance,
    ownPublicKey: scenario.pairs[participantIndex]!.publicKey as PublicKey,
    ownNextKeyDigest: scenario.nextDigests[participantIndex]!,
    participantKeyIndex: participantIndex,
    orchestratorPublicKey: scenario.orchestratorPublicKey,
    orchestratorSignature: scenario.orchestratorSig,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('validateInceptionSignRequest', () => {
  const defaultThreshold: Threshold = '2';
  const defaultKeyCount = 3;

  function defaultGovernance(): ExpectedCeremonyGovernance {
    return {
      keyCount: defaultKeyCount,
      signingThreshold: defaultThreshold,
      nextThreshold: defaultThreshold,
    };
  }

  test('happy path: valid request passes all checks', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const params = buildValidParams(scenario, 1, defaultGovernance());
    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(true);
  });

  test('rejects when own public key not at expected index', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const wrongPair = KeriKeyPairs.create();
    const params = buildValidParams(scenario, 1, defaultGovernance());
    params.ownPublicKey = wrongPair.publicKey as PublicKey;

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('own-key-mismatch');
    }
  });

  test('rejects when own next key digest is swapped', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const params = buildValidParams(scenario, 1, defaultGovernance());
    params.ownNextKeyDigest = digestVerfer(KeriKeyPairs.create().publicKey);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('own-next-digest-mismatch');
    }
  });

  test('rejects when signing threshold mismatches', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const governance = defaultGovernance();
    governance.signingThreshold = '3'; // doesn't match event's '2'
    const params = buildValidParams(scenario, 1, governance);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('signing-threshold-mismatch');
    }
  });

  test('rejects when next threshold mismatches', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const governance = defaultGovernance();
    governance.nextThreshold = '3'; // doesn't match event's '2'
    const params = buildValidParams(scenario, 1, governance);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('next-threshold-mismatch');
    }
  });

  test('rejects when key count mismatches', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const governance = defaultGovernance();
    governance.keyCount = 5; // doesn't match event's 3
    const params = buildValidParams(scenario, 1, governance);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('key-count-mismatch');
    }
  });

  test('rejects when orchestrator signature is invalid', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const params = buildValidParams(scenario, 1, defaultGovernance());

    // Use a different key to produce an invalid signature
    const wrongPair = KeriKeyPairs.create();
    const wrongPrivRaw = decodeKey(wrongPair.privateKey).raw;
    const wrongSigRaw = sign(scenario.finalized.canonFinal.raw, wrongPrivRaw);
    params.orchestratorSignature = encodeSig(wrongSigRaw, true).qb64 as Signature;

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('orchestrator-sig-invalid');
    }
  });

  test('rejects when eventSaid does not match', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const params = buildValidParams(scenario, 1, defaultGovernance());
    params.expectedEventSaid = 'EfakeSAID_that_does_not_match_at_all_AAAAAAA' as SAID;

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('event-said-mismatch');
    }
  });

  test('rejects invalid event structure (wrong ilk)', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const params = buildValidParams(scenario, 1, defaultGovernance());
    // Mutate event type to simulate wrong ilk
    params.event = { ...params.event, t: 'rot' } as any;

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('invalid-event-structure');
    }
  });

  test('rejects when witness list mismatches', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const governance = defaultGovernance();
    governance.witnesses = ['EsomeWitnessAID_AAAAAAAAAAAAAAAAAAAAAAAA'];
    const params = buildValidParams(scenario, 1, governance);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('witnesses-mismatch');
    }
  });

  test('rejects when config traits mismatch', () => {
    const scenario = createTestIcpScenario({ keyCount: defaultKeyCount, threshold: defaultThreshold });
    const governance = defaultGovernance();
    governance.config = ['EO', 'DND']; // event has empty config by default
    const params = buildValidParams(scenario, 1, governance);

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('config-mismatch');
    }
  });

  test('passes when witnesses match expected', () => {
    // Build with explicit witnesses
    const pairs = Array.from({ length: 2 }, () => KeriKeyPairs.create());
    const nextPairs = Array.from({ length: 2 }, () => KeriKeyPairs.create());
    const nextDigests = nextPairs.map((p) => digestVerfer(p.publicKey));

    const { unsignedEvent } = KELEvents.buildIcp({
      keys: pairs.map((p) => p.publicKey),
      nextKeyDigests: nextDigests,
      signingThreshold: '2',
      nextThreshold: '2',
      witnesses: [],
      witnessThreshold: '0',
      config: ['EO'],
    });
    const finalized = KELEvents.computeSaid(unsignedEvent, true);

    const orchestratorPrivRaw = decodeKey(pairs[0]!.privateKey).raw;
    const sigRaw = sign(finalized.canonFinal.raw, orchestratorPrivRaw);
    const orchestratorSig = encodeSig(sigRaw, true).qb64 as Signature;

    const governance: ExpectedCeremonyGovernance = {
      keyCount: 2,
      signingThreshold: '2',
      nextThreshold: '2',
      witnesses: [],
      witnessThreshold: '0',
      config: ['EO'],
    };

    const params: ValidateInceptionSignRequestParams = {
      event: finalized.event,
      expectedEventSaid: finalized.said,
      governance,
      ownPublicKey: pairs[1]!.publicKey as PublicKey,
      ownNextKeyDigest: nextDigests[1]!,
      participantKeyIndex: 1,
      orchestratorPublicKey: pairs[0]!.publicKey as PublicKey,
      orchestratorSignature: orchestratorSig,
    };

    const result = validateInceptionSignRequest(params);
    expect(result.ok).toBe(true);
  });
});
