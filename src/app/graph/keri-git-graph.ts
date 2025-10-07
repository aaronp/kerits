/**
 * KeriGitGraph - Converts KERI event chains to Mermaid gitGraph format
 *
 * This class takes KEL and TEL events and generates Mermaid gitGraph diagrams
 * that visualize the event chains as git-style commit graphs.
 */

import type { KerStore } from '../../storage/types';

export interface GitCommit {
  id: string;
  type: 'NORMAL' | 'REVERSE' | 'HIGHLIGHT';
  tag?: string;
  branch?: string;
  message: string;
}

export interface GitBranch {
  name: string;
  commits: GitCommit[];
}

export interface KeriGitGraphOptions {
  /** Include TEL events in the graph */
  includeTel?: boolean;
  /** Include credential (ACDC) events */
  includeCredentials?: boolean;
  /** Filter to specific AID */
  filterAid?: string;
  /** Filter to specific registry ID */
  filterRegistryId?: string;
}

/**
 * KeriGitGraph - Convert KERI events to Mermaid gitGraph format
 */
export class KeriGitGraph {
  constructor(private store: KerStore) {}

  /**
   * Generate Mermaid gitGraph from KERI events
   */
  async toMermaid(opts: KeriGitGraphOptions = {}): Promise<string> {
    const branches: GitBranch[] = [];

    // Get KEL events
    if (!opts.filterRegistryId) {
      await this.addKelBranches(branches, opts);
    }

    // Get TEL events if requested
    if (opts.includeTel) {
      await this.addTelBranches(branches, opts);
    }

    // Generate Mermaid gitGraph syntax
    return this.generateMermaidGraph(branches);
  }

  private async addKelBranches(branches: GitBranch[], opts: KeriGitGraphOptions): Promise<void> {
    // Get all KEL aliases
    const allAliases = await this.store.listAliases('kel');

    for (const alias of allAliases) {
      const aid = await this.store.getAliasSaid('kel', alias);
      if (!aid) continue;

      // Filter if specific AID requested
      if (opts.filterAid && opts.filterAid !== aid) continue;

      const kelEvents = await this.store.listKel(aid);
      const commits: GitCommit[] = [];

      for (const event of kelEvents) {
        const commit: GitCommit = {
          id: event.said.substring(0, 8),
          type: 'NORMAL',
          message: this.formatKelMessage(event.meta.t, event.meta),
          branch: alias,
        };

        // Tag inception events
        if (event.meta.t === 'icp') {
          commit.tag = 'inception';
          commit.type = 'HIGHLIGHT';
        }

        // Highlight rotation events
        if (event.meta.t === 'rot') {
          commit.type = 'HIGHLIGHT';
          commit.tag = `rotation-${event.meta.s}`;
        }

        commits.push(commit);
      }

      if (commits.length > 0) {
        branches.push({ name: alias, commits });
      }
    }
  }

  private async addTelBranches(branches: GitBranch[], opts: KeriGitGraphOptions): Promise<void> {
    // Get all TEL aliases
    const allAliases = await this.store.listAliases('tel');

    for (const alias of allAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;

      // Filter if specific registry requested
      if (opts.filterRegistryId && opts.filterRegistryId !== registryId) continue;

      const telEvents = await this.store.listTel(registryId);
      const commits: GitCommit[] = [];

      for (const event of telEvents) {
        const commit: GitCommit = {
          id: event.said.substring(0, 8),
          type: 'NORMAL',
          message: this.formatTelMessage(event.meta.t, event.meta),
          branch: `tel/${alias}`,
        };

        // Tag registry inception
        if (event.meta.t === 'vcp') {
          commit.tag = 'registry';
          commit.type = 'HIGHLIGHT';
        }

        // Highlight credential issuance
        if (event.meta.t === 'iss') {
          commit.type = 'HIGHLIGHT';
        }

        // Mark revocations as reverse commits
        if (event.meta.t === 'rev') {
          commit.type = 'REVERSE';
        }

        commits.push(commit);
      }

      if (commits.length > 0) {
        branches.push({ name: `tel/${alias}`, commits });
      }
    }
  }

  private formatKelMessage(eventType: string, meta: any): string {
    switch (eventType) {
      case 'icp':
        return `Inception: ${meta.i?.substring(0, 12)}...`;
      case 'rot':
        return `Rotate keys (sn=${meta.s})`;
      case 'ixn':
        return `Interaction (sn=${meta.s})`;
      default:
        return `${eventType} event`;
    }
  }

  private formatTelMessage(eventType: string, meta: any): string {
    switch (eventType) {
      case 'vcp':
        return `Registry inception: ${meta.ri?.substring(0, 12)}...`;
      case 'iss':
        const credId = meta.acdcSaid?.substring(0, 12) || 'credential';
        return `Issue: ${credId}...`;
      case 'rev':
        const revokedId = meta.acdcSaid?.substring(0, 12) || 'credential';
        return `Revoke: ${revokedId}...`;
      case 'ixn':
        return `TEL interaction (sn=${meta.s})`;
      default:
        return `${eventType} event`;
    }
  }

  private generateMermaidGraph(branches: GitBranch[]): string {
    const lines: string[] = ['gitGraph'];

    // Track which branches have been created
    const createdBranches = new Set<string>();

    for (const branch of branches) {
      // Create branch if it doesn't exist
      if (!createdBranches.has(branch.name)) {
        // Checkout or create branch
        if (createdBranches.size === 0) {
          lines.push(`  commit id: "init"`);
        } else {
          lines.push(`  branch ${this.sanitizeBranchName(branch.name)}`);
        }
        createdBranches.add(branch.name);
      }

      // Switch to this branch if not already there
      if (createdBranches.size > 1) {
        lines.push(`  checkout ${this.sanitizeBranchName(branch.name)}`);
      }

      // Add commits
      for (const commit of branch.commits) {
        const commitLine = this.formatMermaidCommit(commit);
        lines.push(`  ${commitLine}`);
      }
    }

    return lines.join('\n');
  }

  private formatMermaidCommit(commit: GitCommit): string {
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

  private sanitizeBranchName(name: string): string {
    // Replace special characters with underscores
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  private escapeMessage(message: string): string {
    // Escape double quotes in commit messages
    return message.replace(/"/g, '\\"');
  }
}

/**
 * Create a KeriGitGraph instance
 */
export function createKeriGitGraph(store: KerStore): KeriGitGraph {
  return new KeriGitGraph(store);
}
