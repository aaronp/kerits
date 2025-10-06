# CLI Framework Comparison for KERITS

Comparison of frameworks for building the new KERITS CLI with DSL integration.

## Executive Summary

**Recommended Approach: Hybrid (@clack/prompts + Ink GraphView)**

Use @clack/prompts for menus and forms, and integrate Ink's GraphView component only when displaying graphs. This gives the best developer experience and fastest implementation time.

## Framework Options

### 1. @clack/prompts ⭐ RECOMMENDED

**What it is:** Beautiful, minimal CLI prompts library

**Pros:**
- ✅ Already installed in your project
- ✅ Simple, intuitive API
- ✅ Beautiful out-of-the-box styling
- ✅ Perfect for menu-based navigation
- ✅ Small bundle size
- ✅ Fast development
- ✅ Great for forms and selections
- ✅ Works with Bun

**Cons:**
- ❌ Limited graph visualization
- ❌ Less flexible for complex layouts
- ❌ No component model

**Best for:** Menu-driven CLIs, forms, wizards

**Code Example:**
```typescript
import * as p from '@clack/prompts';

const choice = await p.select({
  message: 'Select an option',
  options: [
    { value: 'accounts', label: 'Manage Accounts' },
    { value: 'registries', label: 'Registries' },
    { value: 'graph', label: 'View Graph' },
  ],
});
```

### 2. Ink

**What it is:** React for interactive command-line apps

**Pros:**
- ✅ Full React component model
- ✅ Excellent for graph visualization
- ✅ Flexbox layouts
- ✅ Rich component ecosystem
- ✅ Stateful UIs
- ✅ Great for real-time updates

**Cons:**
- ❌ Requires React knowledge
- ❌ Heavier dependencies
- ❌ More complex setup
- ❌ React 19 compatibility issues
- ❌ Requires interactive terminal (stdin)

**Best for:** Complex UIs, dashboards, graph visualizations

**Code Example:**
```tsx
import { Box, Text } from 'ink';

const Menu = () => (
  <Box flexDirection="column">
    <Text color="cyan">🔐 KERITS</Text>
    <Text>Select option...</Text>
  </Box>
);
```

### 3. Blessed / Neo-Blessed

**What it is:** Low-level terminal UI library (like ncurses)

**Pros:**
- ✅ Full terminal control
- ✅ Complex layouts
- ✅ Widgets (lists, forms, tables)
- ✅ Mouse support

**Cons:**
- ❌ Complex API
- ❌ Older library
- ❌ Less maintainer activity
- ❌ Steeper learning curve

**Best for:** Terminal applications with complex UIs

### 4. Commander.js + Inquirer.js

**What it is:** Traditional CLI parsing + prompts

**Pros:**
- ✅ Industry standard
- ✅ Mature ecosystem
- ✅ Great for complex command structures

**Cons:**
- ❌ Less modern UX
- ❌ More boilerplate
- ❌ Limited graph visualization

**Best for:** Traditional CLIs with subcommands

## Feature Comparison Matrix

| Feature | @clack/prompts | Ink | Blessed | Commander+Inquirer |
|---------|---------------|-----|---------|-------------------|
| Ease of Use | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Graph Viz | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| Menus | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Setup Time | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Bundle Size | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Flexibility | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Modern UX | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| Maintenance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## Hybrid Approach ⭐ RECOMMENDED

**Combination: @clack/prompts + Ink GraphView**

### Implementation Strategy

1. **Use @clack/prompts for:**
   - Main menu navigation
   - Account selection
   - Registry/contact/schema management
   - Forms and inputs
   - Confirmations

2. **Use Ink components for:**
   - Graph visualization only
   - Can be imported as standalone component
   - Render when user selects "View Graph"

### Benefits

✅ **Fast Development** - @clack for 90% of UI
✅ **Beautiful Graphs** - Ink for complex visualizations
✅ **Best UX** - Modern prompts + rich graphs
✅ **Maintainable** - Simple codebase
✅ **Lightweight** - Ink only loaded when needed

### Code Structure

```
cli/
├── index.ts                  # Main entry (@clack/prompts)
├── utils/
│   ├── config.ts            # KERITS_DIR, DiskKV setup
│   ├── dsl.ts               # DSL initialization
│   └── graph-renderer.tsx   # Ink graph component
├── menus/
│   ├── accounts.ts          # @clack menus
│   ├── registries.ts
│   ├── contacts.ts
│   ├── schemas.ts
│   └── graph.ts             # Calls graph-renderer
└── types.ts
```

## Implementation Example

### Main Menu (clack)

```typescript
import * as p from '@clack/prompts';

async function mainMenu() {
  const choice = await p.select({
    message: 'KERITS CLI',
    options: [
      { value: 'accounts', label: '👤 Accounts' },
      { value: 'registries', label: '📋 Registries' },
      { value: 'contacts', label: '👥 Contacts' },
      { value: 'schemas', label: '📄 Schemas' },
      { value: 'graph', label: '📊 View Graph' },
      { value: 'export', label: '💾 Export KEL' },
      { value: 'exit', label: '🚪 Exit' },
    ],
  });

  if (choice === 'graph') {
    await showGraph();
  }
  // ... handle other choices
}
```

### Graph Display (Ink)

```typescript
import { render } from 'ink';
import { GraphView } from './utils/graph-renderer.tsx';

async function showGraph() {
  const graph = await dsl.graph();

  const { waitUntilExit } = render(<GraphView graph={graph} />);
  await waitUntilExit();
}
```

## Proof of Concept

✅ **Ink prototype working** - See `./cli-ink/`
- Graph visualization component built
- DSL integration complete
- Sample data renders correctly
- Tree structure with colors and symbols

✅ **Ready to implement hybrid**
- Use @clack for menu structure
- Import GraphView from cli-ink when needed
- Best of both worlds

## Timeline Estimate

### Option 1: @clack/prompts only
- Setup: 1 hour
- Menu implementation: 4-6 hours
- Graph (ASCII art): 2-3 hours
- **Total: 7-10 hours**

### Option 2: Ink only
- Setup: 2 hours
- Component development: 8-10 hours
- Navigation logic: 4-6 hours
- **Total: 14-18 hours**

### Option 3: Hybrid (Recommended)
- Setup: 1 hour
- @clack menus: 4-6 hours
- Integrate Ink GraphView: 1-2 hours
- **Total: 6-9 hours**

## Final Recommendation

**Use the Hybrid Approach:**

1. Build main CLI with @clack/prompts (fast, simple)
2. Use existing Ink GraphView for graphs (rich visualization)
3. Store data with DiskKV under KERITS_DIR
4. Implement account switching with breadcrumbs

This gives you:
- ⚡ Fastest time to working CLI
- 🎨 Beautiful UX throughout
- 📊 Rich graph visualization
- 🛠️ Easy to maintain and extend

## Next Steps

1. Create `./cli/` directory structure
2. Set up @clack/prompts main menu
3. Implement DiskKV with KERITS_DIR
4. Add account management
5. Integrate Ink GraphView for graph display
6. Build out remaining menus (registries, contacts, schemas)

Ready to proceed with implementation?
