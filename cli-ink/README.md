# KERITS CLI - Ink Prototype

React-based CLI using [Ink](https://github.com/vadimdemedes/ink) for rich terminal UI with graph visualization.

## Features Demonstrated

✅ **Graph Visualization** - Visual representation of KERI graphs
✅ **Component-Based UI** - React components for terminal
✅ **DSL Integration** - Uses KERITS DSL for data access
✅ **Interactive Navigation** - Menu-based interface (when stdin available)
✅ **Rich Formatting** - Colors, borders, trees, and symbols

## File Structure

```
cli-ink/
├── components/
│   ├── App.tsx           # Main app with navigation
│   └── GraphView.tsx     # Graph visualization components
├── utils/
│   └── sampleData.ts     # Sample KERI data generator
├── index.tsx             # Interactive entry point
├── demo.tsx              # Static demo (no stdin required)
└── package.json          # Dependencies
```

## Running the Demo

### Using Makefile (Recommended)

```bash
cd cli-ink

# Show available commands
make help

# Run static demo (works without interactive terminal)
make demo

# Run interactive CLI (requires interactive terminal)
make dev

# Install dependencies
make install
```

### Direct Commands

#### Static Demo (Recommended for Testing)
```bash
cd cli-ink
bun run demo.tsx
```

Shows a graph visualization for 5 seconds then exits.

#### Interactive App (Requires Interactive Terminal)
```bash
cd cli-ink
bun run dev
# or
bun run index.tsx
```

Use arrow keys to navigate menu, Enter to select, ESC/q/b to go back.

## Graph Visualization

The `GraphView` component renders KERI graphs with:

- **Node Summary** - Count by type (AID, KEL_EVT, TEL_REGISTRY, etc.)
- **Edge Summary** - Relationship types with symbols
- **Tree Structure** - Visual hierarchy with indentation
- **Color Coding** - Different colors per node type
- **Symbols** - Icons for edge types (→, ⚓, 📜, etc.)

### Node Colors

- `AID` - Cyan
- `KEL_EVT` - Green
- `TEL_REGISTRY` - Magenta
- `TEL_EVT` - Yellow
- `ACDC` - Blue
- `SCHEMA` - Gray

### Edge Symbols

- `PRIOR` → (next event)
- `ANCHOR` ⚓ (anchors)
- `ISSUES` 📜 (issues credential)
- `REVOKES` ❌ (revokes)
- `REFS` 🔗 (references)
- `USES_SCHEMA` 📋 (uses schema)

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

╭─────────────────────────────────────────╮
│ Graph Structure:                        │
│                                         │
│ AID "DK041DpgipXq..."                  │
│   ⚓ anchors TEL                        │
│   └─ TEL_REGISTRY "Registry EOPwW9xH"  │
│     🔗 event                            │
│     └─ TEL_EVT "ISS #0"                │
│       📜 issues                         │
│       └─ ACDC "ACDC EBCY24Nm"          │
╰─────────────────────────────────────────╯
```

## Interactive Features (index.tsx)

When run in an interactive terminal:

1. **Main Menu**
   - View Full Graph
   - View Compact Graph
   - Refresh Data
   - Exit

2. **Navigation**
   - ↑↓ arrows to navigate
   - Enter to select
   - ESC/q/b to go back

3. **Graph Views**
   - Full graph with tree structure
   - Compact summary view
   - Node breakdown statistics

## Pros of Ink

✅ **React Component Model** - Familiar development experience
✅ **Rich Layouts** - Flexbox-based positioning
✅ **Component Ecosystem** - Many pre-built components
✅ **Visual Appeal** - Beautiful, customizable output
✅ **State Management** - Full React hooks support

## Cons of Ink

❌ **Complexity** - More boilerplate than simpler libs
❌ **stdin Requirement** - Needs interactive terminal for input
❌ **Bundle Size** - React dependency adds weight
❌ **React Version** - Currently incompatible with React 19

## Comparison with @clack/prompts

| Feature | Ink | @clack/prompts |
|---------|-----|----------------|
| Graph Viz | ✅ Excellent | ⚠️ Limited |
| Menus | ✅ Custom | ✅ Built-in |
| Learning Curve | Higher | Lower |
| Bundle Size | Larger | Smaller |
| Flexibility | Very High | Moderate |
| Setup Time | Longer | Faster |

## Recommendation

**For KERITS CLI:**

Use **@clack/prompts** for the main CLI (menus, forms, navigation) and add **Ink components** specifically for graph visualization when needed.

This hybrid approach gives you:
- Fast development with @clack/prompts
- Beautiful graphs with Ink components
- Best of both worlds

## Next Steps

1. Port menu structure to @clack/prompts
2. Keep Ink GraphView for graph display
3. Add DiskKV storage with KERITS_DIR
4. Implement account switching
5. Add full menu hierarchy
