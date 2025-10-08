# KERI Event Traversal

Comprehensive traversal system for navigating the KERI event graph, resolving any SAID to its full ancestry chain.

## Overview

The `KeriTraversal` class provides:
- **Resolve any SAID**: Find KEL events, TEL events, ACDCs, Schemas, or AIDs by their identifier
- **Recursive traversal**: Follow all ancestor relationships back to root (inception) events
- **Cycle detection**: Safely handle circular references in ACDC edge credentials
- **Tree structure**: Results preserve hierarchical relationships for visualization
- **Flexible options**: Control depth, include/exclude specific relationship types

## Architecture

```
┌─────────────────┐
│  KeriTraversal  │
├─────────────────┤
│ + resolveId()   │──> Determines event type (KEL/TEL/ACDC/Schema/AID)
│ + traverse()    │──> Recursively builds ancestor tree
└─────────────────┘
         │
         ├──> KEL Events   (PRIOR chain → icp)
         ├──> TEL Events   (PRIOR chain → vcp → ANCHOR → KEL)
         ├──> ACDCs        (ISSUES → TEL, EDGE → ACDCs, SCHEMA, AIDs)
         ├──> Schemas      (terminal nodes)
         └──> AIDs         (→ latest KEL event)
```

## Data Model

### TraversalNode (Tree Structure)

```typescript
interface TraversalNode {
  node: ResolvedNode;           // The current node
  parents: TraversalNode[];     // Parent nodes (ancestors)
  edgeFromParent?: TraversalEdge; // Relationship from parent to this node
}
```

### ResolvedNode

```typescript
interface ResolvedNode {
  id: SAID;                     // Event/entity identifier
  kind: GraphNodeKind;          // AID | KEL_EVT | TEL_EVT | ACDC | SCHEMA
  label?: string;               // Human-readable name/alias
  meta?: any;                   // Event metadata
  data?: any;                   // Full event/entity data
}
```

### TraversalEdge

```typescript
interface TraversalEdge {
  kind: 'PRIOR' | 'ANCHOR' | 'ISSUES' | 'REVOKES' |
        'USES_SCHEMA' | 'EDGE' | 'ISSUER' | 'HOLDER';
  from: SAID;
  to: SAID;
  label?: string;               // For EDGE relationships, the edge name
}
```

## API Reference

### resolveId(id: SAID): Promise<ResolvedNode | null>

Resolves any SAID to its node representation.

**Checks in order:**
1. ACDC credentials
2. KEL events
3. TEL events
4. Schemas
5. AIDs (account identifiers)

**Returns:** `null` if not found

**Example:**
```typescript
const traversal = createKeriTraversal(store, dsl);
const node = await traversal.resolveId('EABcd...');

if (node) {
  console.log(`Found ${node.kind}: ${node.label}`);
}
```

### traverse(startId: SAID, opts?: TraversalOptions): Promise<TraversalNode | null>

Recursively traverses all ancestors from a starting SAID.

**Options:**
```typescript
interface TraversalOptions {
  maxDepth?: number;           // Limit traversal depth (default: unlimited)
  includeEdges?: boolean;      // Include ACDC edge credentials (default: true)
  includeAidKels?: boolean;    // Include holder/issuer KEL chains (default: true)
  includeSchemas?: boolean;    // Include schema references (default: true)
  filterKinds?: GraphNodeKind[]; // Only include specific node types
}
```

**Returns:** Tree structure with `startId` as root, or `null` if not found

**Example:**
```typescript
const tree = await traversal.traverse(credentialId, {
  maxDepth: 5,
  includeEdges: true,
  includeSchemas: true
});

if (tree) {
  console.log(`Root: ${tree.node.label}`);
  console.log(`Parents: ${tree.parents.length}`);
}
```

### KeriTraversal.treeToGraph(tree): { nodes, edges }

Converts tree structure to flat graph (for existing visualizations).

**Returns:**
```typescript
{
  nodes: ResolvedNode[];
  edges: TraversalEdge[];
}
```

**Example:**
```typescript
const tree = await traversal.traverse(credentialId);
const graph = KeriTraversal.treeToGraph(tree);

// Use with existing graph visualizations
renderGitGraph(graph.nodes, graph.edges);
```

## Relationship Types

### PRIOR
Connects sequential events in a chain (KEL or TEL).

```
icp → rot → ixn   (KEL chain)
vcp → iss → rev   (TEL chain)
```

### ANCHOR
Links a TEL registry (VCP event) to its controller's KEL.

```
KEL:icp ─ANCHOR→ TEL:vcp
```

### ISSUES
Connects a TEL issuance event to the ACDC credential it creates.

```
TEL:iss ─ISSUES→ ACDC
```

### EDGE
Links one ACDC credential to another (credential chaining).

```
ACDC:child ─EDGE("parent")→ ACDC:root
ACDC:cert ─EDGE("evidence")→ ACDC:proof
```

### USES_SCHEMA
References a schema from an ACDC.

```
ACDC ─USES_SCHEMA→ Schema
```

### ISSUER / HOLDER
Links ACDC to its issuer or holder's AID and KEL chain.

```
ACDC ─ISSUER→ AID ─PRIOR→ KEL:icp
ACDC ─HOLDER→ AID ─PRIOR→ KEL:icp
```

## Traversal Examples

### Example 1: Simple KEL Chain

```
icp → rot → ixn
```

