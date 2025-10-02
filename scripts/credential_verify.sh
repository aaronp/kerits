#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript credential
cd "${KERITS_DIR}"
bun -e "
import { credential } from './src/credential.ts';

const data = JSON.parse(\`${input}\`);
const schema = data.schema;
const issuer = data.issuer;
const credData = data.data;
const recipient = data.recipient;
const registry = data.registry;

const options = { schema, issuer, data: credData };
if (recipient) options.recipient = recipient;
if (registry) options.registry = registry;

const cred = credential(options);

const result = {
  sad: cred.sad,
  said: cred.said
};

console.log(JSON.stringify(result));
"
