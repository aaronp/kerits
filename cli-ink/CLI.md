# KERITS CLI - Full Application

A terminal-based user interface for KERI Transaction System (KERITS) built with [Ink](https://github.com/vadimdemedes/ink).

## Features

✅ **Breadcrumb Navigation** - Always know where you are in the menu hierarchy
✅ **DiskKV Storage** - Persistent storage using `KERITS_DIR` env var or `~/.kerits`
✅ **Account Management** - Create, switch, rotate keys, export KEL
✅ **Credential Registries** - Manage TEL registries with nested ACDC operations
✅ **Contacts** - Import contacts from KEL files
✅ **Schemas** - Create, import, and export schemas
✅ **Graph Visualization** - View KEL/TEL graphs using Dagre layout

## Directory Structure

All KERITS data is stored under:
- `$KERITS_DIR` (if env var is set), or
- `~/.kerits` (default)

```
~/.kerits/
├── .current              # Currently selected account
├── alice/
│   └── data/            # DiskKV root for Alice's account
│       ├── aids/
│       ├── events/
│       ├── registries/
│       └── ...
└── bob/
    └── data/            # DiskKV root for Bob's account
```

## Menu Structure

### Main Menu
- **Accounts** - Account management
- **Credential Registries** - TEL registry operations
- **Contacts** - Contact management
- **Schemas** - Schema operations
- **Exit** - Exit the CLI

### Accounts Menu
- Create New Account
- Switch Account
- Rotate Keys (if account selected)
- Export KEL to File (if account selected)
- Show KEL Graph (if account selected)

### Registries Menu
- List Registries
- Create New Registry
- Export Registry CESR
  - Selecting a registry opens **ACDCs Menu** (nested)

### ACDCs Menu (Nested under a Registry)
**Breadcrumb**: `Credential Registries › {registry-name}`

- List Credentials
- Create New Credential
- Show Credentials Graph
- Export Credential

### Contacts Menu
- List Contacts
- Add Contact from KEL File

### Schemas Menu
- List Schemas
- Create New Schema
- Export Schema to File
- Import Schema from File

## Running the CLI

### Interactive Mode
```bash
make cli
# or
bun run cli.tsx
```

**Note**: Requires an interactive terminal (PTY). Use keyboard navigation:
- ↑/↓ - Navigate menu items
- Enter - Select item
- ESC/q - Go back or exit

### Demo Mode
```bash
make cli-demo
# or
bun run cli-demo.tsx
```

Auto-cycles through all menus showing the navigation structure (12 seconds).

## Architecture

### Core Components

**`components/KeritsApp.tsx`**
- Main application component
- Manages navigation state and breadcrumbs
- Handles keyboard input
- Routes to appropriate screen based on current state

**`components/Breadcrumbs.tsx`**
- Displays navigation path
- Format: `Home › Submenu › Nested`

**`components/Menu.tsx`**
- Reusable menu component
- Keyboard navigation indicators
- Help text at bottom

**`screens/*Menu.tsx`**
- Screen-specific menu configurations
- Conditional rendering based on state (e.g., account selected)

### Storage

**`utils/storage.ts`**
- `getKeritsDir()` - Get KERITS_DIR or default
- `getAccountDataDir(alias)` - Get account data directory
- `loadAccountDSL(alias)` - Create DSL instance for account
- `getCurrentAccount()` - Get currently selected account
- `setCurrentAccount(alias)` - Switch to account

### DSL Integration

All functionality delegates to the DSL layer:

```typescript
import { createKeritsDSL } from '../../src/app/dsl/index.js';
import { createKerStore, DiskKv } from '../../src/storage/index.js';

const store = createKerStore(new DiskKv(dataDir), parser, hasher);
const dsl = createKeritsDSL(store);

// Use DSL methods
await dsl.newAccount(alias, mnemonic);
await accountDsl.rotateKeys(newMnemonic);
await accountDsl.createRegistry(registryAlias);
// etc.
```

The CLI is **presentation-only** - all business logic lives in the DSL.

## Implementation Status

### ✅ Completed
- [x] Navigation system with breadcrumbs
- [x] All menu screens
- [x] DiskKV storage integration
- [x] Account selection/switching
- [x] Menu structure for all operations

### 🚧 To Be Implemented
Actual operations (currently show placeholder screens):
- [ ] Account creation (prompt for alias, generate mnemonic)
- [ ] Key rotation (generate new mnemonic, call DSL)
- [ ] KEL export (select file path, export)
- [ ] Graph visualization (integrate AdvancedGraphView)
- [ ] Registry operations (create, list, export)
- [ ] ACDC operations (create, list, graph, export)
- [ ] Contact operations (import from file, list)
- [ ] Schema operations (create, import, export)
- [ ] Form inputs (text input, file picker, etc.)

## Next Steps

1. **Add Input Components**
   - Text input for aliases, file paths
   - File picker for import/export
   - Multi-line editor for schema JSON

2. **Implement Operations**
   - Wire up each menu action to DSL calls
   - Add error handling and user feedback
   - Show operation results

3. **Graph Integration**
   - Use `AdvancedGraphView` component
   - Show KEL graphs for accounts
   - Show TEL/ACDC graphs for registries

4. **Polish**
   - Loading spinners for async operations
   - Confirmation prompts for destructive actions
   - Better error messages

## Example Usage Flow

```
1. User launches CLI
2. Main Menu shows "Accounts (none)"
3. User navigates to Accounts → Create New Account
   Breadcrumb: Accounts › Create
4. User enters alias "alice"
5. CLI generates mnemonic, creates account via DSL
6. CLI switches to Alice's account automatically
7. Main Menu now shows "Accounts (alice)"
8. User navigates to Credential Registries → Create New Registry
   Breadcrumb: Credential Registries › Create
9. User enters registry alias "health-records"
10. CLI creates registry via accountDsl.createRegistry()
11. User navigates to Registries → health-records
    Breadcrumb: Credential Registries › health-records
12. User creates credentials, views graph, exports
```

## Development

```bash
# Install dependencies
make install

# Run interactive CLI
make cli

# Run demo (no interaction required)
make cli-demo

# Run graph demos
make demo      # Basic graph
make advanced  # Advanced graph with Dagre
```