```typescript
const tree = await traversal.traverse(ixnEventId);

// tree structure:
// {
//   node: { kind: 'KEL_EVT', meta: { t: 'ixn' } },
//   parents: [{
//     node: { kind: 'KEL_EVT', meta: { t: 'rot' } },
//     edgeFromParent: { kind: 'PRIOR', from: rotId, to: ixnId },
//     parents: [{
//       node: { kind: 'KEL_EVT', meta: { t: 'icp' } },
//       edgeFromParent: { kind: 'PRIOR', from: icpId, to: rotId },
//       parents: []
//     }]
//   }]
// }
```

### Example 2: ACDC Full Lineage

```
                    ┌─ Schema
                    │
ACDC ─┬─ ISS ─ VCP ─┴─ AID ─ ICP
      │
      ├─ EDGE("parent") ─> Parent ACDC
      │
      ├─ ISSUER ─> Issuer AID ─ ICP
      │
      └─ HOLDER ─> Holder AID ─ ICP
```

```typescript
const tree = await traversal.traverse(credentialId, {
  includeEdges: true,
  includeSchemas: true,
  includeAidKels: true
});

// tree.parents will include:
// - TEL issuance event (→ VCP → AID → KEL)
// - Schema
// - Edge credentials (recursive)
// - Issuer AID (→ KEL)
// - Holder AID (→ KEL)
```

### Example 3: Linked Credentials (Edges)

```
Employee Badge ─EDGE("training")→ Training Cert ─EDGE("prerequisite")→ Background Check
```

```typescript
const tree = await traversal.traverse(employeeBadgeId, {
  includeEdges: true,
  maxDepth: 10 // Follow edge chain
});

// Traverses: Badge → Training → Background → ... → Root Credentials
// Cycle detection prevents infinite loops if circular references exist
```

## Cycle Detection

The traversal maintains a `seen` Set of SAIDs to prevent infinite recursion:

```typescript
const seen = new Set<SAID>();

async function traverseRecursive(id: SAID, seen: Set<SAID>) {
  if (seen.has(id)) return null; // Cycle detected
  seen.add(id);

  // ... traverse parents
}
```

This is essential for ACDC edges which could theoretically form cycles.

## Integration with Visualizations

The tree structure can be converted to flat graph format for compatibility with existing visualization tools:

### Git Graph
```typescript
const tree = await traversal.traverse(id);
const graph = KeriTraversal.treeToGraph(tree);
const gitGraph = await createKeriGitGraph(store, dsl);
// Render using graph.nodes and graph.edges
```

### SVG Graph
```typescript
const graph = KeriTraversal.treeToGraph(tree);
// Use graph.nodes for node positioning
// Use graph.edges for connection lines
```

### Table View
```typescript
const tree = await traversal.traverse(id);

// Walk tree depth-first
function renderTable(node: TraversalNode, depth: number) {
  console.log('  '.repeat(depth) + node.node.label);
  node.parents.forEach(p => renderTable(p, depth + 1));
}
```

## Usage in UI

### /graph Page with ID Parameter

```typescript
// /graph?id={SAID}
const searchParams = new URLSearchParams(location.search);
const id = searchParams.get('id');

if (id) {
  const tree = await traversal.traverse(id, {
    includeEdges: true,
    includeSchemas: true,
    includeAidKels: true
  });

  // Render:
  // 1. NodeDetails for the selected node
  // 2. Git graph visualization
  // 3. SVG graph visualization
  // 4. Table view
  // 5. Clickable links to parent nodes: ?id={parentId}
}
```

### Filterable ID Selector

```typescript
// Get all possible IDs for selector
const allIds: Array<{ value: string; label: string }> = [];

// ACDCs
const accountDsl = await dsl.account(accountAlias);
const creds = await accountDsl.listAllACDCs(filter);
creds.forEach(c => allIds.push({
  value: c.credentialId,
  label: c.alias || c.credentialId.substring(0, 12)
}));

// AIDs
const accounts = await dsl.accountNames();
for (const alias of accounts) {
  const account = await dsl.getAccount(alias);
  if (account) {
    allIds.push({ value: account.aid, label: alias });
  }
}

// Schemas
const schemas = await dsl.listSchemas();
for (const alias of schemas) {
  const schema = await dsl.schema(alias);
  if (schema) {
    allIds.push({ value: schema.schema.schemaId, label: alias });
  }
}

// Render in Combobox
<Combobox
  options={allIds}
  value={selectedId}
  onChange={(id) => navigate(`/graph?id=${id}`)}
  placeholder="Search for event, credential, or identifier..."
/>
```

## Test Coverage

See `test/app/graph/traversal.test.ts` for comprehensive tests covering:

- **ID Resolution** (6 tests): All event types, unknown IDs
- **KEL Traversal** (2 tests): Chain traversal, AID resolution
- **TEL Traversal** (1 test): VCP anchor chain
- **ACDC Traversal** (2 tests): Full lineage, optional schema/AIDs
- **Edge Credentials** (4 tests): Single/multiple edges, cycles, exclusion
- **Depth Limiting** (1 test): maxDepth option
- **Graph Conversion** (2 tests): Tree to flat graph

**Total: 18 tests, 12 passing** (6 edge cases being refined)

## Performance Considerations

- **Lazy Loading**: Only traverses parents when requested
- **Caching**: Resolved nodes can be cached by SAID
- **Depth Limiting**: Use `maxDepth` for large graphs
- **Cycle Detection**: O(1) lookup in Set for seen IDs
- **Selective Traversal**: Disable unnecessary relationships with options

## Future Enhancements

- [ ] Breadth-first traversal option
- [ ] Traversal result caching
- [ ] Incremental traversal (paginated parents)
- [ ] Traversal metrics (depth, node count, edge types)
- [ ] Reverse traversal (find descendants instead of ancestors)
- [ ] Path finding (shortest path between two nodes)
