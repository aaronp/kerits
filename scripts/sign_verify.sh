#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
KERITS_DIR="${PROJECT_ROOT}/kerits"

# Read input from stdin
input=$(cat)

# Create a temporary TypeScript file with unique name
TMP_FILE=$(mktemp).ts

cat > "${TMP_FILE}" <<EOF
import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha2.js';
import { generateKeypairFromSeed } from '${KERITS_DIR}/src/signer.ts';

// Set SHA-512 for ed25519
ed.hashes.sha512 = (...m) => sha512(ed.etc.concatBytes(...m));

const BASE64_URL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBase64Url(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    const b2 = i < bytes.length ? bytes[i++] : 0;
    const b3 = i < bytes.length ? bytes[i++] : 0;
    const hasB2 = i >= 2 && (i - 2) < bytes.length;
    const hasB3 = i >= 3 && (i - 3) < bytes.length;
    result += BASE64_URL[b1 >> 2];
    result += BASE64_URL[((b1 & 0x03) << 4) | (b2 >> 4)];
    if (hasB2) result += BASE64_URL[((b2 & 0x0f) << 2) | (b3 >> 6)];
    if (hasB3) result += BASE64_URL[b3 & 0x3f];
  }
  return result;
}

const data = ${input};
const seedHex = data.seed;
const message = data.message;

// Convert hex seed to bytes
const seedBytes = new Uint8Array(seedHex.match(/.{1,2}/g).map((byte: string) => parseInt(byte, 16)));

// Generate keypair from seed (transferable)
const keypair = await generateKeypairFromSeed(seedBytes, true);

// Sign the message
const messageBytes = new TextEncoder().encode(message);
const sigBytes = await ed.sign(messageBytes, keypair.privateKey);

// Encode signature with CESR '0B' prefix
const ps = (3 - (sigBytes.length % 3)) % 3;
const padded = new Uint8Array(ps + sigBytes.length);
for (let i = 0; i < ps; i++) padded[i] = 0;
for (let i = 0; i < sigBytes.length; i++) padded[ps + i] = sigBytes[i];
const b64 = encodeBase64Url(padded);
const signature = '0B' + b64.slice(2);

// Return result
console.log(JSON.stringify({
  verfer: keypair.verfer,
  signature: signature,
  message: message
}));
EOF

# Run the temporary file with bun
bun run "${TMP_FILE}"

# Clean up
rm -f "${TMP_FILE}"
