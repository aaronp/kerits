#!/usr/bin/env bun
/**
 * CLI for saidify - reads JSON from stdin and outputs saidified JSON
 */

import { saidify } from './saidify';

// Parse command line arguments
const args = process.argv.slice(2);
let label = 'd';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--label' && i + 1 < args.length) {
    label = args[i + 1]!;
    i++;
  }
}

// Read from stdin
const input = await Bun.stdin.text();
const obj = JSON.parse(input);

// Add label field if not present
if (!(label in obj)) {
  obj[label] = '';
}

// Saidify
const result = saidify(obj, { label });

// Output result
console.log(JSON.stringify(result));
