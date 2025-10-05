#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript CESR encoding
cd "${KERITS_DIR}"
bun -e "
import { Matter } from './src/cesr/matter.ts';

const data = JSON.parse(\`${input}\`);

// Test encoding: raw -> qb64
const raw = new Uint8Array(
  data.raw_hex.match(/.{2}/g).map(byte => parseInt(byte, 16))
);
const matter = new Matter({ raw, code: data.code });

console.log(JSON.stringify({
  qb64: matter.qb64,
  raw_hex: Array.from(matter.raw).map(b => b.toString(16).padStart(2, '0')).join('')
}));
"
