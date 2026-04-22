import type { ArchitectureReport } from './report.js';
import type { DerivedScenarioStatus, ScenarioDefinition } from './scenario-types.js';

export interface SourceLinkConfig {
  readonly baseUrl: string;
  readonly packagePrefix: string;
}

// NOTE: Emoji icons intentionally used per approved spec section 3.
// Globally discoverable in rendered MDX; reviewers have signed off on
// this choice. Do not replace with text markers without updating the spec.
const STATUS_ICON: Record<DerivedScenarioStatus, string> = {
  passed: '✅',
  failed: '❌',
  skipped: '⏭️',
  todo: '📝',
  'not-run': '⚪',
};

const GENERATED_FOOTER = `
_Generated from:_
- \`src/architecture/registry.ts\` (authored)
- scenario definitions indexed from \`src/**/*.test.ts\`
- merged scenario observations in \`.architecture-evidence/\`
`;

function renderSourceLink(file: string | undefined, line: number | undefined, config: SourceLinkConfig): string {
  if (!file) return '';
  // Defensive: if the path isn't under the configured prefix, render as plain text.
  // Keeps the MDX valid even if a future package adds scenarios under a
  // different prefix before the render config is generalised.
  if (!file.startsWith(config.packagePrefix)) {
    return `<sub>${file}:${line ?? '?'}</sub>`;
  }
  const display = file.slice(config.packagePrefix.length);
  if (typeof line !== 'number') {
    return `<sub>[${display}](${config.baseUrl}/${display})</sub>`;
  }
  return `<sub>[${display}:${line}](${config.baseUrl}/${display}#L${line})</sub>`;
}

/**
 * Pre-compute lookup maps used by domain/capability rendering.
 */
function buildLookups(report: ArchitectureReport) {
  const { defs, scenarioStatus } = report;

  const defsByFunctionality = new Map<string, ScenarioDefinition[]>();
  for (const d of defs) {
    const arr = defsByFunctionality.get(d.functionality.id) ?? [];
    arr.push(d);
    defsByFunctionality.set(d.functionality.id, arr);
  }

  const defsByInvariant = new Map<string, ScenarioDefinition[]>();
  for (const d of defs) {
    if (!d.covers || d.covers.length === 0) continue;
    const capId = d.functionality.capability.id;
    for (const invId of d.covers) {
      const key = `${capId}/${invId}`;
      const arr = defsByInvariant.get(key) ?? [];
      arr.push(d);
      defsByInvariant.set(key, arr);
    }
  }

  return { defsByFunctionality, defsByInvariant, scenarioStatus };
}

/**
 * Render capabilities for a single domain.
 *
 * Capabilities are rendered as `##` headings, functionalities as accordions.
 */
export function renderDomainMdx(report: ArchitectureReport, domainId: string, config: SourceLinkConfig): string {
  const { registry, byCapability, byFunctionality } = report;
  const { defsByFunctionality, defsByInvariant, scenarioStatus } = buildLookups(report);
  const lines: string[] = [];

  for (const [capId, cap] of Object.entries(registry.capabilities)) {
    if (cap.domain.id !== domainId) continue;
    const summary = byCapability[capId]!;
    lines.push(`## ${capId} — ${cap.purpose}`, '');
    lines.push(`**Layers:** ${cap.layers.map((l) => l.id).join(', ')}`);
    lines.push(`**Status:** ${summary.status} (${summary.passed} passed, ${summary.failed} failed)`);
    if (cap.invariants && cap.invariants.length > 0) {
      lines.push('', '**Invariants**', '');
      for (const inv of cap.invariants) {
        if (typeof inv === 'string') {
          lines.push(`- ${inv}`);
        } else {
          lines.push(`- \`${inv.id}\` — ${inv.statement}`);
          const covering = defsByInvariant.get(`${capId}/${inv.id}`) ?? [];
          for (const d of covering) {
            const fullId = `${capId}/${d.functionality.id}/${d.id}`;
            const status = scenarioStatus[fullId] ?? 'not-run';
            lines.push(`  - ${STATUS_ICON[status]} \`${d.id}\``);
          }
        }
      }
    }
    lines.push('', '**Functionality**', '');
    lines.push('| ID | Status | Passed | Failed | Todo | Skipped | Not-run |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const [fid, fn] of Object.entries(registry.functionality)) {
      if (fn.capability.id !== capId) continue;
      const fs = byFunctionality[fid]!;
      lines.push(`| ${fid} | ${fs.status} | ${fs.passed} | ${fs.failed} | ${fs.todo} | ${fs.skipped} | ${fs.notRun} |`);
    }
    lines.push('');

    lines.push('<Accordions>');
    for (const [fid, fn] of Object.entries(registry.functionality)) {
      if (fn.capability.id !== capId) continue;
      const fs = byFunctionality[fid]!;
      lines.push(`<Accordion title="${fid} — ${fn.description} (${fs.status})">`);
      lines.push('');
      const scenariosForFn = defsByFunctionality.get(fid) ?? [];
      if (scenariosForFn.length === 0) {
        lines.push('_No scenarios defined._', '');
      } else {
        for (const d of scenariosForFn) {
          const fullId = `${cap.id}/${fid}/${d.id}`;
          const status = scenarioStatus[fullId] ?? 'not-run';
          const loc = renderSourceLink(d.sourceFile, d.sourceLine, config);
          lines.push(`- ${STATUS_ICON[status]} \`${d.id}\` — ${d.description}`);
          if (d.covers && d.covers.length > 0) {
            const refs = d.covers.map((id) => `\`${id}\``).join(', ');
            lines.push(`  _verifies:_ ${refs}`);
          }
          if (d.annotations) {
            for (const note of d.annotations) {
              lines.push(`  _note:_ ${note}`);
            }
          }
          if (loc) lines.push(`  ${loc}`);
        }
        lines.push('');
      }
      lines.push('</Accordion>');
    }
    lines.push('</Accordions>');
    lines.push('');
  }

  lines.push(GENERATED_FOOTER);
  return lines.join('\n');
}

