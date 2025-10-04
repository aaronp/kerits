#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript TEL registry rotation
cd "${KERITS_DIR}"
bun -e "
import { registryRotate } from './src/tel.ts';

const data = JSON.parse(\`${input}\`);
const regk = data.regk;
const dig = data.dig;
const sn = data.sn;
const adds = data.adds || [];
const cuts = data.cuts || [];
const toad = data.toad;

const options = { regk, dig, sn, adds, cuts };
if (toad !== undefined) options.toad = toad;

const result = registryRotate(options);

const output = {
  sad: result.sad,
  raw: result.raw,
  said: result.said
};

console.log(JSON.stringify(output));
"
