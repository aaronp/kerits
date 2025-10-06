# KERITS CLI Menu Specification

This document defines the complete menu structure and user flows for the KERITS CLI using `@clack/prompts`.

## Overview

- **Framework**: `@clack/prompts` for menus and user input
- **Graph Visualization**: Ink's `AdvancedGraphView` component for graph displays
- **Storage**: DiskKV with `$KERITS_DIR` or `~/.kerits`
- **Architecture**: Presentation layer only - all business logic in DSL

## Global State

```typescript
interface CLIState {
  currentAccount?: string;  // Currently active account alias
  keritsDir: string;        // Base directory for all data
}
```

## Directory Structure

```
~/.kerits/
├── .current              # File containing current account alias
├── alice/
│   └── data/            # DiskKV root for alice
└── bob/
    └── data/            # DiskKV root for bob
```

## Main Menu

**Title**: `KERITS CLI - KERI Transaction System`

**Current Account Display**: Show current account if set (e.g., `Current Account: alice`)

**Menu Options**:

```
┌  KERITS CLI
│
◇  Current Account: alice (or "None" if not set)
│
◆  What would you like to do?
│  ○ Manage Accounts
│  ○ Manage Registries
│  ○ Manage Contacts
│  ○ Manage Schemas
│  ○ Exit
└
```

