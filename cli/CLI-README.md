# KERITS CLI

A terminal-based user interface for KERI Transaction System (KERITS) built with [@clack/prompts](https://github.com/natemoo-re/clack) and [Ink](https://github.com/vadimdemedes/ink).

## Overview

The KERITS CLI provides a complete interface for managing:
- **Accounts** - Create, switch, rotate keys, export KEL, view graphs
- **Credential Registries** - Create registries and manage credentials
- **Contacts** - Import and manage contacts from KEL files
- **Schemas** - Create, import, export credential schemas

## Installation

```bash
make install
# or
bun install
```

## Usage

```bash
make dev
# or
bun run start
```

## Features

### Account Management
- ✅ Create new accounts with generated or existing mnemonics
- ✅ Switch between accounts
- ✅ Rotate keys with new mnemonics
- ✅ Export KEL to CESR files
- ✅ View KEL graph visualization

### Credential Registries
- ✅ Create new TEL registries
- ✅ Select and manage registries
- ✅ List credentials in registry
- ✅ Issue new credentials with schema validation
- ✅ Revoke credentials
- ✅ View credentials graph
- ✅ Export credentials to files

### Contacts
- ✅ List all contacts
- ✅ Add contacts from KEL files
- ✅ Remove contacts

### Schemas
- ✅ List all schemas
- ✅ Create schemas (interactive, JSON, or from file)
- ✅ View schema definitions
- ✅ Export schemas to JSON files
- ✅ Import schemas from JSON files

## Architecture

### Technology Stack
- **@clack/prompts** - All menus and user input
- **Ink** - Graph visualization only
- **DiskKV** - Persistent storage
- **DSL** - All business logic

### Directory Structure

```
~/.kerits/                  # KERITS data directory ($KERITS_DIR or ~/.kerits)
├── .current               # Current account selection
├── alice/
│   └── data/             # DiskKV storage for alice
└── bob/
    └── data/             # DiskKV storage for bob
```

### Code Structure

```
cli/
├── main.ts                # Entry point and main menu
├── utils/
│   ├── storage.ts        # DiskKV and account utilities
│   └── graph.tsx         # Ink graph visualization
├── menus/
│   ├── accounts.ts       # Account management menu
│   ├── registries.ts     # Registries and credentials menus
│   ├── contacts.ts       # Contacts menu
│   └── schemas.ts        # Schemas menu
└── menus.md              # Complete specification
```

## Menu Flow

```
Main Menu
├── Manage Accounts
│   ├── Create New Account
│   ├── Switch Account
│   ├── Rotate Keys
│   ├── Export KEL to File
│   └── Show KEL Graph
├── Manage Registries
│   ├── Create New Registry
│   └── Select Registry
│       ├── List Credentials
│       ├── Create New Credential
│       ├── Revoke Credential
│       ├── Show Credentials Graph
│       └── Export Credential
├── Manage Contacts
│   ├── List Contacts
│   ├── Add Contact from KEL File
│   └── Remove Contact
├── Manage Schemas
│   ├── List Schemas
│   ├── Create New Schema
│   ├── View Schema
│   ├── Export Schema to File
│   └── Import Schema from File
└── Exit
```

## Implementation Details

### Account Creation

1. User provides account alias
2. Choose to generate new mnemonic or use existing
3. If generating:
   - Display 24-word mnemonic with warning
   - Require confirmation that it's been saved
4. Create account via DSL
5. Set as current account

### Credential Issuance

1. Select registry
2. Choose schema from available schemas
3. Prompt for each field based on schema definition
4. Optionally select recipient (contact or manual AID)
5. Issue credential via registry DSL
6. Display SAID and metadata

### Graph Visualization

Graphs are rendered using Ink with Dagre layout:
- KEL graphs for accounts
- TEL/ACDC graphs for registries
- Boxes drawn with Unicode characters
- Press any key to return to menu

### Error Handling

All operations include try-catch blocks with user-friendly error messages displayed using `@clack/prompts` log functions.

## Example Session

```bash
$ make dev

┌  KERITS CLI - KERI Transaction System
│
◇  Current Account: None
│
◆  What would you like to do?
│  ○ Manage Accounts
│  ○ Manage Registries
│  ○ Manage Contacts
│  ○ Manage Schemas
│  ○ Exit
└

# Select "Manage Accounts"
# Select "Create New Account"
# Enter alias: alice
# Choose "Generate new mnemonic"
# Save displayed mnemonic
# Confirm saved

◇  Account 'alice' created successfully
│
◇  AID: EAbcdef123456...
└

# Now alice is current account
# Navigate to "Manage Registries"
# Create registry "health-records"
# Select registry to manage credentials
# Create credential with blood-pressure schema
# View credentials graph
```

## Development

The CLI is a presentation layer only - all business logic is handled by the DSL. This makes the CLI:
- Easy to maintain
- Consistent with other interfaces (web UI, etc.)
- Testable through DSL tests

See [menus.md](menus.md) for the complete specification.

## Next Steps

Potential enhancements:
- Add TAB completion for file paths
- Add history/navigation with arrow keys in text inputs
- Add color themes
- Add configuration file support
- Add batch operations
- Add search/filter capabilities
