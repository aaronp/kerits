#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript incept
cd "${KERITS_DIR}"
bun -e "
import { incept } from './src/incept.ts';

const data = JSON.parse(\`${input}\`);
const keys = data.keys;
const ndigs = data.ndigs || [];

const event = incept({ keys, ndigs });

const result = {
  ked: event.ked,
  pre: event.pre,
  said: event.said
};

console.log(JSON.stringify(result));
"
