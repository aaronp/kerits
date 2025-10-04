#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript TEL backer issuance
cd "${KERITS_DIR}"

bun -e "
import { backerIssue } from './src/tel.ts';

const data = JSON.parse(\`${input}\`);

const result = backerIssue({
  vcdig: data.vcdig,
  regk: data.regk,
  regsn: data.regsn,
  regd: data.regd,
  dt: data.dt
});

console.log(JSON.stringify({
  sad: result.sad,
  raw: result.raw,
  said: result.said
}));
"
