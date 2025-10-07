// Quick test of CESR Signer
import { Signer, Verfer } from '../src/cesr/signer';
import { MatterCodex } from '../src/cesr/codex';

const seed = new Uint8Array(32).fill(1);
const signer = new Signer({ raw: seed, code: MatterCodex.Ed25519_Seed, transferable: true });

console.log('Verfer:', signer.verfer.qb64);

const message = new TextEncoder().encode("Hello, KERI!");
const sig = signer.sign(message);

console.log('Signature:', sig.qb64);

const valid = signer.verfer.verify(sig, message);
console.log('Verification:', valid);

// Try with reconstructed verfer
const verfer2 = new Verfer({ qb64: signer.verfer.qb64 });
const valid2 = verfer2.verify(sig, message);
console.log('Verification (reconstructed):', valid2);
