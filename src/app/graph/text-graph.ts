/**
 * TextGraph - Converts KERI event chains to filesystem-like tree visualization
 *
 * This class takes KEL and TEL events and generates ASCII tree diagrams
 * that show the hierarchical structure of KERI data, including nested
 * registries and credentials.
 */

import type { KerStore } from '../../storage/types';

export interface TextGraphOptions {
  /** Include full SAIDs (default: truncate to 24 chars) */
  fullSaids?: boolean;
  /** Show event details in tree */
  showEventDetails?: boolean;
  /** Filter to specific AIDs */
  filterAids?: string[];
  /** Show storage location */
  storageLocation?: string;
}

interface TreeNode {
  type: 'kel' | 'tel' | 'event' | 'acdc';
  label: string;
  id: string;
  children: TreeNode[];
  metadata?: any;
}

/**
 * TextGraph - Generate filesystem-like tree visualizations of KERI data
 */
export class TextGraph {
  constructor(private store: KerStore) {}

  /**
   * Generate a filesystem-like tree view of all KERI data
   */
  async toTree(opts: TextGraphOptions = {}): Promise<string> {
    const lines: string[] = [];

    // Get all KEL accounts
    const kelAliases = await this.store.listAliases('kel');

    for (let i = 0; i < kelAliases.length; i++) {
      const alias = kelAliases[i];
      const aid = await this.store.getAliasSaid('kel', alias);
      if (!aid) continue;

      // Filter if specific AIDs requested
      if (opts.filterAids && !opts.filterAids.includes(aid)) continue;

      const isLast = i === kelAliases.length - 1;
      await this.renderKelTree(lines, alias, aid, isLast, '', opts);
    }

    return lines.join('\n');
  }

  /**
   * Generate tree for a specific account/AID
   */
  async toAccountTree(accountAlias: string, opts: TextGraphOptions = {}): Promise<string> {
    const lines: string[] = [];
    const aid = await this.store.getAliasSaid('kel', accountAlias);
    if (!aid) {
      throw new Error(`Account not found: ${accountAlias}`);
    }

    await this.renderKelTree(lines, accountAlias, aid, true, '', opts);
    return lines.join('\n');
  }

  private async renderKelTree(
    lines: string[],
    alias: string,
    aid: string,
    isLast: boolean,
    prefix: string,
    opts: TextGraphOptions
  ): Promise<void> {
    const aidDisplay = this.truncateSaid(aid, opts.fullSaids);

    lines.push(`${prefix}🔑 KEL (${alias})`);
    lines.push(`${prefix}└─ ${aidDisplay}`);

    // Get KEL events
    const kelEvents = await this.store.listKel(aid);

    for (let i = 0; i < kelEvents.length; i++) {
      const storedEvent = kelEvents[i];
      const isLastEvent = i === kelEvents.length - 1;
      const eventPrefix = isLastEvent ? '   └─' : '   ├─';
      const eventDisplay = `[${storedEvent.meta.s}] ${storedEvent.meta.t.toUpperCase()}: ${this.truncateSaid(storedEvent.meta.d, opts.fullSaids)}`;
      lines.push(`${prefix}${eventPrefix} ${eventDisplay}`);

      // Check if this IXN event anchors a registry
      if (storedEvent.meta.t === 'ixn') {
        const registries = await this.findAnchoredRegistries(storedEvent.meta, aid);
        for (const registry of registries) {
          const childPrefix = isLastEvent ? '      ' : '   │  ';
          await this.renderTelTree(lines, registry.alias, registry.registryId, true, `${prefix}${childPrefix}`, opts, aid);
        }
      }
    }
  }

  private async renderTelTree(
    lines: string[],
    alias: string,
    registryId: string,
    isLast: boolean,
    prefix: string,
    opts: TextGraphOptions,
    parentAid?: string
  ): Promise<void> {
    const regDisplay = this.truncateSaid(registryId, opts.fullSaids);

    // Check if this is a nested registry
    const registry = await this.getRegistryInfo(registryId);
    const nestedLabel = registry?.parentRegistryId ? ' [nested]' : '';

    lines.push(`${prefix}└─ 📋 TEL (${alias})${nestedLabel}`);
    lines.push(`${prefix}   └─ ${regDisplay}`);

    // Get TEL events
    const telEvents = await this.store.listTel(registryId);

    for (let i = 0; i < telEvents.length; i++) {
      const storedEvent = telEvents[i];
      const isLastEvent = i === telEvents.length - 1;
      const eventPrefix = isLastEvent ? '      └─' : '      ├─';

      let eventLabel = `[${storedEvent.meta.s}] ${storedEvent.meta.t.toUpperCase()}`;
      if (storedEvent.meta.acdcSaid) {
        eventLabel += ` (ACDC: ${this.truncateSaid(storedEvent.meta.acdcSaid, false, 16)}...)`;
      } else if (storedEvent.meta.t.toUpperCase() === 'VCP') {
        eventLabel += `: ${this.truncateSaid(storedEvent.meta.d, opts.fullSaids)}`;
      } else {
        eventLabel += `: ${this.truncateSaid(storedEvent.meta.d, opts.fullSaids)}`;
      }

      lines.push(`${prefix}${eventPrefix} ${eventLabel}`);

      // Check if this ISS event creates a nested registry
      if (storedEvent.meta.t === 'iss' && storedEvent.meta.acdcSaid) {
        const nestedRegistry = await this.checkNestedRegistry(storedEvent.meta.acdcSaid);
        if (nestedRegistry) {
          const childPrefix = isLastEvent ? '         ' : '      │  ';
          await this.renderTelTree(lines, nestedRegistry.alias, nestedRegistry.registryId, true, `${prefix}${childPrefix}`, opts);
        }
      }
    }
  }

