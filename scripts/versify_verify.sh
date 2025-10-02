#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KERITS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Parse arguments
SIZE=0

while [[ $# -gt 0 ]]; do
    case $1 in
        --size)
            SIZE="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Read input from stdin (not used but kept for consistency)
input=$(cat)

# Run TypeScript versify
cd "${KERITS_DIR}"
bun -e "
import { versify, Protocol, Kind, VERSION_1_0 } from './src/versify.ts';

const vs = versify(Protocol.KERI, VERSION_1_0, Kind.JSON, ${SIZE});
console.log(JSON.stringify({ version: vs }));
"
