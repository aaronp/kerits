#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Read input from stdin
input=$(cat)

# Run TypeScript verification
cd "${KERITS_DIR}"
bun -e "
import { verifyCredential } from './src/verify.ts';

const data = JSON.parse(\`${input}\`);
const cred = data.credential;

const result = verifyCredential(cred);

const output = {
  valid: result.valid,
  credentialSaid: result.checks.credentialSaid,
  subjectSaid: result.checks.subjectSaid
};

console.log(JSON.stringify(output));
"