/**
 * Render all capabilities across all domains into a single MDX string.
 *
 * Domains are rendered as `##` headings, capabilities as `###`.
 */
export function renderCapabilitiesMdx(report: ArchitectureReport, config: SourceLinkConfig): string {
  const { registry } = report;
  const lines: string[] = [];

  for (const [domId, domain] of Object.entries(registry.domains)) {
    lines.push(`## ${domId} — ${domain.description}`, '');
    // Render domain content with headings shifted down one level (## → ###)
    const domainContent = renderDomainMdx(report, domId, config);
    const shifted = domainContent.replace(/^## /gm, '### ');
    lines.push(shifted);
  }

  return lines.join('\n');
}

export function renderStatusMdx(report: ArchitectureReport): string {
  const { registry, byDomain, byCapability } = report;
  const lines: string[] = [];

  lines.push('## Rollup by layer', '');
  lines.push('| Layer | Capabilities | VERIFIED | PARTIAL | PLANNED | FAILING | NOT-STARTED |');
  lines.push('|---|---|---|---|---|---|---|');
  for (const [lid] of Object.entries(registry.layers)) {
    const capsInLayer = Object.values(registry.capabilities).filter((c) => c.layers.some((l) => l.id === lid));
    const statusCounts = { VERIFIED: 0, PARTIAL: 0, PLANNED: 0, FAILING: 0, 'NOT-STARTED': 0 };
    for (const cap of capsInLayer) {
      const s = byCapability[cap.id]!.status;
      statusCounts[s]++;
    }
    lines.push(
      `| ${lid} | ${capsInLayer.length} | ${statusCounts.VERIFIED} | ${statusCounts.PARTIAL} | ${statusCounts.PLANNED} | ${statusCounts.FAILING} | ${statusCounts['NOT-STARTED']} |`,
    );
  }
  lines.push('');

  lines.push('## Rollup by domain', '');
  lines.push('| Domain | Capabilities | Status |');
  lines.push('|---|---|---|');
  for (const [did] of Object.entries(registry.domains)) {
    const capsInDom = Object.values(registry.capabilities).filter((c) => c.domain.id === did);
    lines.push(`| ${did} | ${capsInDom.length} | ${byDomain[did]!.status} |`);
  }
  lines.push('');

  const attention = {
    FAILING: [] as string[],
    'NOT-STARTED': [] as string[],
    PLANNED: [] as string[],
  };
  for (const [cid, summary] of Object.entries(byCapability)) {
    if (summary.status === 'FAILING') attention.FAILING.push(cid);
    if (summary.status === 'NOT-STARTED') attention['NOT-STARTED'].push(cid);
    if (summary.status === 'PLANNED') attention.PLANNED.push(cid);
  }

  lines.push('## Capabilities needing attention', '');
  for (const bucket of ['FAILING', 'NOT-STARTED', 'PLANNED'] as const) {
    const items = attention[bucket];
    lines.push(`- **${bucket}** — ${items.length === 0 ? '_none_' : items.map((c) => `\`${c}\``).join(', ')}`);
  }
  lines.push('');
  lines.push(GENERATED_FOOTER);
  return lines.join('\n');
}
