/**
 * TextGraph - Converts KERI event chains to filesystem-like tree visualization
 *
 * This class takes KEL and TEL events and generates ASCII tree diagrams
 * that show the hierarchical structure of KERI data. It traces back from
 * TEL HEAD events to determine proper hierarchical relationships, showing
 * TEL graphs as subgraphs of the KEL events that anchored them.
 */

import type { KerStore } from '../../storage/types';
import type { KeritsDSL } from '../dsl/types';

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

interface RegistryInfo {
  registryId: string;
  alias: string;
  issuerAid: string;
  parentRegistryId?: string;
  anchoredInKelEvent?: string; // SAID of KEL IXN event that anchored this registry
  depth: number;
}

/**
 * TextGraph - Generate filesystem-like tree visualizations of KERI data
 */
export class TextGraph {
  constructor(private store: KerStore, private dsl?: KeritsDSL) {}

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
      await this.renderKelTree(lines, alias, aid, '', opts);

      if (!isLast) {
        lines.push('');
      }
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

    await this.renderKelTree(lines, accountAlias, aid, '', opts);
    return lines.join('\n');
  }

  /**
   * Build registry hierarchy by tracing TEL events
   */
  private async buildRegistryHierarchy(): Promise<Map<string, RegistryInfo>> {
    const registryMap = new Map<string, RegistryInfo>();
    const telAliases = await this.store.listAliases('tel');

    // First pass: collect all registries
    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;

      const telEvents = await this.store.listTel(registryId);
      const vcpEvent = telEvents.find(e => e.meta.t === 'vcp');

      if (!vcpEvent) continue;

      registryMap.set(registryId, {
        registryId,
        alias,
        issuerAid: vcpEvent.meta.i || '',
        depth: 0,
      });
    }

    // Second pass: find parent relationships from ISS events in other TELs
    for (const [registryId, info] of registryMap.entries()) {
      // Check if this registry is anchored in another registry's TEL (nested)
      for (const [parentRegistryId, parentInfo] of registryMap.entries()) {
        if (parentRegistryId === registryId) continue;

        const parentTelEvents = await this.store.listTel(parentRegistryId);
        const issEvent = parentTelEvents.find(
          e => e.meta.t === 'iss' && e.meta.acdcSaid === registryId
        );

        if (issEvent) {
          info.parentRegistryId = parentRegistryId;
          info.depth = parentInfo.depth + 1;
          break;
        }
      }

      // If no parent TEL found, check if anchored in a KEL
      if (!info.parentRegistryId) {
        const kelEvents = await this.store.listKel(info.issuerAid);
        for (const kelEvent of kelEvents) {
          if (kelEvent.meta.t === 'ixn') {
            // Check if this IXN anchors our registry
            // We determine this by checking if the IXN's sequence number
            // is near the registry's creation time
            info.anchoredInKelEvent = kelEvent.meta.d;
            break; // Use first IXN as anchor point
          }
        }
      }
    }

    return registryMap;
  }

  /**
   * Render KEL tree with nested TEL registries
   */
  private async renderKelTree(
    lines: string[],
    alias: string,
    aid: string,
    prefix: string,
    opts: TextGraphOptions
  ): Promise<void> {
    const aidDisplay = this.truncateSaid(aid, opts.fullSaids);
    const displayAlias = this.dsl ? await this.resolveAlias('kel', aid) || alias : alias;

    lines.push(`${prefix}🔑 KEL (${displayAlias})`);
    lines.push(`${prefix}└─ ${aidDisplay}`);

    // Get KEL events
    const kelEvents = await this.store.listKel(aid);

    // Build registry hierarchy
    const registryHierarchy = await this.buildRegistryHierarchy();

    // Find root-level registries for this account
    const rootRegistries: RegistryInfo[] = [];
    for (const info of registryHierarchy.values()) {
      if (info.issuerAid === aid && !info.parentRegistryId) {
        rootRegistries.push(info);
      }
    }

    // Render KEL events
    for (let i = 0; i < kelEvents.length; i++) {
      const storedEvent = kelEvents[i];
      const isLastEvent = i === kelEvents.length - 1 && rootRegistries.length === 0;
      const eventPrefix = isLastEvent ? '   └─' : '   ├─';
      const eventDisplay = `[${storedEvent.meta.s}] ${storedEvent.meta.t.toUpperCase()}: ${this.truncateSaid(storedEvent.meta.d, opts.fullSaids)}`;
      lines.push(`${prefix}${eventPrefix} ${eventDisplay}`);

      // Check if this event anchors any registries
      const anchoredRegistries = rootRegistries.filter(
        r => r.anchoredInKelEvent === storedEvent.meta.d
      );

      if (anchoredRegistries.length > 0) {
        for (const registry of anchoredRegistries) {
          const childPrefix = isLastEvent ? '      ' : '   │  ';
          await this.renderTelTree(
            lines,
            registry,
            registryHierarchy,
            true,
            `${prefix}${childPrefix}`,
            opts
          );
        }
      }
    }

    // Render any remaining root registries that weren't anchored
    const unanchoredRegistries = rootRegistries.filter(r => !r.anchoredInKelEvent);
    for (let i = 0; i < unanchoredRegistries.length; i++) {
      const registry = unanchoredRegistries[i];
      const isLast = i === unanchoredRegistries.length - 1;
      const childPrefix = isLast ? '   └─ ' : '   ├─ ';
      await this.renderTelTree(
        lines,
        registry,
        registryHierarchy,
        isLast,
        `${prefix}${childPrefix}`,
        opts
      );
    }
  }

  /**
   * Render TEL tree with nested registries
   */
  private async renderTelTree(
    lines: string[],
    registry: RegistryInfo,
    registryHierarchy: Map<string, RegistryInfo>,
    isLast: boolean,
    prefix: string,
    opts: TextGraphOptions
  ): Promise<void> {
    const regDisplay = this.truncateSaid(registry.registryId, opts.fullSaids);
    const displayAlias = this.dsl ?
      await this.resolveAlias('tel', registry.registryId) || registry.alias :
      registry.alias;

    const nestedLabel = registry.parentRegistryId ? ' [nested]' : '';

    lines.push(`${prefix}📋 TEL (${displayAlias})${nestedLabel}`);
    lines.push(`${prefix}└─ ${regDisplay}`);

    // Get TEL events
    const telEvents = await this.store.listTel(registry.registryId);

    // Find child registries
    const childRegistries: RegistryInfo[] = [];
    for (const info of registryHierarchy.values()) {
      if (info.parentRegistryId === registry.registryId) {
        childRegistries.push(info);
      }
    }

    const basePrefix = prefix.replace(/[├└]─ $/, '');
    const continuePrefix = isLast ? '   ' : '│  ';

    for (let i = 0; i < telEvents.length; i++) {
      const storedEvent = telEvents[i];
      const isLastEvent = i === telEvents.length - 1 && childRegistries.length === 0;
      const eventPrefix = isLastEvent ? '   └─' : '   ├─';

      let eventLabel = `[${storedEvent.meta.s}] ${storedEvent.meta.t.toUpperCase()}`;
      if (storedEvent.meta.acdcSaid) {
        const shortSaid = this.truncateSaid(storedEvent.meta.acdcSaid, false, 16);
        eventLabel += ` (ACDC: ${shortSaid}...)`;
      } else {
        eventLabel += `: ${this.truncateSaid(storedEvent.meta.d, opts.fullSaids)}`;
      }

      lines.push(`${basePrefix}${continuePrefix}${eventPrefix} ${eventLabel}`);

      // Check if this ISS event created a nested registry
      if (storedEvent.meta.t === 'iss' && storedEvent.meta.acdcSaid) {
        const nestedRegistry = childRegistries.find(
          r => r.registryId === storedEvent.meta.acdcSaid
        );

        if (nestedRegistry) {
          const nestedPrefix = isLastEvent ? '         ' : '      │  ';
          await this.renderTelTree(
            lines,
            nestedRegistry,
            registryHierarchy,
            true,
            `${basePrefix}${continuePrefix}${nestedPrefix}`,
            opts
          );
        }
      }
    }

    // Render any remaining child registries not found in ISS events
    const unrenderedChildren = childRegistries.filter(child => {
      return !telEvents.some(e => e.meta.t === 'iss' && e.meta.acdcSaid === child.registryId);
    });

    for (let i = 0; i < unrenderedChildren.length; i++) {
      const child = unrenderedChildren[i];
      const isLastChild = i === unrenderedChildren.length - 1;
      const childPrefix = isLastChild ? '   └─ ' : '   ├─ ';
      await this.renderTelTree(
        lines,
        child,
        registryHierarchy,
        isLastChild,
        `${basePrefix}${continuePrefix}${childPrefix}`,
        opts
      );
    }
  }

  /**
   * Resolve alias from store or DSL
   */
  private async resolveAlias(scope: 'kel' | 'tel' | 'schema', said: string): Promise<string | null> {
    if (!this.dsl) return null;

    try {
      const aliases = await this.store.listAliases(scope);
      for (const alias of aliases) {
        const resolvedSaid = await this.store.getAliasSaid(scope, alias);
        if (resolvedSaid === said) {
          return alias;
        }
      }
    } catch (e) {
      // Ignore errors
    }

    return null;
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
      const displayAlias = this.dsl ? await this.resolveAlias('kel', aid) || alias : alias;
      lines.push(`  • ${displayAlias} KEL events: ${kelEvents.length}`);
    }

    // Count TEL events per registry
    const telAliases = await this.store.listAliases('tel');
    for (const alias of telAliases) {
      const registryId = await this.store.getAliasSaid('tel', alias);
      if (!registryId) continue;

      const telEvents = await this.store.listTel(registryId);
      const displayAlias = this.dsl ? await this.resolveAlias('tel', registryId) || alias : alias;
      lines.push(`  • ${displayAlias} TEL events: ${telEvents.length}`);
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
export function createTextGraph(store: KerStore, dsl?: KeritsDSL): TextGraph {
  return new TextGraph(store, dsl);
}
