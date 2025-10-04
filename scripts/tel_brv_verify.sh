#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript TEL backer revocation
cd "${KERITS_DIR}"

bun -e "
import { backerRevoke } from './src/tel.ts';

const data = JSON.parse(\`${input}\`);

const result = backerRevoke({
  vcdig: data.vcdig,
  regk: data.regk,
  regsn: data.regsn,
  regd: data.regd,
  dig: data.dig,
  dt: data.dt
});

console.log(JSON.stringify({
  sad: result.sad,
  raw: result.raw,
  said: result.said
}));
"
