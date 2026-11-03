// packages/core/src/keys/test-keys.ts
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
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

export type TestKeyEntry = {
  readonly privateKey: Uint8Array;
  readonly publicKey: Uint8Array;
};

export type TestKey = { readonly privateKey: Uint8Array; readonly publicKey: Uint8Array; readonly cesr: PublicKey };
export type TestKeyStream = Iterable<TestKey> & { readonly name: string; at(n: number): TestKey };

const streams = new Map<string, TestKey[]>();

function h(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

// 100 pre-computed ed25519 public keys. Private key[i] = [i, 0, ..., 0] (32 bytes).
// Static data avoids ed25519.getPublicKey() at module load time.
// prettier-ignore
const DEFAULT_PUBLIC_KEYS: readonly Uint8Array[] = [
  h('3b6a27bcceb6a42d62a3a8d02a6f0d73653215771de243a63ac048a18b59da29'),
  h('cecc1507dc1ddd7295951c290888f095adb9044d1b73d696e6df065d683bd4fc'),
  h('6b79c57e6a095239282c04818e96112f3f03a4001ba97a564c23852a3f1ea5fc'),
  h('dadbd184a2d526f1ebdd5c06fdad9359b228759b4d7f79d66689fa254aad8546'),
  h('9be3287795907809407e14439ff198d5bfc7dce6f9bc743cb369146f610b4801'),
  h('f4bd46521ce7b57899ae6f4ca09eddec689327a86a2232d4a3f2a4f39ac68a9e'),
  h('34790764308e0b7b5f7cc9d5cdd29845fd82a03df53d2cffef3c0228547487c5'),
  h('a2fa2f4a355ba2e907a53009e9e37caddf7ac7e66a08ba07631f553072b3f24c'),
  h('d4c5061b81c4682b27a0cfc6459cd9d7892eb60a43f73dd1060b6c478aa7c3d8'),
  h('bb5c672482b0dcca91a21a4ed63b15afde8aa1378da72cd01b349589d6e7dd6a'),
  h('513523c8b48319b649d7d4d4e613232fd9c13f41029d4bc5f74d6eceb91afe9f'),
  h('7380a4b28d0b49b46e7ca1e4369949c8eb733ff90b69b3530d7e83f073900979'),
  h('2ebbc3db123aa602b343f36e3e16b89dc231e0310545a39ce8a7936734f8bf15'),
  h('52946d19dc2048375ace8aa02c16af4bbf74af25d927538c50708eb81c0259d1'),
  h('015743be93526e88156aa0a8349cd6b15344b28ae7f2ab3faf5e340b4a0c1ec4'),
  h('e8d8764d05e660a0228b6cb2cb05510e6786a90caa797a6b80f22336e9f9205f'),
  h('69104ef20c6676aacc9e8c291800d1b7e911e20f85b4066156ea118ace44b8d7'),
  h('66e0b858e462a609e66fe71370c816d8846ff103d5499a22a7fec37fdbc424a7'),
  h('36c6f5085341d70d0c03529fe0077810fccaa4e28f219dd572c51e785d0f211c'),
  h('40368d866508fb8c1bef7445eac4068ccf4e3fe4cefbdda6e8608fdb10f3c40a'),
  h('ccfff852fc48efcc4508341574bb62d55bde5b7538025bfb0e6f08dae1b8d307'),
  h('3e55e9643a89e218d9015c1bad3826c7e25bdedaecdbd35e28f49cffb036900c'),
  h('2eb8a0b367663669983548a2efbec9e374e12292269133ad4ff23ceca96082bf'),
  h('551918e0e5f9efcdd4c081283151cfad5cb51a02eb3bec60d252bc03d59e87b0'),
  h('f59a736de10e003f94d8666adbc9956dd4d4edec234fc3b928e1d64a1d582c5e'),
  h('a7dd374a251450d3ecb318ff253a4927fede63fc98c5adb16e6635ca1f1574a6'),
  h('2756d438412e9b5f62579f60d4958b72530a932f3a0c82321df0ef12c88dfd95'),
  h('b9fb480e83d7ef8dc9886fcb40b542fc40365a58a5bc7a52551859d884850ec1'),
  h('7f8fb14ad91cf5c45d83e48377b3a64fdb44dd87aadce8de4a422de46a547bea'),
  h('c46b9b93480bb0be3c0e2fc2ebd203f63a215bde9ac8666472b58681d419d226'),
  h('bfe35a12c9e09dcd4da128f26d7b02f913cbce54ff09a16df97295140544f225'),
  h('a07c418a770a346d49a3a7f972d94108e9f893acbea3ec34e56b42d3f5234da9'),
  h('3be533822b146a67b7649397f6fdcde0451233eda282997fe31c4dcc0a9b09fb'),
  h('c745e46b13e26a10c3c2b63f3fde24c80e69fa61b494ef2f05838922d3a72973'),
  h('a89b3a640e5e202d2a9ede77f3b4d55146284a1e302cdc0463e71dd09f0fe623'),
  h('c935c76bded59c80b25ae7dd3294ea49e9660b31134e11c5fd11547aa55e60fe'),
  h('5d9bf4c12b9a04ff35134c292258ad3ff1bef526847c891cc3bf248d755b6e29'),
  h('8fc03690fb3e677926c6b4f7e2623a5a3675bb33acbe4c1c4bd5f1a08b2e847c'),
  h('764e77c91486f0e9182eeba10dc3b28908f463ec8478b64ef8e969fbd32cbb68'),
  h('c3d0367fcec340329c620240aac2fdcffb3d14901eabacba5ef7c6ee6a7c09c7'),
  h('d8d3e9d73a5294a04c783c03fff49e24f872e52d44d5dfeba9847c39798fb971'),
  h('f916453547be8d5d8c2221737387519c5434e8f6f16ec021a1befb798fa620ca'),
  h('e1ef2fe6f211f7399a8a6a55fdc811ee92ec7f01ee125942da87ef659553499f'),
  h('1ba66c6751506850ae0787244c69476b6d45fb857a914a5a0445a24253f7b810'),
  h('f868bcc508133899cc47b612e4f7d9d5dacc90ce1f28214a97b651baa00bf6e4'),
  h('ee37d8c8e9cf42a34cfa75ff1141e2bc0ff2f37483f064dce47cb4d5e69db1d4'),
  h('264a0707979e0d6691f74b055429b5f318d39c2883bb509310b67424252e9ef2'),
  h('423f53a61e2a19302955ddc230ea82374133ed2c229de86733f57bb8481e6180'),
  h('0448bc58ab745fe9099a774f9a0ad8243a7519429d5e3103040e634d9cf25db7'),
  h('ebe80b7cadea277ac05fb85c7164fe15ebd6873c4a74b3296a462a1026fd9b0f'),
  h('50c4a5871ad3379f2879d12cef750d1211633283a9c3730238e6ddf084db4c8a'),
  h('8461a06f7c3c0cf1111ad70da871ba9b00ffb601073e7b5705dfabcfad043cd5'),
  h('97eb816a49b0475b783ff50033f8348ff7d40570aa5ab5347bb8d04bf7909870'),
  h('b0aaed00758b90d8eb5acc641f6f6ce3bcebe9e5a378b67af1b54e78335358c5'),
  h('5434f7a2bf3dac47304180e9e8a756c2c4a733d5160a911a1a2c85438eb1fd7b'),
  h('25974de26089481b49416cbfa2cb9eaa7e10c68ffa48a5ffd03985baca9a4bca'),
  h('31559d7941c3c9a82ea05cb0d5e80bc90f06ea4925dc81ef320df55d6186f0b6'),
  h('7584b83df6e968128ef701bf66fe298c8ae8eceea504bf7afd0d62347e255cb4'),
  h('e38434e4e9588fd5fb743ec39999ca38d9b3260c51f08b7a875341c303e8f4e0'),
  h('0ec39fd3a1a69a01e8eec48b82197277911b081f40856d78eb1c9bd6f15d7a22'),
  h('5fb0681d3c72487d2971db2ba11f01cc3eb022d76dd95e266cb8c0fa07fcf370'),
  h('c095e7ac75854b3f244363a1cefd66827e55d1766924ef2ed5ef597c22f140c6'),
  h('f5174b5e2388e953d701f38c8a4b0627308b17c9dcf9ee3a48b67766e87f3765'),
  h('71e9c7be0b0fef2bcd5dc79c69b252973d5b3adc4dd4d3adb5f65c9bb448f7cc'),
  h('f538cbdd2a80daa5148c7711e4de667eabdc90f61fbd1a9aedbdff4780dad5e1'),
  h('39f46305fd9225f564694469157e8896d7f72a8ce1daa70beb7e9e176568439e'),
  h('ccbc3da2c4267cc8553be0c7b5790cc75a121297528462c3d2cc679d16eb8684'),
  h('6f7e716f4d2c8f14cd26c027c167610cfffefa9c61aa045006e299be8b98487f'),
  h('e536020ed01e3f19b1944e380c7f0dae7203785d546f79df16b55efc303e79ab'),
  h('b4f05aee172965774743f4cd7de4c3621c9e36fd77af7139aafec25eb3fb3360'),
  h('42da1d19dfee0eee94d5c3dbb6312abeeea5ac9dffb301da3f5daeee81344aec'),
  h('4edaf5275f0d85ddb33f33b42a2a71b109228f92f64691373bb4cf7a2be972be'),
  h('16d3d01cb223ac47d817949be3d84aa6b2cbb833cbaf07b1fbbd647a72e37836'),
  h('324e93a07a9c768fc4fd22d4c5a6ec665af5e695b2d5ac035fa845b72cbad78b'),
  h('6745500eda4ab1ad47d2ce855c4a9f4604f89abca2a4561cf0d9ccaacb0c0700'),
  h('ec0769247912711195823944cbc3c097ea64c534c847a7993f3ea371b044df2e'),
  h('804b280f80fd41d46a54e0bde219ff3a0389d2b37083e1b79b3c49d244c8bf3f'),
  h('44e4cdcb73aa16e9cb47d55194bd86aabb71bdfedb598122b92b38923d7422a1'),
  h('e13482b97d32676a1d1a5cf2d75ba8ec3da9eb0250eebaeef27143c690e75c27'),
  h('e02e50da342a234646fc1670fdaadc8fbb3914f522a40f0eede7ea222e6df8f3'),
  h('edd9ea5fb5d9e56029339953bf9e2ff264a378ab0f75b03a46b50535401a6337'),
  h('85ba958f4c79484c41fc68119441e79079eb3a2d2d6cc75f3a8d415eb57ed39d'),
  h('41048d12a17c404084bdef649765aa5001cc268c7e9392795a23730e07952b36'),
  h('ddd125cb0f01d4f2bad7447669023fe2393b98c53f430cb091a1d68d2238396b'),
  h('b2243554d1c149d00a2419d762fa3846260dfeb00b405a773f0c8ccfb747e591'),
  h('ecf12498c9e51c180ebe649e4f0eaa1f394415571f42db76ff0c35c345feda2b'),
  h('9fd8db3ce25c826c641e96ef8b2e55337554fb55f5010a43e35a6b9911e06ec4'),
  h('f83d82c42bededa12ed3606a8cda6a7dbe130703e1c61736721c898d5524371e'),
  h('45c87e1243ad22d079d905789757ee66a5fd672b69d022e0645ee7b2b4a3182f'),
  h('4460a47d2bb9790e8986f819aec7d1bdbd6be430c04f8d5f1a86642b5d195fab'),
  h('e86f91108f91c1221bdc250cc68d0b6e8d215208ac6b65ce76e99465a634c184'),
  h('c855b9b09a6059b33c816860e16777eca2fd8ebe2168523ffcca126b3968a121'),
  h('8e50f75f9ab2d7b8bf0e997e8a7d6202689933461e7f4912a4f343ae76ee8de2'),
  h('f2c82efb63fd56545bb88cac97e2b2258d99ca82a6aec3c71e0a3a72aa22cec0'),
  h('5041e6345de057406d1334eb35ea1d554f4792a1cde0c46f0d8f6bda4f7c8951'),
  h('535712b7cbfa74cef7d7a3f756c41b636031da4964419ecdbc5d048a67956a16'),
  h('eadfc67dacbe2a13ae2e39b2a558e2173f99650f947d05d3076f57f4c4ed5df6'),
  h('6274faf5e34369168d53bb5e0d373205e7520f407f662ab1fac7a39b4c106dad'),
  h('85892b0676f3650777aff6e3660cb15df7317cdad883c3c256c07824b501f5e5'),
  h('d523845a249f6994b019cbb33057d352237858ff79a98cb2359d805ee45044d6'),
];

// Build the full TestKeyEntry list from static public keys.
// Private key[i] = [i, 0, ..., 0] — trivial to reconstruct without crypto.
const DEFAULT_KEYS: readonly TestKeyEntry[] = DEFAULT_PUBLIC_KEYS.map((publicKey, i) => {
  const privateKey = new Uint8Array(32);
  privateKey[0] = i;
  return { privateKey, publicKey };
});

export namespace TestKeys {
  export const GENERATOR_ID = 'test-keys';

  /**
   * Deterministic named key stream: seed0 = sha256("kerits-test-keys/"+name); seed(i+1) = sha256(seed(i)).
   * Each seed is an Ed25519 private key. Shared with scripts/generate-keripy-rotation.py.
   * Memoised per name, so at(n) returns the same object for the same (name, n).
   */
  export function iterator(name: string): TestKeyStream {
    const keys = streams.get(name) ?? [];
    streams.set(name, keys);
    const at = (n: number): TestKey => {
      if (!Number.isInteger(n) || n < 0) {
        throw new RangeError(`TestKeys.iterator('${name}').at(${n}): index must be a non-negative integer`);
      } else {
        /* valid index */
      }
      while (keys.length <= n) {
        const prior = keys[keys.length - 1];
        const seed = prior ? sha256(prior.privateKey) : sha256(new TextEncoder().encode(`kerits-test-keys/${name}`));
        const publicKey = ed25519.getPublicKey(seed);
        keys.push({ privateKey: seed, publicKey, cesr: toCESRPublicKey(asRawPublicKey(publicKey)) });
      }
      return keys[n]!;
    };
    return {
      name,
      at,
      *[Symbol.iterator]() {
        for (let i = 0; ; i++) yield at(i);
      },
    };
  }

  /** Returns the full static default key list. Tests can slice it to create bounded instances. */
  export function defaultKeys(): TestKeyEntry[] {
    return [...DEFAULT_KEYS];
  }

  /** Creates a TestKeys instance backed by the default 100-key list. Not a singleton — each call is independent. */
  export function get(options?: { wrap?: boolean }): KeyGenerator & KeyStore {
    return create(DEFAULT_KEYS, options);
  }

  /** Creates a TestKeys instance backed by the provided key list. Keys are issued in order. */
  export function create(keys: readonly TestKeyEntry[], options?: { wrap?: boolean }): KeyGenerator & KeyStore {
    const wrap = options?.wrap ?? false;
    let cursor = 0;
    // Map from hex-encoded public key → private key bytes, for issued keys only.
    const issued = new Map<string, Uint8Array>();

    const textEncoder = new TextEncoder();

    function buildScope(privateKey: Uint8Array, publicKey: RawPublicKey): KeyScope {
      const cesrPub = toCESRPublicKey(publicKey);

      const signer: Ed25519Signer = {
        publicKey: cesrPub,
        algo: 'ed25519',
        exists: async (pk: PublicKey) => pk === cesrPub,
        signBytes: async (data: Uint8Array): Promise<Signature> => {
          const rawSig = ed25519.sign(data, privateKey);
          return encodeSig(rawSig, 'ed25519').qb64 as Signature;
        },
        signSaid: async (said: SAID): Promise<Signature> => {
          const saidBytes = textEncoder.encode(said);
          const rawSig = ed25519.sign(saidBytes, privateKey);
          return encodeSig(rawSig, 'ed25519').qb64 as Signature;
        },
        getX25519PublicKey: async () => ed25519ToX25519Public(ed25519.getPublicKey(privateKey)),
        deriveX25519HkdfBlake3Key: async (input: KeyAgreementInput) => {
          if (input.peerPublicKey.length !== 32) {
            throw new Error(`Invalid peerPublicKey length: expected 32, got ${input.peerPublicKey.length}`);
          }
          if (input.length < 1 || input.length > MAX_HKDF_DERIVE_LENGTH) {
            throw new Error(`Invalid derive length: must be 1-${MAX_HKDF_DERIVE_LENGTH}, got ${input.length}`);
          }
          const x25519PrivateKey = ed25519ToX25519Private(privateKey);
          const sharedSecret = deriveSharedSecret(x25519PrivateKey, input.peerPublicKey);
          return hkdfBlake3(sharedSecret, input.salt, input.info, input.length);
        },
      };

      const withSignerFn = async <A>(fn: (s: Signer) => Promise<A>): Promise<A> => fn(signer);

      return {
        withSigner: withSignerFn,
        withEd25519Signer: async <A>(fn: (s: Ed25519Signer) => Promise<A>): Promise<Result<A, UnexpectedAlgoError>> => {
          return withSignerFn(async (s) => {
            if (!isEd25519Signer(s)) {
              return err({ kind: 'unexpected-algo' as const, expected: 'ed25519' as Algo, actual: s.algo });
            }
            return ok(await fn(s));
          });
        },
      };
    }

    return {
      id: GENERATOR_ID,

      supports(): Set<Algo> {
        return new Set(['ed25519']);
      },

      async generate(algo: Algo): Promise<Result<GeneratedKey, GenerateKeyError>> {
        if (algo !== 'ed25519') return err({ kind: 'algo-not-supported', algo });
        if (cursor >= keys.length) {
          if (!wrap)
            return err({ kind: 'generation-failed', reason: `TestKeys list exhausted after ${keys.length} keys` });
          cursor = 0;
        }
        const entry = keys[cursor++]!;
        const publicKey = asRawPublicKey(entry.publicKey);
        issued.set(publicKeyHex(publicKey), entry.privateKey);
        return ok({ publicKey, algo });
      },

      async generateBatch(algo: Algo, count: number): Promise<Result<readonly GeneratedKey[], GenerateKeyError>> {
        if (algo !== 'ed25519') return err({ kind: 'algo-not-supported', algo });
        if (!wrap && cursor + count > keys.length) {
          return err({
            kind: 'generation-failed',
            reason: `TestKeys list exhausted: need ${count} keys but only ${keys.length - cursor} remain`,
          });
        }
        const results: GeneratedKey[] = [];
        for (let i = 0; i < count; i++) {
          if (cursor >= keys.length) cursor = 0;
          const entry = keys[cursor++]!;
          const publicKey = asRawPublicKey(entry.publicKey);
          issued.set(publicKeyHex(publicKey), entry.privateKey);
          results.push({ publicKey, algo });
        }
        return ok(results);
      },

      async hasKey(publicKey: RawPublicKey): Promise<boolean> {
        return issued.has(publicKeyHex(publicKey));
      },

      async resolve(publicKey: RawPublicKey): Promise<Result<KeyScope, ResolveKeyError>> {
        const hex = publicKeyHex(publicKey);
        const privateKey = issued.get(hex);
        if (!privateKey) return err({ kind: 'key-not-found', publicKey });
        return ok(buildScope(privateKey, publicKey));
      },
    };
  }
}
