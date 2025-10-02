#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Parse arguments
TRANSFERABLE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --transferable)
            TRANSFERABLE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Read input from stdin
input=$(cat)

# Run TypeScript signer
cd "${KERITS_DIR}"
bun -e "
import { generateKeypairFromSeed } from './src/signer.ts';

const data = JSON.parse(\`${input}\`);
const seedHex = data.seed;
const seed = new Uint8Array(Buffer.from(seedHex, 'hex'));

const transferable = ${TRANSFERABLE};
const kp = await generateKeypairFromSeed(seed, transferable);

console.log(JSON.stringify({ verfer: kp.verfer }));
"
