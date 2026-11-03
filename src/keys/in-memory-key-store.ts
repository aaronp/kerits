import { ed25519 } from '@noble/curves/ed25519.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { encodeKey } from '../cesr/keys.js';
import { encodeSig } from '../cesr/sigs.js';
import type { SigAlgo } from '../cesr/types.js';
import type { Algo as AlgoType } from '../common/algo.js';
import type { KeriKeyPair, PublicKey, SAID, Signature } from '../common/types.js';
import { hkdfBlake3 } from '../crypto/hkdf.js';
import { deriveSharedSecret, ed25519ToX25519Private, ed25519ToX25519Public } from '../crypto/x25519.js';
import type { Result } from '../result.js';
import { err, ok } from '../result.js';
import type { KeyAgreementInput } from '../signature/key-agreement.js';
import { MAX_HKDF_DERIVE_LENGTH } from '../signature/key-agreement.js';
import type { Ed25519Signer, Secp256k1Signer, Signer, UnexpectedAlgoError } from '../signature/signer.js';
import { isEd25519Signer } from '../signature/signer.js';
import { asRawPublicKey, publicKeyHex, toCESRPublicKey } from './raw-public-key.js';
import type {
  Algo,
  GeneratedKey,
  GenerateKeyError,
  KeyGenerator,
  KeyScope,
  KeyStore,
  RawPublicKey,
  ResolveKeyError,
} from './types.js';

type KeyEntry = { readonly privateKey: Uint8Array; readonly algo: Algo };

function makeSigner(publicKey: RawPublicKey, entry: KeyEntry): Signer {
  const cesrPub = toCESRPublicKey(publicKey);
  const textEncoder = new TextEncoder();
  const algo = entry.algo;

  const signBytes = async (data: Uint8Array): Promise<Signature> => {
    let rawSig: Uint8Array;
    if (algo === 'ed25519') {
      rawSig = ed25519.sign(data, entry.privateKey);
    } else if (algo === 'secp256k1') {
      // secp256k1.sign defaults to prehash: true (internal sha256)
      rawSig = secp256k1.sign(data, entry.privateKey);
    } else {
      throw new Error(`Unsupported algo: ${algo}`);
    }
    return encodeSig(rawSig, algo as SigAlgo).qb64 as Signature;
  };

  const signSaid = async (said: SAID): Promise<Signature> => {
    return signBytes(textEncoder.encode(said));
  };

  const exists = async (pk: PublicKey) => pk === cesrPub;

  if (algo === 'ed25519') {
    const signer: Ed25519Signer = {
      publicKey: cesrPub,
      algo: 'ed25519',
      exists,
      signBytes,
      signSaid,
      getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(entry.privateKey)),
      deriveX25519HkdfBlake3Key: async (input: KeyAgreementInput) => {
        if (input.peerPublicKey.length !== 32) {
          throw new Error(`Invalid peerPublicKey length: expected 32 bytes, got ${input.peerPublicKey.length}`);
        }
        if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
          throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
        }
        const x25519PrivateKey = ed25519ToX25519Private(entry.privateKey);
        const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
        return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
      },
    };
    return signer;
  }

  if (algo === 'secp256k1') {
    const signer: Secp256k1Signer = {
      publicKey: cesrPub,
      algo: 'secp256k1',
      compressedPublicKey: publicKey as Uint8Array,
      exists,
      signBytes,
      signSaid,
      signDigest: async (digest: Uint8Array): Promise<Uint8Array> => {
        return secp256k1.sign(digest, entry.privateKey, { prehash: false });
      },
    };
    return signer;
  }

  throw new Error(`Unsupported algo: ${algo}`);
}

