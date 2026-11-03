import { SequenceNumber, Threshold } from '../common/types.js';
import { snOf } from './anchor-targets.js';
import type { CESREvent, KELEvent } from './types.js';

/* ------------------------------------------------------------------------------------------------
 * Input / Output types
 * ----------------------------------------------------------------------------------------------*/

export type DelegationValidationInput = {
  readonly childEvent: CESREvent;
  readonly parentKel?: readonly CESREvent[];
  readonly delegatorAid?: string;
};

export type DelegationValidationResult =
  | { passed: true; parentAid: string }
  | {
      passed: false;
      parentAid?: string;
      reason:
        | 'not-delegated'
        | 'missing-delegator-aid'
        | 'missing-seal-source'
        | 'missing-parent-kel'
        | 'parent-event-not-found'
        | 'parent-said-mismatch'
        | 'parent-aid-mismatch'
        | 'parent-signatures-invalid'
        | 'anchor-seal-missing';
    };

/* ------------------------------------------------------------------------------------------------
 * validateDelegation
 *
 * Pure function: validates a delegated event (dip or drt) by following the seal-source couple
 * to the parent KEL and verifying the cross-reference chain. No I/O — all data passed in.
 * ----------------------------------------------------------------------------------------------*/

export function validateDelegation(input: DelegationValidationInput): DelegationValidationResult {
  const { childEvent, parentKel, delegatorAid } = input;
  const event = childEvent.event;

  // 1. Is this a delegated event?
  if (event.t !== 'dip' && event.t !== 'drt') {
    return { passed: false, reason: 'not-delegated' };
  }

  // 2. Resolve delegator AID: dip carries `di`, drt requires the caller to supply it
  const parentAid: string | undefined = event.t === 'dip' ? event.di : delegatorAid;

  if (!parentAid) {
    return { passed: false, reason: 'missing-delegator-aid' };
  }

  // 3. Extract seal-source attachment pointing to the parent approving event
  const sealSource = childEvent.attachments.find((a) => a.kind === 'delegator-seal-source');
  if (!sealSource || sealSource.kind !== 'delegator-seal-source') {
    return { passed: false, parentAid, reason: 'missing-seal-source' };
  }

  // 4. Need parent KEL to validate
  if (!parentKel || parentKel.length === 0) {
    return { passed: false, parentAid, reason: 'missing-parent-kel' };
  }

  // 5. Find parent event at the sequence number referenced by the seal-source
  const targetSn = snOf(sealSource.s);
  const parentEvent = targetSn === undefined ? undefined : parentKel.find((e) => snOf(e.event.s) === targetSn);
  if (!parentEvent || targetSn === undefined) {
    return { passed: false, parentAid, reason: 'parent-event-not-found' };
  }

  // 6. Verify parent event SAID matches the seal-source digest
  if (parentEvent.event.d !== sealSource.d) {
    return { passed: false, parentAid, reason: 'parent-said-mismatch' };
  }

  // 7. Verify parent event belongs to the correct AID
  if (parentEvent.event.i !== parentAid) {
    return { passed: false, parentAid, reason: 'parent-aid-mismatch' };
  }

  // 8. Verify parent event has sufficient signatures (structural check)
  if (!verifyParentEventSignatures(parentEvent, parentKel, targetSn)) {
    return { passed: false, parentAid, reason: 'parent-signatures-invalid' };
  }

  // 9. Check that the parent event anchors a seal referencing the child event
  const anchors = (parentEvent.event as KELEvent & { a?: unknown[] }).a ?? [];
  const childSn = snOf(event.s);
  const childSnh = childSn === undefined ? undefined : SequenceNumber.encode(childSn);
  const hasAnchor = (anchors as Array<{ i?: string; s?: string; d?: string }>).some(
    // keripy compares the seal's s with the event's canonical hex (`dseal.s == serder.sner.numh`)
    (anchor) => childSnh !== undefined && anchor.i === event.i && anchor.s === childSnh && anchor.d === event.d,
  );
  if (!hasAnchor) {
    return { passed: false, parentAid, reason: 'anchor-seal-missing' };
  }

  return { passed: true, parentAid };
}

/* ------------------------------------------------------------------------------------------------
 * verifyParentEventSignatures — structural signature-count check
 *
 * Locates the most recent establishment event at or before `targetSn` in the parent KEL,
 * reads its key list and threshold, then checks the parent event has enough sig attachments.
 * ----------------------------------------------------------------------------------------------*/

function verifyParentEventSignatures(
  parentEvent: CESREvent,
  parentKel: readonly CESREvent[],
  targetSn: number,
): boolean {
  const establishmentTypes = new Set(['icp', 'rot', 'dip', 'drt']);
  let establishment: CESREvent | undefined;

  for (const e of parentKel) {
    const sn = snOf(e.event.s);
    if (sn === undefined || sn > targetSn) break;
    if (establishmentTypes.has(e.event.t)) {
      establishment = e;
    }
  }

  if (!establishment) return false;

  const estEvent = establishment.event as KELEvent & { k?: string[]; kt?: Threshold };
  const keys = estEvent.k;
  if (!keys || keys.length === 0) return false;

  const sigs = parentEvent.attachments.filter((a) => a.kind === 'sig');
  if (sigs.length === 0) return false;

  // signer index per attachment (a non-indexed signature stands for its position)
  const kt = Threshold.parse((estEvent.kt ?? '1') as Threshold, keys.length);
  const indices = sigs.map((s, i) => (s.kind === 'sig' && typeof s.keyIndex === 'number' ? s.keyIndex : i));
  return kt.ok ? Threshold.satisfied(kt.value, indices) : false;
}