  private async findAnchoredRegistries(ixnEvent: any, aid: string): Promise<Array<{ alias: string; registryId: string }>> {
    const registries: Array<{ alias: string; registryId: string }> = [];

    // Get all TEL aliases
    const telAliases = await this.store.listAliases('tel');

    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;

      const telEvents = await this.store.listTel(registryId);
      const vcpEvent = telEvents.find(e => e.meta.t === 'vcp');

      if (vcpEvent && vcpEvent.meta.i === aid) {
        // Check if this registry's VCP is anchored by this IXN
        // by checking sequence numbers and timestamps
        const registry = await this.getRegistryInfo(registryId);
        if (registry && !registry.parentRegistryId) {
          registries.push({ alias, registryId });
        }
      }
    }

    return registries;
  }

  private async checkNestedRegistry(acdcSaid: string): Promise<{ alias: string; registryId: string } | null> {
    // Check if this ACDC SAID is actually a registry ID
    const telAliases = await this.store.listAliases('tel');

    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (registryId === acdcSaid) {
        return { alias, registryId };
      }
    }

    return null;
  }

  private async getRegistryInfo(registryId: string): Promise<{ parentRegistryId?: string } | null> {
    try {
      // Try to get registry metadata
      const telEvents = await this.store.listTel(registryId);
      if (telEvents.length === 0) return null;

      // Check if the registry was issued in another registry's TEL
      const allTelAliases = await this.store.listAliases('tel');

      for (const alias of allTelAliases) {
        const parentRegistryId = await this.store.getAliasSaid('tel', alias);
        if (!parentRegistryId || parentRegistryId === registryId) continue;

        const parentTelEvents = await this.store.listTel(parentRegistryId);
        const issEvent = parentTelEvents.find(e => e.meta.t === 'iss' && e.meta.acdcSaid === registryId);

        if (issEvent) {
          return { parentRegistryId };
        }
      }

      return {};
    } catch (e) {
      return null;
    }
  }

  private truncateSaid(said: string, full?: boolean, length: number = 24): string {
    if (full || said.length <= length) return said;
    return said.substring(0, length) + '...';
  }

  /**
   * Generate a summary of the KERI data structure
   */
  async toSummary(opts: TextGraphOptions = {}): Promise<string> {
    const lines: string[] = [];

    lines.push('📊 Summary:');

    // Count KEL events per account
    const kelAliases = await this.store.listAliases('kel');
    for (const alias of kelAliases) {
      const aid = await this.store.getAliasSaid('kel', alias);
      if (!aid) continue;

      if (opts.filterAids && !opts.filterAids.includes(aid)) continue;

      const kelEvents = await this.store.listKel(aid);
      lines.push(`  • ${alias} KEL events: ${kelEvents.length}`);
    }

    // Count TEL events per registry
    const telAliases = await this.store.listAliases('tel');
    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;

      const telEvents = await this.store.listTel(registryId);
      lines.push(`  • ${alias} TEL events: ${telEvents.length}`);
    }

    // Calculate total
    let totalEvents = 0;
    for (const alias of kelAliases) {
      const aid = await this.store.getAliasSaid('kel', alias);
      if (!aid) continue;
      if (opts.filterAids && !opts.filterAids.includes(aid)) continue;
      const kelEvents = await this.store.listKel(aid);
      totalEvents += kelEvents.length;
    }
    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;
      const telEvents = await this.store.listTel(registryId);
      totalEvents += telEvents.length;
    }

    lines.push(`  • Total events: ${totalEvents}`);

    if (opts.storageLocation) {
      lines.push('');
      lines.push('📂 Storage location:');
      lines.push(`  • ${opts.storageLocation}`);
    }

    return lines.join('\n');
  }
}

/**
 * Create a TextGraph instance
 */
export function createTextGraph(store: KerStore): TextGraph {
  return new TextGraph(store);
}
