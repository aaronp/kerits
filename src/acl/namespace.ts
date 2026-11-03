import type { AID } from '../common/types.js';

/** Well-known owner group for an AID. */
export function ownerGroupId(aid: AID): string {
  return `aid:${aid}/__owner__`;
}
