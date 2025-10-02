#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript schema
cd "${KERITS_DIR}"
bun -e "
import { schema } from './src/schema.ts';

const data = JSON.parse(\`${input}\`);
const sed = data.sed;

const sch = schema(sed);

const result = {
  sed: sch.sed,
  said: sch.said
};

console.log(JSON.stringify(result));
"
