/**
 * KeriGitGraph - Converts PathGraph data to Mermaid gitGraph format
 *
 * This class takes PathGraph data and generates Mermaid gitGraph diagrams
 * that visualize the event chains as git-style commit graphs.
 */

import type { PathGraph, GraphNodeKind, SAID } from '../../storage/types';

export interface GitCommit {
  id: string;
  type: 'NORMAL' | 'REVERSE' | 'HIGHLIGHT';
  tag?: string;
  message: string;
}

/**
 * KeriGitGraph - Convert PathGraph to Mermaid gitGraph format
 */
export class KeriGitGraph {
  /**
   * Generate Mermaid gitGraph from PathGraph data
   */
  static fromPathGraph(pathGraph: PathGraph): string {
    const lines: string[] = ['gitGraph'];

    if (pathGraph.paths.length === 0) {
      return lines.join('\n');
    }

    // Track commits we've already added to avoid duplicates
    const addedCommits = new Set<SAID>();

    // Sort paths by length (shortest first) to establish main branch first
    const sortedPaths = [...pathGraph.paths].sort((a, b) => a.length - b.length);

    // Process first path to establish main branch
    const firstPath = sortedPaths[0];

    // Walk from root to target (path is already in correct order: [root, ..., target])
    for (let i = 0; i < firstPath.length; i++) {
      const nodeId = firstPath[i];
      const node = pathGraph.data[nodeId];

      if (!node) continue;

      const commit = this.nodeToCommit(node, nodeId === pathGraph.targetNode);
      const commitLine = this.formatMermaidCommit(commit);
      lines.push(`  ${commitLine}`);
      addedCommits.add(nodeId);
    }

    // Process remaining paths
    for (let pathIdx = 1; pathIdx < sortedPaths.length; pathIdx++) {
      const path = sortedPaths[pathIdx];

      // Find where this path diverges from already-added commits
      let lastCommonIndex = -1;
      for (let i = 0; i < path.length; i++) {
        if (addedCommits.has(path[i])) {
          lastCommonIndex = i;
        } else {
          break;
        }
      }

      // If this path has unique commits after the common point
      if (lastCommonIndex >= 0 && lastCommonIndex < path.length - 1) {
        // Create a branch for the divergent path
        const branchName = `path${pathIdx}`;

        // Checkout from the last common commit
        lines.push(`  checkout main`);
        lines.push(`  branch ${branchName}`);

        // Add the unique commits on this branch
        for (let i = lastCommonIndex + 1; i < path.length; i++) {
          const nodeId = path[i];
          if (addedCommits.has(nodeId)) continue;

          const node = pathGraph.data[nodeId];
          if (!node) continue;

          const commit = this.nodeToCommit(node, nodeId === pathGraph.targetNode);
          const commitLine = this.formatMermaidCommit(commit);
          lines.push(`  ${commitLine}`);
          addedCommits.add(nodeId);
        }

        // Merge back to main if we reached the target
        if (path[path.length - 1] === pathGraph.targetNode) {
          lines.push(`  checkout main`);
          lines.push(`  merge ${branchName}`);
        }
      }
    }

    return lines.join('\n');
  }

  private static nodeToCommit(node: any, isTarget: boolean): GitCommit {
    const commit: GitCommit = {
      id: node.id.substring(0, 8),
      type: 'NORMAL',
      message: this.formatNodeMessage(node),
    };

    // Highlight target node
    if (isTarget) {
      commit.type = 'HIGHLIGHT';
      commit.tag = 'target';
    }

    // Highlight special event types
    if (node.kind === 'KEL_EVT' && node.meta?.t === 'icp') {
      commit.type = 'HIGHLIGHT';
      commit.tag = 'inception';
    } else if (node.kind === 'KEL_EVT' && node.meta?.t === 'rot') {
      commit.type = 'HIGHLIGHT';
    } else if (node.kind === 'TEL_EVT' && node.meta?.t === 'vcp') {
      commit.type = 'HIGHLIGHT';
      commit.tag = 'registry';
    } else if (node.kind === 'TEL_EVT' && node.meta?.t === 'rev') {
      commit.type = 'REVERSE';
    }

    return commit;
  }

  private static formatNodeMessage(node: any): string {
    const label = node.label || node.kind;
    const meta = node.meta;

    switch (node.kind) {
      case 'AID':
        return `AID: ${label}`;
      case 'KEL_EVT':
        if (meta?.t === 'icp') return `Inception (${label})`;
        if (meta?.t === 'rot') return `Rotation sn=${meta.s}`;
        if (meta?.t === 'ixn') return `Interaction sn=${meta.s}`;
        return `KEL: ${meta?.t || label}`;
      case 'TEL_REGISTRY':
        return `Registry: ${label}`;
      case 'TEL_EVT':
        if (meta?.t === 'vcp') return `Registry inception`;
        if (meta?.t === 'iss') return `Issue credential`;
        if (meta?.t === 'rev') return `Revoke credential`;
        return `TEL: ${meta?.t || label}`;
      case 'ACDC':
        return `Credential: ${label}`;
      case 'SCHEMA':
        return `Schema: ${label}`;
      default:
        return label;
    }
  }

  private static formatMermaidCommit(commit: GitCommit): string {
    let line = 'commit';

    // Add commit ID
    line += ` id: "${commit.id}"`;

    // Add message
    if (commit.message) {
      line += ` msg: "${this.escapeMessage(commit.message)}"`;
    }

    // Add type
    if (commit.type !== 'NORMAL') {
      line += ` type: ${commit.type}`;
    }

    // Add tag
    if (commit.tag) {
      line += ` tag: "${commit.tag}"`;
    }

    return line;
  }

  private static escapeMessage(message: string): string {
    // Escape double quotes in commit messages
    return message.replace(/"/g, '\\"');
  }
}

/**
 * Generate Mermaid gitGraph from PathGraph data
 */
export function pathGraphToMermaid(pathGraph: PathGraph): string {
  return KeriGitGraph.fromPathGraph(pathGraph);
}