**Actions**:
- `Manage Accounts` → Go to [Accounts Menu](#accounts-menu)
- `Manage Registries` → Go to [Registries Menu](#registries-menu)
- `Manage Contacts` → Go to [Contacts Menu](#contacts-menu)
- `Manage Schemas` → Go to [Schemas Menu](#schemas-menu)
- `Exit` → Exit program

---

## Accounts Menu

**Breadcrumb**: `Main > Accounts`

**Menu Options** (conditional based on whether account is set):

### When No Account Selected

```
┌  Account Management
│
◇  No account currently selected
│
◆  What would you like to do?
│  ○ Create New Account
│  ○ Switch Account
│  ○ Back to Main Menu
└
```

### When Account Selected

```
┌  Account Management
│
◇  Current Account: alice
│
◆  What would you like to do?
│  ○ Create New Account
│  ○ Switch Account
│  ○ Rotate Keys
│  ○ Export KEL to File
│  ○ Show KEL Graph
│  ○ Back to Main Menu
└
```

**Actions**:

### Create New Account

1. Prompt for account alias (text input)
   ```
   ◆  Enter account alias:
   │  alice
   └
   ```

2. Prompt for mnemonic option:
   ```
   ◆  Mnemonic:
   │  ○ Generate new mnemonic (recommended)
   │  ○ Enter existing mnemonic
   └
   ```

3. If "Generate new mnemonic":
   - Generate using `dsl.newMnemonic()`
   - Display mnemonic with warning:
     ```
     ┌  Generated Mnemonic
     │
     ◇  IMPORTANT: Save this mnemonic securely!
     │
     │  word1 word2 word3 ... word24
     │
     ◇  This is the ONLY time you'll see this mnemonic.
     │  You'll need it to recover your account.
     │
     ◆  Have you saved the mnemonic?
     │  ○ Yes, I've saved it
     │  ○ No, cancel account creation
     └
     ```

4. If "Enter existing mnemonic":
   - Prompt for 24-word mnemonic (text input)
   - Validate mnemonic format

5. Create account via DSL:
   ```typescript
   const dsl = createKeritsDSL(store);
   const accountDsl = await dsl.newAccount(alias, mnemonic);
   ```

6. Set as current account:
   ```typescript
   await setCurrentAccount(alias);
   ```

7. Show success message:
   ```
   ◇  ✓ Account 'alice' created successfully
   │
   ◇  AID: EAbcdef123456...
   └
   ```

8. Return to [Accounts Menu](#accounts-menu)

### Switch Account

1. Get list of accounts from `~/.kerits/`
2. If no accounts exist:
   ```
   ◇  No accounts found. Create an account first.
   └
   ```
   Return to [Accounts Menu](#accounts-menu)

3. Show account selection:
   ```
   ◆  Select account:
   │  ○ alice
   │  ○ bob
   │  ○ carol
   │  ○ Cancel
   └
   ```

4. Set selected account as current:
   ```typescript
   await setCurrentAccount(selectedAlias);
   ```

5. Show success:
   ```
   ◇  ✓ Switched to account 'bob'
   └
   ```

6. Return to [Accounts Menu](#accounts-menu)

### Rotate Keys

1. Show current key information:
   ```
   ┌  Rotate Keys
   │
   ◇  Current Account: alice
   │  Current Key: EAbcdef123456...
   │  Sequence Number: 2
   └
   ```

2. Prompt for rotation type:
   ```
   ◆  Key Rotation:
   │  ○ Generate new mnemonic (recommended)
   │  ○ Use existing mnemonic
   │  ○ Cancel
   └
   ```

3. If "Generate new mnemonic":
   - Generate and display mnemonic (similar to account creation)
   - Require confirmation that it's been saved

4. If "Use existing mnemonic":
   - Prompt for 24-word mnemonic
   - Validate format

5. Perform rotation:
   ```typescript
   const { dsl } = await loadAccountDSL(currentAccount);
   const accountDsl = dsl.account(currentAccount);
   await accountDsl.rotateKeys(newMnemonic);
   ```

6. Show success:
   ```
   ◇  ✓ Keys rotated successfully
   │
   ◇  New Key: EFghijk789012...
   │  Sequence Number: 3
   └
   ```

7. Return to [Accounts Menu](#accounts-menu)

### Export KEL to File

1. Prompt for export file path:
   ```
   ◆  Export KEL to file:
   │  ./alice-kel.cesr
   └
   ```

2. Export using DSL:
   ```typescript
   const { dsl } = await loadAccountDSL(currentAccount);
   const accountDsl = dsl.account(currentAccount);
   const kelCesr = await accountDsl.exportKel();
   await fs.writeFile(filePath, kelCesr);
   ```

3. Show success:
   ```
   ◇  ✓ KEL exported to './alice-kel.cesr'
   │
   ◇  Events exported: 3
   │  File size: 1.2 KB
   └
   ```

4. Return to [Accounts Menu](#accounts-menu)

### Show KEL Graph

1. Get graph data from DSL:
   ```typescript
   const { dsl } = await loadAccountDSL(currentAccount);
   const graph = await dsl.graph();
   ```

2. Render graph using Ink's AdvancedGraphView component:
   - Show in separate Ink render context
   - Display graph with boxes and lines
   - Wait for user to press any key to return

3. Return to [Accounts Menu](#accounts-menu)

---

## Registries Menu

**Breadcrumb**: `Main > Registries`

**Requirements**: Must have an account selected

### When No Account Selected

```
┌  Credential Registries
│
◇  No account selected
│
◆  Please create or select an account first.
│  ○ Back to Main Menu
└
```

### When Account Selected

```
┌  Credential Registries
│
◇  Account: alice
│
◆  What would you like to do?
│  ○ Create New Registry
│  ○ Select Registry (manage credentials)
│  ○ Back to Main Menu
└
```

**Actions**:


### Create New Registry

1. Prompt for registry alias:
   ```
   ◆  Enter registry alias:
   │  health-records
   └
   ```

2. Show success:
   ```
   ◇  ✓ Registry 'health-records' created
   │
   ◇  Registry ID: EBregistry123...
   └
   ```

3. Return to [Registries Menu](#registries-menu)

### Select Registry

1. Load registries and show selection:
   ```
   ◆  Select registry:
   │  ○ health-records (EBregistry123...)
   │  ○ certifications (EBregistry456...)
   │  ○ Cancel
   └
   ```

2. Go to [Credentials Menu](#credentials-menu) with selected registry

### Export Registry CESR

1. Load registries and show selection:
   ```
   ◆  Select registry to export:
   │  ○ health-records (EBregistry123...)
   │  ○ certifications (EBregistry456...)
   │  ○ Cancel
   └
   ```

2. Prompt for file path:
   ```
   ◆  Export to file:
   │  ./health-records-tel.cesr
   └
   ```

3. Export:
   ```typescript
   const registryDsl = accountDsl.registry(registryAlias);
   const telCesr = await registryDsl.exportTel();
   await fs.writeFile(filePath, telCesr);
   ```

4. Show success and return to [Registries Menu](#registries-menu)

---

## Credentials Menu

**Breadcrumb**: `Main > Registries > {registry-alias}`

**Context**: Selected registry (e.g., "health-records")

```
┌  Credentials - health-records
│
◇  Registry ID: EBregistry123...
│
◆  What would you like to do?
│  ○ List Credentials
│  ○ Create New Credential
│  ○ Revoke Credential
│  ○ Show Credentials Graph
│  ○ Export Credential
│  ○ Back to Registries
└
```

**Actions**:

### List Credentials

1. Load credentials:
   ```typescript
   const registryDsl = accountDsl.registry(registryAlias);
   const credentials = await registryDsl.listCredentials();
   ```

2. Display table:
   ```
   ┌  Credentials in health-records
   │
   │  SAID              Schema          Issued      Status
   │  ───────────────────────────────────────────────────────
   │  ESaid1234...      blood-pressure  2024-10-06  active
   │  ESaid5678...      cholesterol     2024-10-05  revoked
   │
   ◇  Total: 2 credentials
   └
   ```

3. Return to [Credentials Menu](#credentials-menu)

### Create New Credential

1. Get list of available schemas:
   ```typescript
   const schemas = await dsl.listSchemas();
   ```

2. Show schema selection:
   ```
   ◆  Select schema:
   │  ○ blood-pressure
   │  ○ cholesterol
   │  ○ medical-record
   │  ○ Cancel
   └
   ```

3. Load schema to show required fields:
   ```typescript
   const schemaDsl = dsl.schema(schemaName);
   const schema = await schemaDsl.get();
   ```

4. Prompt for each field in schema:
   ```
   ◇  Schema: blood-pressure
   │
   ◆  systolic (number):
   │  120
   │
   ◆  diastolic (number):
   │  80
   │
   ◆  unit (string):
   │  mmHg
   └
   ```

5. Prompt for recipient (optional):
   ```
   ◆  Recipient (optional):
   │  ○ Select from contacts
   │  ○ Enter AID manually
   │  ○ No recipient (self-signed)
   └
   ```

6. Create credential:
   ```typescript
   const registryDsl = accountDsl.registry(registryAlias);
   const acdcDsl = await registryDsl.issue({
     schema: schemaName,
     data: credentialData,
     recipient: recipientAid,
   });
   ```

7. Show success:
   ```
   ◇  ✓ Credential created
   │
   ◇  SAID: ESaid1234...
   │  Schema: blood-pressure
   │  Issued: 2024-10-06T12:34:56Z
   └
   ```

8. Return to [Credentials Menu](#credentials-menu)

### Revoke Credential

1. List credentials and allow selection:
   ```
   ◆  Select credential to revoke:
   │  ○ ESaid1234... (blood-pressure, 2024-10-06)
   │  ○ ESaid5678... (cholesterol, 2024-10-05)
   │  ○ Cancel
   └
   ```

2. Confirm revocation:
   ```
   ◆  Are you sure you want to revoke this credential?
   │  SAID: ESaid1234...
   │  ○ Yes, revoke it
   │  ○ No, cancel
   └
   ```

3. Revoke:
   ```typescript
   const acdcDsl = registryDsl.credential(credentialSaid);
   await acdcDsl.revoke();
   ```

4. Show success and return to [Credentials Menu](#credentials-menu)

### Show Credentials Graph

1. Get graph data:
   ```typescript
   const registryDsl = accountDsl.registry(registryAlias);
   const graph = await registryDsl.graph();
   ```

2. Render using Ink AdvancedGraphView component

3. Return to [Credentials Menu](#credentials-menu)

### Export Credential

1. List credentials and allow selection
2. Prompt for file path
3. Export:
   ```typescript
   const acdcDsl = registryDsl.credential(credentialSaid);
   const acdcCesr = await acdcDsl.export();
   await fs.writeFile(filePath, acdcCesr);
   ```

4. Show success and return to [Credentials Menu](#credentials-menu)

---

## Contacts Menu

**Breadcrumb**: `Main > Contacts`

**Requirements**: Must have an account selected

### When Account Selected

```
┌  Contacts
│
◇  Account: alice
│
◆  What would you like to do?
│  ○ List Contacts
│  ○ Add Contact from KEL File
│  ○ Remove Contact
│  ○ Back to Main Menu
└
```

**Actions**:

### List Contacts

1. Load contacts:
   ```typescript
   const { dsl } = await loadAccountDSL(currentAccount);
   const accountDsl = dsl.account(currentAccount);
   const contacts = await accountDsl.listContacts();
   ```

2. Display table:
   ```
   ┌  Contacts for alice
   │
   │  Alias       AID
   │  ────────────────────────────────────
   │  bob         EBob123456...
   │  carol       ECarol789...
   │  hospital    EHosp456...
   │
   ◇  Total: 3 contacts
   └
   ```

3. Return to [Contacts Menu](#contacts-menu)

### Add Contact from KEL File

1. Prompt for file path:
   ```
   ◆  KEL file path:
   │  ./bob-kel.cesr
   └
   ```

2. Prompt for contact alias:
   ```
   ◆  Contact alias:
   │  bob
   └
   ```

3. Import contact:
   ```typescript
   const kelData = await fs.readFile(filePath, 'utf-8');
   const contactDsl = await accountDsl.addContact(alias, kelData);
   ```

4. Show success:
   ```
   ◇  ✓ Contact 'bob' added
   │
   ◇  AID: EBob123456...
   │  Events imported: 3
   └
   ```

5. Return to [Contacts Menu](#contacts-menu)

### Remove Contact

1. List contacts and allow selection:
   ```
   ◆  Select contact to remove:
   │  ○ bob (EBob123456...)
   │  ○ carol (ECarol789...)
   │  ○ hospital (EHosp456...)
   │  ○ Cancel
   └
   ```

2. Confirm removal:
   ```
   ◆  Remove contact 'bob'?
   │  ○ Yes, remove
   │  ○ No, cancel
   └
   ```

3. Remove contact:
   ```typescript
   await accountDsl.removeContact(alias);
   ```

4. Show success and return to [Contacts Menu](#contacts-menu)

---

## Schemas Menu

**Breadcrumb**: `Main > Schemas`

**Requirements**: Must have an account selected

```
┌  Schemas
│
◇  Account: alice
│
◆  What would you like to do?
│  ○ List Schemas
│  ○ Create New Schema
│  ○ View Schema
│  ○ Export Schema to File
│  ○ Import Schema from File
│  ○ Back to Main Menu
└
```

**Actions**:

### List Schemas

1. Load schemas:
   ```typescript
   const { dsl } = await loadAccountDSL(currentAccount);
   const schemas = await dsl.listSchemas();
   ```

2. Display table:
   ```
   ┌  Schemas for alice
   │
   │  Name              SAID              Fields
   │  ──────────────────────────────────────────────
   │  blood-pressure    ESch1234...       3
   │  cholesterol       ESch5678...       2
   │  medical-record    ESch9012...       8
   │
   ◇  Total: 3 schemas
   └
   ```

3. Return to [Schemas Menu](#schemas-menu)

### Create New Schema

1. Prompt for schema name:
   ```
   ◆  Schema name:
   │  blood-pressure
   └
   ```

2. Prompt for creation method:
   ```
   ◆  How would you like to create the schema?
   │  ○ Interactive (prompt for each field)
   │  ○ JSON input (paste JSON)
   │  ○ From file
   └
   ```

3. If "Interactive":
   - Prompt for number of fields
   - For each field:
     ```
     ◆  Field 1 name:
     │  systolic
     │
     ◆  Field 1 type:
     │  ○ string
     │  ○ number
     │  ○ boolean
     │  ○ object
     │  ○ array
     │
     ◆  Field 1 required?
     │  ○ Yes
     │  ○ No
     │
     ◆  Add another field?
     │  ○ Yes
     │  ○ No, create schema
     └
     ```

4. If "JSON input":
   - Show multi-line editor
   - Parse and validate JSON

5. If "From file":
   - Prompt for file path
   - Load and validate JSON

6. Create schema:
   ```typescript
   const schemaDsl = await dsl.createSchema(name, schemaDefinition);
   ```

7. Show success:
   ```
   ◇  ✓ Schema 'blood-pressure' created
   │
   ◇  SAID: ESch1234...
   │  Fields: 3
   └
   ```

8. Return to [Schemas Menu](#schemas-menu)

### View Schema

1. List schemas and allow selection
2. Load and display schema:
   ```
   ┌  Schema: blood-pressure
   │
   ◇  SAID: ESch1234...
   │
   │  {
   │    "type": "object",
   │    "properties": {
   │      "systolic": { "type": "number" },
   │      "diastolic": { "type": "number" },
   │      "unit": { "type": "string" }
   │    },
   │    "required": ["systolic", "diastolic", "unit"]
   │  }
   │
   ◇  Press any key to continue
   └
   ```

3. Return to [Schemas Menu](#schemas-menu)

### Export Schema to File

1. List schemas and allow selection
2. Prompt for file path
3. Export:
   ```typescript
   const schemaDsl = dsl.schema(schemaName);
   const schemaData = await schemaDsl.export();
   await fs.writeFile(filePath, JSON.stringify(schemaData, null, 2));
   ```

4. Show success and return to [Schemas Menu](#schemas-menu)

### Import Schema from File

1. Prompt for file path:
   ```
   ◆  Schema file path:
   │  ./schemas/blood-pressure.json
   └
   ```

2. Prompt for schema alias:
   ```
   ◆  Schema name/alias:
   │  blood-pressure
   └
   ```

3. Load file and import:
   ```typescript
   const schemaJson = await fs.readFile(filePath, 'utf-8');
   const schemaData = JSON.parse(schemaJson);
   const schemaDsl = await dsl.createSchema(alias, schemaData);
   ```

4. Show success:
   ```
   ◇  ✓ Schema 'blood-pressure' imported
   │
   ◇  SAID: ESch1234...
   │  File: ./schemas/blood-pressure.json
   └
   ```

5. Return to [Schemas Menu](#schemas-menu)

---

## Error Handling

All operations should include error handling:

```
✖  Error: Failed to create account
│
│  Invalid mnemonic format. Expected 24 words, got 12.
│
◇  Press any key to continue
```

After showing error, return to the menu where the error occurred.

## Graph Visualization

When showing graphs (KEL, TEL, or ACDC graphs):

1. Use Ink to render the AdvancedGraphView component
2. Show in a separate render context
3. Display:
   ```
   ┌  KEL Graph - alice
   │
   │  [ASCII graph with boxes and lines]
   │
   ◇  Press any key to return
   └
   ```

4. Wait for keypress, then exit Ink and return to menu

## Session Flow Example

```
1. Launch CLI
   → Main Menu (no account)

2. Select "Manage Accounts"
   → Accounts Menu

3. Select "Create New Account"
   → Prompt: alias = "alice"
   → Prompt: Generate mnemonic
   → Display mnemonic
   → Confirm saved
   → Success
   → Return to Accounts Menu (now shows alice)

4. Select "Back to Main Menu"
   → Main Menu (shows alice)

5. Select "Manage Registries"
   → Registries Menu

6. Select "Create New Registry"
   → Prompt: alias = "health-records"
   → Use defaults
   → Success
   → Return to Registries Menu

7. Select "Select Registry"
   → Choose "health-records"
   → Credentials Menu

8. Select "Create New Credential"
   → Choose schema "blood-pressure"
   → Enter field values
   → No recipient
   → Success
   → Return to Credentials Menu

9. Select "Show Credentials Graph"
   → Render graph in Ink
   → Wait for keypress
   → Return to Credentials Menu

10. Select "Back to Registries"
    → Registries Menu

11. Back to Main Menu → Exit
```

## Implementation Notes

### Technology Stack
- `@clack/prompts` - All menus, prompts, and user input
- `Ink` with `AdvancedGraphView` - Graph visualization only
- Node.js `fs/promises` - File operations
- DSL - All business logic

### State Management
- Store current account in `~/.kerits/.current`
- Load account DSL on demand when needed
- No global state beyond current account

### Navigation
- Each menu function returns control to caller
- Use simple function calls for navigation (no router needed)
- Breadcrumb shown in clack title/intro

### File Paths
- Default to current directory for exports
- Allow user to specify full or relative paths
- Create directories if they don't exist for exports