function buildKeyStore(keys: Map<string, KeyEntry>, id: string): KeyStore {
  return {
    id,

    async hasKey(publicKey: RawPublicKey): Promise<boolean> {
      return keys.has(publicKeyHex(publicKey));
    },

    async resolve(publicKey: RawPublicKey): Promise<Result<KeyScope, ResolveKeyError>> {
      const entry = keys.get(publicKeyHex(publicKey));
      if (!entry) return err({ kind: 'key-not-found', publicKey });

      const withSignerFn = async <A>(fn: (signer: Signer) => Promise<A>): Promise<A> => {
        return fn(makeSigner(publicKey, entry));
      };

      return ok({
        withSigner: withSignerFn,
        withEd25519Signer: async <A>(
          fn: (signer: Ed25519Signer) => Promise<A>,
        ): Promise<Result<A, UnexpectedAlgoError>> => {
          return withSignerFn(async (signer) => {
            if (!isEd25519Signer(signer)) {
              return err({ kind: 'unexpected-algo' as const, expected: 'ed25519' as AlgoType, actual: signer.algo });
            }
            return ok(await fn(signer));
          });
        },
      });
    },

    // FIXME: TECH-DEBT — vault escape hatch for merits per-request signing.
    // Remove when merits moves to session tokens.
    async exportKeyPair(publicKey: RawPublicKey): Promise<Result<KeriKeyPair, ResolveKeyError>> {
      const entry = keys.get(publicKeyHex(publicKey));
      if (!entry) return err({ kind: 'key-not-found', publicKey });
      const pair: KeriKeyPair = {
        publicKey: toCESRPublicKey(publicKey),
        privateKey: encodeKey(entry.privateKey, true).qb64,
        transferable: true,
        algo: entry.algo as KeriKeyPair['algo'],
      };
      return ok(pair);
    },
  };
}

export namespace InMemoryKeyStores {
  export function create(): KeyStore & KeyGenerator {
    const keys = new Map<string, KeyEntry>();

    function generateOne(algo: Algo): GeneratedKey {
      if (algo === 'ed25519') {
        const privateKey = ed25519.utils.randomSecretKey();
        const publicKeyRaw = ed25519.getPublicKey(privateKey);
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return { publicKey, algo };
      } else if (algo === 'secp256k1') {
        const privateKey = secp256k1.utils.randomSecretKey();
        const publicKeyRaw = secp256k1.getPublicKey(privateKey, true); // compressed
        const publicKey = asRawPublicKey(publicKeyRaw);
        keys.set(publicKeyHex(publicKey), { privateKey, algo });
        return { publicKey, algo };
      } else {
        throw new Error(`Unsupported algo: ${algo}`);
      }
    }

    const SUPPORTED: Set<Algo> = new Set(['ed25519', 'secp256k1']);

    return {
      ...buildKeyStore(keys, 'in-memory'),

      supports(): Set<Algo> {
        return new Set(SUPPORTED);
      },

      async generate(algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>> {
        if (!SUPPORTED.has(algo)) return err({ kind: 'algo-not-supported', algo });
        return ok(generateOne(algo));
      },

      async generateBatch(algo: Algo, count: number): Promise<Result<readonly GeneratedKey[], GenerateKeyError>> {
        if (!SUPPORTED.has(algo)) return err({ kind: 'algo-not-supported', algo });
        const results: GeneratedKey[] = [];
        for (let i = 0; i < count; i++) {
          results.push(generateOne(algo));
        }
        return ok(results);
      },
    };
  }

  export function fromPrivateKey(privateKey: Uint8Array, algo: Algo): KeyStore {
    let publicKey: RawPublicKey;
    if (algo === 'ed25519') {
      publicKey = asRawPublicKey(ed25519.getPublicKey(privateKey));
    } else if (algo === 'secp256k1') {
      publicKey = asRawPublicKey(secp256k1.getPublicKey(privateKey, true));
    } else {
      throw new Error(`Unsupported algo: ${algo}`);
    }
    const keys = new Map<string, KeyEntry>([[publicKeyHex(publicKey), { privateKey, algo }]]);
    return buildKeyStore(keys, `from-private-key-${publicKeyHex(publicKey).slice(0, 8)}`);
  }
}
