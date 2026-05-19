import { describe, expect, test } from 'bun:test';
import type { AID, AidManifest, SAID, Timestamp } from '../../kel/types.js';
import {
  aidManifestToKelManifestData,
  kelManifestDataToAidManifest,
  latestSnFromKelManifestData,
  parseKelManifestWire,
  remoteRecordsFromKelManifestData,
} from '../kel-manifest-data.js';

const AID_VAL = 'ETestManifestDataAID0000000000000000000000' as AID;
const SAID0 = 'ESaid0_0000000000000000000000000000000000000000' as SAID;
const SAID1 = 'ESaid1_0000000000000000000000000000000000000000' as SAID;
const AT = '2026-05-18T00:00:00.000Z' as Timestamp;

const v1Manifest: AidManifest = {
  v: 'kerits-aid-manifest/1',
  aid: AID_VAL,
  latestSn: 1,
  ksnSaid: SAID1,
  ksnPath: `/.well-known/keri/aid/${AID_VAL}/ksn`,
  ksnUrl: `https://example.com/.well-known/keri/aid/${AID_VAL}/ksn`,
  events: [
    {
      sn: 0,
      said: SAID0,
      path: `/.well-known/keri/events/${SAID0}/event`,
      url: `https://example.com/.well-known/keri/events/${SAID0}/event`,
    },
    {
      sn: 1,
      said: SAID1,
      path: `/.well-known/keri/events/${SAID1}/event`,
      url: `https://example.com/.well-known/keri/events/${SAID1}/event`,
    },
  ],
};

describe('kel-manifest-data', () => {
  test('aidManifestToKelManifestData and round-trip via ksnSaid', () => {
    const v2 = aidManifestToKelManifestData(v1Manifest, AT);
    expect(v2.v).toBe('kerits-aid-manifest/2');
    expect(latestSnFromKelManifestData(v2)).toBe(1);

    const back = kelManifestDataToAidManifest(v2, SAID1);
    expect(back.latestSn).toBe(1);
    expect(back.events).toHaveLength(2);
    expect(back.events[0]!.said).toBe(SAID0);
  });

  test('parseKelManifestWire accepts v1 and v2', () => {
    const v2 = aidManifestToKelManifestData(v1Manifest, AT);
    expect(parseKelManifestWire(v2)?.version).toBe(2);
    expect(parseKelManifestWire(v1Manifest)?.version).toBe(1);
  });

  test('remoteRecordsFromKelManifestData includes manifest url', () => {
    const v2 = aidManifestToKelManifestData(v1Manifest, AT);
    const manifestUrl = `https://example.com/.well-known/keri/aid/${AID_VAL}/manifest`;
    const records = remoteRecordsFromKelManifestData(v2, AT, manifestUrl);
    expect(records.some((r) => r.resource.kind === 'kel.manifest' && r.resource.url === manifestUrl)).toBe(
      true,
    );
  });
});
