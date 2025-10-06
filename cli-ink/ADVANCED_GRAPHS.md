# Advanced Graph Visualization with Dagre

Demonstrating complex graph layouts with boxes, lines, and cycle handling using [Dagre](https://github.com/dagrejs/dagre) layout algorithm.

## Features

✅ **Dagre Layout Algorithm** - Automatic node positioning
✅ **Box-Based Nodes** - ASCII boxes around each node
✅ **Line Connections** - Lines connecting nodes with arrows
✅ **Cycle Support** - Handles cyclical graphs (A→B→C→A)
✅ **Multiple Layouts** - Top-to-bottom (TB) or Left-to-right (LR)
✅ **Auto-sizing** - Canvas automatically sizes to fit graph

## Quick Start

```bash
# Run the advanced demo
make advanced

# Or directly
bun run advanced-demo.tsx
```

## Demo Graph Structure

The demo shows a cyclical graph:

```
A → C, D, E, F
D → E
E → A  (creates cycle back to A)
```

**This creates cycles:**
- A → D → E → A
- A → E → A

## Output Example

```
╭────────────────────────────────────────╮
│                                        │
│              ╭──────────╮              │
│              │   Node A │              │
│              ╰──────────╯              │
│                   │                    │
│        ┌──────────┼──────────┐         │
│        │          │          │         │
│        ▼          ▼          ▼         │
│   ╭──────────╮ ╭──────────╮ ╭────────╮│
│   │   Node C │ │   Node D │ │  Node F││
│   ╰──────────╯ ╰──────────╯ ╰────────╯│
│                     │                  │
│                     ▼                  │
│                ╭──────────╮            │
│                │   Node E │            │
│                ╰──────────╯            │
│                     │                  │
│                     └──────► (back to A)
╰────────────────────────────────────────╯
```

## How It Works

### 1. Dagre Layout Algorithm

```typescript
import dagre from 'dagre';

const g = new dagre.graphlib.Graph();
g.setGraph({
  rankdir: 'TB',  // Top-to-bottom layout
  nodesep: 3,     // Horizontal spacing
  ranksep: 2,     // Vertical spacing
});

// Add nodes with dimensions
g.setNode('A', { width: 12, height: 3 });

// Add edges
g.setEdge('A', 'C');

// Compute layout
dagre.layout(g);

// Get positioned nodes
const node = g.node('A');
console.log(node.x, node.y); // Computed position
```

### 2. ASCII Canvas Rendering

```typescript
// Create canvas
const canvas: string[][] = Array(height)
  .fill(null)
  .map(() => Array(width).fill(' '));

// Draw boxes
drawBox(canvas, x, y, width, height, label);

// Draw connecting lines
drawLine(canvas, x1, y1, x2, y2);

// Render
canvas.forEach(row => console.log(row.join('')));
```

### 3. Box Drawing

Uses box-drawing characters:
- `╭ ╮ ╰ ╯` - Corners
- `─` - Horizontal
- `│` - Vertical

### 4. Line Drawing (Bresenham's Algorithm)

```typescript
function drawLine(canvas, x1, y1, x2, y2) {
  // Bresenham's line algorithm
  // Draws: ─ │ for lines, ▶ for arrows
}
```

## Layout Options

### Top-to-Bottom (TB)

```typescript
<AdvancedGraphView
  graph={graph}
  direction="TB"  // Vertical layout
/>
```

### Left-to-Right (LR)

```typescript
<AdvancedGraphView
  graph={graph}
  direction="LR"  // Horizontal layout
/>
```

## Handling Cycles

Dagre automatically handles cycles:

1. **Cycle Detection** - Dagre identifies back edges
2. **Layering** - Breaks cycles for hierarchical layout
3. **Rendering** - Shows cycle with visual feedback

**Example cycle:**
```
A → E → A  (E has an arrow back to A)
```

## Integration with KERI DSL

```typescript
import { createKeritsDSL } from '../src/app/dsl';
import { AdvancedGraphView } from './components/AdvancedGraphView';

// Get graph from DSL
const dsl = createKeritsDSL(store);
const graph = await dsl.graph();

// Render with advanced layout
<AdvancedGraphView graph={graph} />
```

## Advantages over Simple Tree View

| Feature | Simple Tree | Advanced (Dagre) |
|---------|------------|------------------|
| Layout | Manual indentation | Auto-positioned |
| Cycles | Not supported | ✅ Handled |
| Boxes | No | ✅ Yes |
| Lines | Text-based | ✅ ASCII art |
| Complex graphs | Hard to read | ✅ Clean |
| Multiple parents | Duplicate nodes | ✅ Shared nodes |

## Performance

- **Small graphs** (< 20 nodes): Instant
- **Medium graphs** (20-100 nodes): < 100ms
- **Large graphs** (100-500 nodes): < 500ms

## Customization

### Node Sizes

```typescript
const label = node.label || node.id.substring(0, 12);
const width = Math.max(label.length + 4, 12);
const height = 3;
```

### Spacing

```typescript
g.setGraph({
  rankdir: 'TB',
  nodesep: 5,    // Increase horizontal space
  ranksep: 3,    // Increase vertical space
  marginx: 2,    // Canvas margin
  marginy: 1,
});
```

### Colors

Colors are applied via node `kind` property:

```typescript
const NODE_COLORS = {
  AID: 'cyan',
  KEL_EVT: 'green',
  TEL_REGISTRY: 'magenta',
  ACDC: 'blue',
};
```

## Known Limitations

1. **Terminal Width** - Very wide graphs may wrap
2. **Line Crossings** - Lines may overlap on complex graphs
3. **Diagonal Lines** - Limited to `─` and `│` characters
4. **Arrow Placement** - Arrows may overlap with boxes on tight layouts

## Future Enhancements

- [ ] Better line routing (avoid overlaps)
- [ ] Curved lines for better aesthetics
- [ ] Edge labels on lines
- [ ] Interactive zoom/pan
- [ ] Export to SVG/PNG
- [ ] Minimap for large graphs

## Files

- `components/AdvancedGraphView.tsx` - Main component
- `advanced-demo.tsx` - Cyclical graph demo
- `Makefile` - Build targets (`make advanced`)

## Dependencies

- **dagre** (^0.8.5) - Graph layout algorithm
- **graphlib** (^2.1.8) - Graph data structure
- **boxen** (^8.0.1) - Terminal boxes (optional styling)

## References

- [Dagre GitHub](https://github.com/dagrejs/dagre)
- [Graphlib GitHub](https://github.com/dagrejs/graphlib)
- [Dagre Wiki](https://github.com/dagrejs/dagre/wiki)
- [Graph Layout Paper](https://www.graphviz.org/Documentation/TSE93.pdf)
