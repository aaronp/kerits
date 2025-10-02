#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript diger
cd "${KERITS_DIR}"
bun -e "
import { diger, DigestCode } from './src/diger.ts';

const data = JSON.parse(\`${input}\`);
const digest = diger(data.ser, DigestCode.Blake3_256);

console.log(JSON.stringify({ digest }));
"
