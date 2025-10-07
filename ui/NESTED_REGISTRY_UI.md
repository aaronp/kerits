# Nested Registry UI

The Explorer now supports arbitrary nesting of credential registries (TELs), using a filesystem-like hierarchical interface.

## Architecture

The UI is split into three main components:

### 1. RegistryTreeNavigation (Left Sidebar)
- **Location**: `src/components/explorer/RegistryTreeNavigation.tsx`
- **Purpose**: Displays registry hierarchy as a collapsible tree
- **Features**:
  - Recursive rendering of nested registries
  - Expand/collapse state management
  - Click navigation (updates URL)
  - Depth-based color coding (blue → indigo → purple → pink)
  - Visual tree indicators (folder icons, child counts)
  - Automatic hierarchy building from parent-child relationships

### 2. RegistryBreadcrumbs (Top Bar)
- **Location**: `src/components/explorer/RegistryBreadcrumbs.tsx`
- **Purpose**: Shows navigation path from account root to current registry
- **Features**:
  - Clickable breadcrumbs for quick parent navigation
  - Displays registry aliases instead of IDs
  - Home button to return to account root

### 3. RegistryDetailView (Main Panel)
- **Location**: `src/components/explorer/RegistryDetailView.tsx`
- **Purpose**: Shows details and credentials for selected registry
- **Features**:
  - Registry metadata display (ID, parent info)
  - Action buttons:
    - **Add Sub-Registry**: Create nested child registry
    - **Issue Credential**: Issue ACDC in this registry
    - **Export**: Export registry as CESR
    - **Import**: Import registry data
  - ACDC list with status badges
  - Expandable credential details
  - Dialog-based forms for actions

## URL Structure

The UI uses URL-based routing to track the current registry path:

```
/dashboard/explorer/{accountAlias}/{registryId1}/{registryId2}/...
```

Examples:
- `/dashboard/explorer/default` - Account root (no registry selected)
- `/dashboard/explorer/default/EABcd...` - Top-level registry
- `/dashboard/explorer/default/EABcd.../EFGhi...` - Nested registry (depth 1)
- `/dashboard/explorer/default/EABcd.../EFGhi.../EJKlm...` - Nested registry (depth 2)

## Data Flow

### Hierarchy Building
1. `RegistryTreeNavigation` queries DSL for all registries
2. For each registry, reads the `parentRegistryId` field
3. Builds tree structure with depth calculation
4. Recursively renders nodes with visual styling

### Navigation
1. User clicks on registry in tree navigation
2. Component calls `navigate()` with full path: `accountAlias/regId1/regId2/...`
3. Explorer component parses URL params to extract `registryPath`
4. `RegistryDetailView` loads registry data using the last segment
5. `RegistryBreadcrumbs` displays full path with clickable segments

### Creating Nested Registries
1. User clicks "Add Sub-Registry" button in detail view
2. Dialog opens with registry name input
3. On submit, calls `registryDsl.createRegistry(name)`
  - This internally creates a VCP event with `parentRegistryId` set
  - Anchors the new registry in parent's TEL via ISS event
4. Callback triggers refresh of navigation tree
5. New registry appears as child in tree

## Styling

### Depth-Based Colors
Registries are color-coded by depth to visually distinguish nesting levels:
- **Depth 0** (Root): Blue (`bg-blue-50 dark:bg-blue-950/20`)
- **Depth 1**: Indigo (`bg-indigo-50 dark:bg-indigo-950/20`)
- **Depth 2**: Purple (`bg-purple-50 dark:bg-purple-950/20`)
- **Depth 3+**: Pink (`bg-pink-50 dark:bg-pink-950/20`)

Colors cycle for deeper nesting.

### Visual Tree
- Folder icons (open/closed) indicate expand state
- Indentation increases by 16px per depth level
- Child count badges show number of sub-registries
- Chevron icons (right/down) for expand/collapse

## Backend Integration

The UI relies on the following DSL APIs:

### KeritsDSL
- `account(alias)` - Get account DSL
- `listSchemas()` - List available schemas for credential issuance

### AccountDSL
- `listRegistries()` - Get all registry aliases
- `registry(alias)` - Get registry DSL
- `createRegistry(alias, opts)` - Create top-level registry

### RegistryDSL
- `registry` - Registry metadata object with:
  - `registryId` - Unique identifier
  - `alias` - Human-readable name
  - `issuerAid` - AID of registry owner
  - `parentRegistryId` - ID of parent registry (if nested)
- `createRegistry(alias, opts)` - Create nested child registry
- `issue(params)` - Issue credential in this registry
- `listACDCs()` - List credential aliases
- `acdc(alias)` - Get ACDC DSL
- `export()` - Export registry as CESR
- `revoke(credentialId)` - Revoke a credential

### ACDCDSL
- `acdc` - Credential metadata
- `status()` - Get current status (`issued`, `revoked`)

## Future Enhancements

Potential improvements:
1. **Drag & Drop**: Move credentials between registries
2. **Bulk Operations**: Select multiple credentials for batch actions
3. **Registry Search**: Filter tree by name or ID
4. **Visual Graph**: Show registry hierarchy as node graph
5. **Access Control**: Per-registry permissions
6. **Templates**: Save registry structures as reusable templates
7. **Import Wizard**: Step-by-step import flow with validation
8. **Audit Trail**: Track changes to registry structure over time
