#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript receipt generation
cd "${KERITS_DIR}"
bun -e "
import { receipt } from './src/receipt.ts';

const data = JSON.parse(\`${input}\`);
const pre = data.pre;
const sn = data.sn;
const said = data.said;

const result = receipt({ pre, sn, said });

const output = {
  sad: result.sad,
  raw: result.raw,
  said: result.said
};

console.log(JSON.stringify(output));
"
