# KERITS CLI-Ink - Quick Start

## Installation

```bash
cd cli-ink
make install
```

## Run Demo

```bash
make demo
```

Shows a KERI graph visualization for 5 seconds with:
- Node counts by type (AID, KEL_EVT, TEL_REGISTRY, ACDC)
- Edge relationships with symbols
- Visual tree structure
- Color-coded output

## Run Interactive CLI

```bash
make dev
```

**Note:** Requires an interactive terminal (PTY). Use `make demo` for non-interactive environments.

## Sample Output

```
🔐 KERITS Ink Prototype - Graph Visualization Demo

Sample KERI Graph

Nodes (11):
  • AID: 2
  • KEL_EVT: 4
  • TEL_REGISTRY: 1
  • TEL_EVT: 2
  • ACDC: 2

Edges (7):
  → PRIOR: 2
  ⚓ ANCHOR: 1
  🔗 REFS: 2
  📜 ISSUES: 2

╭─────────────────────────────────────────────╮
│ Graph Structure:                            │
│                                             │
│ AID "DK041DpgipXq..."                      │
│   ⚓ anchors TEL                            │
│   └─ TEL_REGISTRY "Registry ENsGzDHk"      │
│     🔗 event                                │
│     └─ TEL_EVT "ISS #0"                    │
│       📜 issues                             │
│       └─ ACDC "ACDC EDaGnQ70"              │
│                                             │
│ KEL_EVT "ICP #0"                           │
│   → prior                                   │
│   └─ KEL_EVT "ROT #1"                      │
│     → prior                                 │
│     └─ KEL_EVT "IXN #2"                    │
╰─────────────────────────────────────────────╯
```

## What's Demonstrated

✅ **DSL Integration** - Uses KERITS DSL to generate real KERI data
✅ **Graph Visualization** - React-based graph rendering in terminal
✅ **Color Coding** - Different colors for node types
✅ **Symbols** - Visual indicators for relationships (→, ⚓, 📜, 🔗)
✅ **Tree Structure** - Hierarchical display with proper indentation
✅ **Sample Data** - Creates accounts, registries, schemas, credentials

## Available Make Targets

```bash
make help      # Show all targets
make demo      # Run static demo (recommended)
make dev       # Run interactive CLI
make install   # Install dependencies
make clean     # Remove node_modules
```

## Next Steps

See [README.md](./README.md) for full documentation and [../CLI_FRAMEWORK_COMPARISON.md](../CLI_FRAMEWORK_COMPARISON.md) for framework analysis.
