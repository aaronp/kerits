#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript rotate
cd "${KERITS_DIR}"
bun -e "
import { rotate } from './src/rotate.ts';

const data = JSON.parse(\`${input}\`);
const pre = data.pre;
const keys = data.keys;
const dig = data.dig;
const sn = data.sn || 1;
const ndigs = data.ndigs || [];
const isith = data.isith;
const nsith = data.nsith;

const options = { pre, keys, dig, sn, ndigs };
if (isith !== undefined) options.isith = isith;
if (nsith !== undefined) options.nsith = nsith;

const event = rotate(options);

const result = {
  ked: event.ked,
  said: event.said
};

console.log(JSON.stringify(result));
"
