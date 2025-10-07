/**
 * Graph builder for KerStore2 (structured keys)
 */

import type { Kv, StorageKey, Graph, GraphNode, GraphEdge, EventMeta, GraphOptions } from './types';

// Utility functions
function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function decodeJson<T>(bytes: Uint8Array): T {
  return JSON.parse(utf8Decode(bytes)) as T;
}

/**
 * Build graph from structured keys
 */
export async function buildGraphFromStructuredKeys(
  kv: Kv,
  opts?: GraphOptions
): Promise<Graph> {
  const limit = opts?.limit ?? 5000;
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();

  function addNode(n: GraphNode) {
    nodes.set(n.id, n);
  }

  function addEdge(e: GraphEdge) {
    edges.set(e.id, e);
  }

  // List all metadata entries
  const metaPrefix: StorageKey = {
    path: ['meta'],
    type: 'json'
  };

  const allMeta = await kv.listStructured!(metaPrefix, { limit });

  for (const { key, value } of allMeta) {
    if (!value) continue;
    const meta = decodeJson<EventMeta>(value);
    const said = meta.d;

    // Get the raw event to extract SAD fields
    let sad: any = null;
    try {
      // Try to get the event from KEL, TEL, or generic events
      const isKEL = meta.t === "icp" || meta.t === "rot" || meta.t === "ixn";
      const isTEL = meta.t === "vcp" || meta.t === "iss" || meta.t === "rev" || meta.t === "upg" || meta.t === "vtc" || meta.t === "nrx";

      let eventKey: StorageKey | null = null;
      if (isKEL && meta.i) {
        eventKey = {
          path: ['kel', meta.i, said],
          type: 'cesr',
          meta: { eventType: meta.t, cesrEncoding: meta.cesrEncoding || 'binary' }
        };
      } else if (isTEL && meta.ri) {
        eventKey = {
          path: ['tel', meta.ri, said],
          type: 'cesr',
          meta: { eventType: meta.t, cesrEncoding: meta.cesrEncoding || 'binary' }
        };
      } else {
        eventKey = {
          path: ['events', said],
          type: 'cesr',
          meta: { eventType: meta.t, cesrEncoding: meta.cesrEncoding || 'binary' }
        };
      }

      if (eventKey) {
        const rawBytes = await kv.getStructured!(eventKey);
        if (rawBytes) {
          const rawStr = utf8Decode(rawBytes);
          // Extract JSON from CESR frame (find first '{' to last '}')
          const start = rawStr.indexOf('{');
          const end = rawStr.lastIndexOf('}');
          if (start >= 0 && end > start) {
            sad = JSON.parse(rawStr.substring(start, end + 1));
          }
        }
      }
    } catch (e) {
      // If parsing fails, continue without SAD
    }

    // Determine node kinds
    const isKEL = meta.t === "icp" || meta.t === "rot" || meta.t === "ixn";
    const isVCP = meta.t === "vcp";
    const isTEL = meta.t === "iss" || meta.t === "rev" || meta.t === "upg" || meta.t === "vtc" || meta.t === "nrx";

    if (meta.i && isKEL) {
      // AID node
      addNode({ id: meta.i, kind: "AID", label: meta.i.substring(0, 12) + "..." });

      // KEL event node
      addNode({
        id: meta.d,
        kind: "KEL_EVT",
        label: `${meta.t.toUpperCase()} #${meta.s}`,
        meta: { t: meta.t, s: meta.s, eventMeta: meta },
      });

      // Prior link
      if (meta.p) {
        addEdge({
          id: `PRIOR:${meta.p}->${meta.d}`,
          from: meta.p,
          to: meta.d,
          kind: "PRIOR",
          label: "prior",
        });
      }

      // Edge from AID to event
      addEdge({
        id: `AID_EVENT:${meta.i}->${meta.d}`,
        from: meta.i,
        to: meta.d,
        kind: "MEMBER",
        label: "event",
      });

      // Handle seals (anchors to other events/registries)
      if (sad?.a && Array.isArray(sad.a)) {
        for (const seal of sad.a) {
          if (seal.i) {
            // Registry anchor
            addNode({
              id: seal.i,
              kind: "TEL_REGISTRY",
              label: seal.i.substring(0, 12) + "...",
            });
            addEdge({
              id: `ANCHOR:${meta.d}->${seal.i}`,
              from: meta.d,
              to: seal.i,
              kind: "ANCHOR",
              label: "anchors",
            });
          }
        }
      }
    }

    if (isVCP && meta.ri) {
      // TEL Registry node
      addNode({
        id: meta.ri,
        kind: "TEL_REGISTRY",
        label: meta.ri.substring(0, 12) + "...",
      });

      // VCP event node
      addNode({
        id: meta.d,
        kind: "TEL_EVT",
        label: `VCP #${meta.s}`,
        meta: { t: meta.t, s: meta.s, eventMeta: meta },
      });

      // Edge from registry to VCP
      addEdge({
        id: `TEL_REG_EVENT:${meta.ri}->${meta.d}`,
        from: meta.ri,
        to: meta.d,
        kind: "MEMBER",
        label: "inception",
      });

      // Link to issuer AID
      if (meta.i) {
        addNode({ id: meta.i, kind: "AID", label: meta.i.substring(0, 12) + "..." });
        addEdge({
          id: `ISSUER:${meta.i}->${meta.ri}`,
          from: meta.i,
          to: meta.ri,
          kind: "ISSUES",
          label: "issues",
        });
      }
    }

    if (isTEL && !isVCP && meta.ri) {
      // TEL event node (iss, rev, etc.)
      addNode({
        id: meta.d,
        kind: "TEL_EVT",
        label: `${meta.t.toUpperCase()} #${meta.s}`,
        meta: { t: meta.t, s: meta.s, eventMeta: meta },
      });

      // Edge from registry to event
      if (meta.ri) {
        addNode({
          id: meta.ri,
          kind: "TEL_REGISTRY",
          label: meta.ri.substring(0, 12) + "...",
        });
        addEdge({
          id: `TEL_EVENT:${meta.ri}->${meta.d}`,
          from: meta.ri,
          to: meta.d,
          kind: "MEMBER",
          label: "event",
        });
      }

      // Prior link
      if (meta.p) {
        addEdge({
          id: `TEL_PRIOR:${meta.p}->${meta.d}`,
          from: meta.p,
          to: meta.d,
          kind: "PRIOR",
          label: "prior",
        });
      }

      // ACDC reference
      if (meta.acdcSaid) {
        addNode({
          id: meta.acdcSaid,
          kind: "ACDC",
          label: meta.acdcSaid.substring(0, 12) + "...",
        });
        addEdge({
          id: `ACDC_REF:${meta.d}->${meta.acdcSaid}`,
          from: meta.d,
          to: meta.acdcSaid,
          kind: "REFERENCES",
          label: meta.t === "iss" ? "issues" : "revokes",
        });
      }

      // Holder reference
      if (meta.holderAid) {
        addNode({
          id: meta.holderAid,
          kind: "AID",
          label: meta.holderAid.substring(0, 12) + "...",
        });
        addEdge({
          id: `HOLDER:${meta.acdcSaid || meta.d}->${meta.holderAid}`,
          from: meta.acdcSaid || meta.d,
          to: meta.holderAid,
          kind: "HELD_BY",
          label: "held by",
        });
      }
    }
  }

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
  };
}
