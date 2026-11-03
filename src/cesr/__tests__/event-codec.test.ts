import { describe, expect, it } from 'bun:test';
import { SequenceNumber } from '../../common/types.js';
import { Matter, MtrDex } from 'cesr-ts/src/matter';
import { canonicalizeEvent } from '../../kel/event-crypto.js';
import type { CESREvent } from '../../kel/types.js';
import { decodeBase64Url, encodeBase64Url } from '../../common/base64url.js';
import { KeriKeyPairs } from '../../crypto/index.js';
import { Signers } from '../../signature/index.js';
import { decodeCesrStream, encodeCesrEvent, encodeCesrStream } from '../event-codec.js';

const sig = new Matter({ raw: new Uint8Array(64), code: MtrDex.Ed25519_Sig }).qb64;
const said = (n: number) => new Matter({ raw: new Uint8Array(32).fill(n), code: MtrDex.Blake3_256 }).qb64;

// setup helper: unsigned-body-only ixn with one controller sig, no bytesB64
function makeIxn(sn: number, prior: string): CESREvent {
  return {
    event: { v: 'KERI10JSON000000_', t: 'ixn', d: said(sn), i: said(0), s: SequenceNumber.encode(sn), p: prior, a: [] } as never,
    attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }],
    enc: 'JSON',
  };
}

describe('event-codec', () => {
  it('encodes canonical signed bytes when bytesB64 is absent', () => {
    // setup: event without bytesB64
    const cesr = makeIxn(1, said(9));
    // call our method under test
    const bytes = encodeCesrEvent(cesr);
    // assertions: body prefix equals the exact canonical signed bytes
    const body = canonicalizeEvent(cesr.event);
    expect(bytes.subarray(0, body.length)).toEqual(body);
  });

  it('round-trips a stream of two events with attachments', () => {
    // setup: two events
    const a = makeIxn(1, said(9));
    const b = makeIxn(2, a.event.d as string);
    // call our method under test
    const out = decodeCesrStream(encodeCesrStream([a, b]));
    // assertions: order and attachments preserved
    expect(out.map((e) => e.event.d)).toEqual([a.event.d, b.event.d]);
    expect(out[1]!.attachments).toEqual(b.attachments);
  });

  describe('non-ASCII bodies (byte framing)', () => {
    const keyPair = KeriKeyPairs.fromSeedNumber(1);
    const signer = Signers.fromKeyPair(keyPair);

    // setup helper: ixn whose signed body carries unicode `a` data, signed over those exact bytes
    async function makeSignedUnicodeIxn(sn: number, prior: string, name: string): Promise<CESREvent> {
      const event = {
        v: 'KERI10JSON000000_',
        t: 'ixn',
        d: said(sn),
        i: said(0),
        s: SequenceNumber.encode(sn),
        p: prior,
        a: [{ n: name }],
      } as never;
      const body = canonicalizeEvent(event);
      const sig = await signer.signBytes(body);
      return {
        event,
        attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }],
        bytesB64: encodeBase64Url(body),
        enc: 'JSON',
      };
    }

    it('decodes a non-ASCII event to byte-identical body bytes with verifying signatures', async () => {
      // setup: one signed event whose body holds multi-byte UTF-8 text
      const ev = await makeSignedUnicodeIxn(1, said(9), 'Zoë ✓');
      const body = decodeBase64Url(ev.bytesB64!);
      expect(body.length).toBeGreaterThan(new TextDecoder().decode(body).length);

      // call our method under test
      const [out, ...rest] = decodeCesrStream(encodeCesrStream([ev]));

      // assertions: exact body bytes, same event and signatures, signature verifies over decoded bytes
      expect(rest).toEqual([]);
      expect(decodeBase64Url(out!.bytesB64!)).toEqual(body);
      expect(out!.event).toEqual(ev.event);
      expect(out!.attachments).toEqual(ev.attachments);
      const att = out!.attachments[0]!;
      if (att.kind !== 'sig') throw new Error(`expected sig attachment, got ${att.kind}`);
      expect(Signers.verify(keyPair.publicKey, att.sig, decodeBase64Url(out!.bytesB64!))).toBe(true);
    });

    it('encodes a non-ASCII event without bytesB64 as its canonical signed bytes', async () => {
      // setup: unicode ixn signed over its canonical bytes, bytesB64 omitted (canonical fallback path)
      const event = {
        v: 'KERI10JSON000000_',
        t: 'ixn',
        d: said(1),
        i: said(0),
        s: '1',
        p: said(9),
        a: [{ n: 'Zoë ✓' }],
      } as never;
      const signed = canonicalizeEvent(event);
      const sig = await signer.signBytes(signed);
      const ev: CESREvent = { event, attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }], enc: 'JSON' };

      // call our method under test
      const out = decodeCesrStream(encodeCesrStream([ev]));

      // assertions: decoded body is exactly the signed canonical bytes, and the signature verifies over it
      expect(out.length).toBe(1);
      const body = decodeBase64Url(out[0]!.bytesB64!);
      expect(body).toEqual(signed);
      expect(out[0]!.attachments).toEqual(ev.attachments);
      expect(Signers.verify(keyPair.publicKey, sig, body)).toBe(true);
    });

    it('decodes the event after a non-ASCII event at the right byte offset', async () => {
      // setup: non-ASCII first event, ASCII second event
      const first = await makeSignedUnicodeIxn(1, said(9), 'Zoë ✓ 日本 🎉');
      const second = makeIxn(2, first.event.d as string);

      // call our method under test
      const out = decodeCesrStream(encodeCesrStream([first, second]));

      // assertions: both events, in order, exact bytes and attachments
      expect(out.map((e) => e.event.d)).toEqual([first.event.d, second.event.d]);
      expect(decodeBase64Url(out[0]!.bytesB64!)).toEqual(decodeBase64Url(first.bytesB64!));
      expect(decodeBase64Url(out[1]!.bytesB64!)).toEqual(canonicalizeEvent(second.event));
      expect(out[0]!.attachments).toEqual(first.attachments);
      expect(out[1]!.attachments).toEqual(second.attachments);
    });

    it('frames by bytes when a body does not round-trip through a string (invalid UTF-8)', async () => {
      // setup: signed body with a raw 0xFF byte inside a string value (decodes to U+FFFD, 3 bytes), then a second event
      const ascii = canonicalizeEvent({
        v: 'KERI10JSON000000_',
        t: 'ixn',
        d: said(1),
        i: said(0),
        s: '1',
        p: said(9),
        a: [{ n: 'Zo?' }],
      } as never);
      const body = ascii.slice();
      body[ascii.indexOf('?'.charCodeAt(0))] = 0xff;
      const sig = await signer.signBytes(body);
      const first: CESREvent = {
        event: JSON.parse(new TextDecoder().decode(body)),
        attachments: [{ kind: 'sig', form: 'indexed', keyIndex: 0, sig }],
        bytesB64: encodeBase64Url(body),
        enc: 'JSON',
      };
      const second = makeIxn(2, said(1));

      // call our method under test
      const out = decodeCesrStream(encodeCesrStream([first, second]));

      // assertions: exact first body bytes, verifying signature, second event found at the right offset
      expect(out.length).toBe(2);
      expect(decodeBase64Url(out[0]!.bytesB64!)).toEqual(body);
      expect(out[0]!.attachments).toEqual(first.attachments);
      expect(Signers.verify(keyPair.publicKey, sig, decodeBase64Url(out[0]!.bytesB64!))).toBe(true);
      expect(out[1]!.event).toEqual(second.event);
      expect(out[1]!.attachments).toEqual(second.attachments);
    });
  });
});
