#!/bin/bash
# TypeScript/Bun verify script for saidify tests
# Equivalent to testgen/scripts/saidify_verify.sh but uses TypeScript implementation

set -e

# Find kerits directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Parse arguments for label
LABEL="d"
while [[ $# -gt 0 ]]; do
    case $1 in
        --label)
            LABEL="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Read input from stdin and run TypeScript saidify
cd "${KERITS_DIR}"
if [ "$LABEL" = "d" ]; then
    bun run src/saidify-cli.ts
else
    bun run src/saidify-cli.ts --label "$LABEL"
fi
