// packages/core/src/keys/fake-hsm-key-store.ts
import { ed25519 } from '@noble/curves/ed25519.js';
import { encodeSig } from '../cesr/sigs.js';
import type { Algo } from '../common/algo.js';
import type { PublicKey, SAID, Signature } from '../common/types.js';
import { hkdfBlake3 } from '../crypto/hkdf.js';
import { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from '../crypto/x25519.js';
import type { Result } from '../result.js';
import { err, ok } from '../result.js';
import type { KeyAgreementInput } from '../signature/key-agreement.js';
import { MAX_HKDF_DERIVE_LENGTH } from '../signature/key-agreement.js';
import type { Ed25519Signer, Signer, UnexpectedAlgoError } from '../signature/signer.js';
import { isEd25519Signer } from '../signature/signer.js';
import { asRawPublicKey, publicKeyHex, toCESRPublicKey } from './raw-public-key.js';
import type {
  GeneratedKey,
  GenerateKeyError,
  KeyGenerator,
  KeyScope,
  KeyStore,
  RawPublicKey,
  ResolveKeyError,
} from './types.js';

export namespace FakeHsmKeyStores {
  let counter = 0;

  export function create(): KeyStore & KeyGenerator {
    const keys = new Map<string, { privateKey: Uint8Array; algo: Algo }>();
    const id = `fake-hsm:${counter++}`;

    return {
      id,

      async hasKey(publicKey: RawPublicKey): Promise<boolean> {
        return keys.has(publicKeyHex(publicKey));
      },

      async resolve(publicKey: RawPublicKey): Promise<Result<KeyScope, ResolveKeyError>> {
        const entry = keys.get(publicKeyHex(publicKey));
        if (!entry) return err({ kind: 'key-not-found', publicKey });

        const cesrPub = toCESRPublicKey(publicKey);
        const textEncoder = new TextEncoder();

        const signer: Ed25519Signer = {
          publicKey: cesrPub,
          algo: 'ed25519',
          exists: async (pk: PublicKey) => pk === cesrPub,
          signBytes: async (data: Uint8Array): Promise<Signature> => {
            const rawSig = ed25519.sign(data, entry.privateKey);
            return encodeSig(rawSig, 'ed25519').qb64 as Signature;
          },
          signSaid: async (said: SAID): Promise<Signature> => {
            const saidBytes = textEncoder.encode(said);
            const rawSig = ed25519.sign(saidBytes, entry.privateKey);
            return encodeSig(rawSig, 'ed25519').qb64 as Signature;
          },
          getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(entry.privateKey)),
          deriveX25519HkdfBlake3Key: async (input: KeyAgreementInput) => {
            if (input.peerPublicKey.length !== 32) {
              throw new Error(`Invalid peerPublicKey length: expected 32, got ${input.peerPublicKey.length}`);
            }
            if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
              throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
            }
            const x25519PrivateKey = ed25519ToX25519Private(entry.privateKey);
            const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
            return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
          },
        };

        const withSignerFn = async <A>(fn: (s: Signer) => Promise<A>): Promise<A> => fn(signer);

        return ok({
          withSigner: withSignerFn,
          withEd25519Signer: async <A>(
            fn: (s: Ed25519Signer) => Promise<A>,
          ): Promise<Result<A, UnexpectedAlgoError>> => {
            return withSignerFn(async (s) => {
              if (!isEd25519Signer(s)) {
                return err({ kind: 'unexpected-algo' as const, expected: 'ed25519' as Algo, actual: s.algo });
              }
              return ok(await fn(s));
            });
          },
        });
      },

      supports(): Set<Algo> {
        return new Set(['ed25519']);
      },

      async generate(algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>> {
        if (algo !== 'ed25519') return err({ kind: 'algo-not-supported', algo });
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKeyRaw = ed25519.getPublicKey(privateKey);
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return ok({ publicKey, algo });
      },

      async generateBatch(algo: Algo, count: number): Promise<Result<readonly GeneratedKey[], GenerateKeyError>> {
        if (algo !== 'ed25519') return err({ kind: 'algo-not-supported', algo });
        const results: GeneratedKey[] = [];
        for (let i = 0; i < count; i++) {
          const privateKey = ed25519.utils.randomSecretKey();
          const publicKeyRaw = ed25519.getPublicKey(privateKey);
          const publicKey = asRawPublicKey(publicKeyRaw);
          keys.set(publicKeyHex(publicKey), { privateKey, algo });
          results.push({ publicKey, algo });
        }
        return ok(results);
      },
    };
  }
}
