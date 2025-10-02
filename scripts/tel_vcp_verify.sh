#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript TEL registry inception
cd "${KERITS_DIR}"
bun -e "
import { registryIncept } from './src/tel.ts';

const data = JSON.parse(\`${input}\`);
const issuer = data.issuer;
const nonce = data.nonce;
const baks = data.baks;
const toad = data.toad;

const options = { issuer, nonce };
if (baks) options.baks = baks;
if (toad !== undefined) options.toad = toad;

const result = registryIncept(options);

const output = {
  sad: result.sad,
  raw: result.raw,
  said: result.said,
  regk: result.regk
};

console.log(JSON.stringify(output));
"
