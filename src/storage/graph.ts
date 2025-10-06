/**
 * Graph builder DSL for visualizing KEL/TEL relationships
 */

import type { Kv, Graph, GraphNode, GraphEdge, EventMeta, StoredEvent } from './types';

// Utility functions
function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function decodeJson<T>(bytes: Uint8Array): T {
  return JSON.parse(utf8Decode(bytes)) as T;
}

const NS = {
  EVENT: "ev/",
  META: "meta/",
} as const;

function kEvent(said: string) { return `${NS.EVENT}${said}`; }
function kMeta(said: string) { return `${NS.META}${said}`; }

/**
 * Build a graph representation from stored events
 */
export async function buildGraphFromStore(
  kv: Kv,
  opts?: { limit?: number }
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

  // Gather all events (bounded)
  const allMeta = await kv.list(NS.META, { limit });

  for (const { key, value } of allMeta) {
    if (!value) continue;
    const meta = decodeJson<EventMeta>(value);
    const evRec = await kv.get(kEvent(meta.d));
    if (!evRec) continue;
    const event = decodeJson<StoredEvent>(evRec);

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
        meta: { t: meta.t, s: meta.s },
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
    }

    if (isVCP) {
      // Registry node is the VCP SAID itself
      addNode({
        id: meta.d,
        kind: "TEL_REGISTRY",
        label: `Registry ${meta.d.substring(0, 8)}`,
        meta: { t: meta.t },
      });

      // For VCP, the issuer is in meta.issuerAid (from 'ii' field)
      if (meta.issuerAid) {
        addNode({ id: meta.issuerAid, kind: "AID", label: meta.issuerAid.substring(0, 12) + "..." });
        addEdge({
          id: `ANCHOR:${meta.issuerAid}->${meta.d}`,
          from: meta.issuerAid,
          to: meta.d,
          kind: "ANCHOR",
          label: "anchors TEL",
        });
      }
    }

    if (isTEL) {
      addNode({
        id: meta.d,
        kind: "TEL_EVT",
        label: `${meta.t.toUpperCase()} #${meta.s}`,
        meta: { t: meta.t, s: meta.s, ri: meta.ri },
      });

      if (meta.ri) {
        addNode({
          id: meta.ri,
          kind: "TEL_REGISTRY",
          label: `Registry ${meta.ri.substring(0, 8)}`,
        });
        addEdge({
          id: `REF:${meta.ri}->${meta.d}`,
          from: meta.ri,
          to: meta.d,
          kind: "REFS",
          label: "event",
        });
      }

      if (meta.t === "iss" && meta.acdcSaid) {
        addNode({
          id: meta.acdcSaid,
          kind: "ACDC",
          label: `ACDC ${meta.acdcSaid.substring(0, 8)}`,
        });
        addEdge({
          id: `ISSUES:${meta.d}->${meta.acdcSaid}`,
          from: meta.d,
          to: meta.acdcSaid,
          kind: "ISSUES",
          label: "issues",
        });
      }

      if (meta.t === "rev" && meta.acdcSaid) {
        addNode({
          id: meta.acdcSaid,
          kind: "ACDC",
          label: `ACDC ${meta.acdcSaid.substring(0, 8)}`,
        });
        addEdge({
          id: `REVOKES:${meta.d}->${meta.acdcSaid}`,
          from: meta.d,
          to: meta.acdcSaid,
          kind: "REVOKES",
          label: "revokes",
        });
      }
    }

    // Add AID nodes for issuerAid/holderAid when present
    if (meta.issuerAid) {
      addNode({
        id: meta.issuerAid,
        kind: "AID",
        label: meta.issuerAid.substring(0, 12) + "...",
      });
    }
    if (meta.holderAid) {
      addNode({
        id: meta.holderAid,
        kind: "AID",
        label: meta.holderAid.substring(0, 12) + "...",
      });
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}
