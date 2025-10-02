#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript TEL issuance
cd "${KERITS_DIR}"
bun -e "
import { issue } from './src/tel.ts';

const data = JSON.parse(\`${input}\`);
const vcdig = data.vcdig;
const regk = data.regk;
const dt = data.dt;

const options = { vcdig, regk };
if (dt) options.dt = dt;

const result = issue(options);

const output = {
  sad: result.sad,
  raw: result.raw,
  said: result.said
};

console.log(JSON.stringify(output));
"
