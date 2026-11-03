/**
 * Guard: the Threshold namespace (common/types.ts) is the only reader of kt/nt/bt. No source file in
 * packages/{name}/src may parse a threshold field itself: parseInt/Number on it, .split(/.match( on it, or
 * arithmetic / unary-plus coercion of it (decimal parses are how "10" became 10 instead of keripy's 16, and
 * "t/n" splits how bare fractions survived).
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dir, '../../../..');
const NAMESPACE_FILE = 'packages/core/src/common/types.ts';
/** The scan covers the monorepo's packages: the standalone core copy (sync-core) has none, and monorepo CI runs it. */
const IN_MONOREPO = existsSync(join(ROOT, NAMESPACE_FILE));
const FIELDS = 'kt|nt|bt|sith|isith|nsith|threshold|signingThreshold|nextThreshold|witnessThreshold';
/** A threshold field as an identifier or property (not a string literal). */
const FIELD_REF = `(?<![\\w'"])(?:[\\w$]+\\??\\.)*(?:${FIELDS})\\b(?!['"])`;
/** parseInt( / Number( / Number.parseInt( whose first argument names a threshold field. */
const PARSE_CALL = /\b(?:Number\.parseInt|parseInt|Number)\(([^,)]*)/g;
const FIELD = new RegExp(`(?:^|[^\\w'"])(?:${FIELDS})\\b(?!['"])`);
/** <field>.split( / <field>.match( (optional chaining too). */
const STRING_PARSE = new RegExp(`${FIELD_REF}\\??\\.(?:split|match)\\(`);
/** Arithmetic on a field (biome spaces binary operators) or unary-plus coercion. */
const ARITHMETIC = new RegExp(
  `${FIELD_REF}\\s+[-*/%]\\s+[\\w(]|[\\w)\\]]\\s+[-*/%]\\s+${FIELD_REF}|(?:^|[(=,:\\s])\\+\\s*${FIELD_REF}`,
);
/** Cheap reject before the field regexes. Those backtrack, and most lines never name a threshold. */
const MENTIONS_FIELD = /kt|nt|bt|sith|threshold|Threshold/;

/** A line with its // comment and string-free block-comment lines removed. */
function code(line: string): string {
  return /^\s*(?:\*|\/\*)/.test(line) ? '' : line.replace(/\/\/.*$/, '');
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === '__tests__' || entry.name === 'fixtures' || entry.name === 'node_modules'
        ? []
        : sourceFiles(path);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
      return [path];
    } else {
      return [];
    }
  });
}

/** file:line of every ad-hoc threshold parse. */
function adHocThresholdParses(text: string, file: string): string[] {
  return text.split('\n').flatMap((line, i) => {
    const c = code(line);
    if (!MENTIONS_FIELD.test(c)) return [];
    const hit =
      [...c.matchAll(PARSE_CALL)].some((m) => FIELD.test(m[1]!)) || STRING_PARSE.test(c) || ARITHMETIC.test(c);
    return hit ? [`${file}:${i + 1}: ${line.trim()}`] : [];
  });
}

describe('Threshold guard', () => {
  test('the pattern catches the forms it forbids, and nothing else', () => {
    // setup: lines that parse a threshold field, and lines that don't
    const forbidden = [
      'const n = parseInt(kt, 10);',
      'const n = Number.parseInt(String(kt ?? ""), 10);',
      'const bt = Number(state.witnessThreshold);',
      'x = Number(ksn?.nt)',
      "const [done, total] = threshold.split('/').map(Number);", // the deleted KelAppendSignatureProgress (I1)
      "const parts = threshold.split('/');", // the deleted sdk parseThreshold
      'const numerator = threshold.match(/^(\\d+)\\/\\d+$/)?.[1];', // the deleted rescaleThreshold
      "const ws = input.ksn.kt?.split(',');",
      'const m = +kt;',
      'const half = signingThreshold / 2;',
      'const left = total - ksn.nt;',
    ];
    const allowed = [
      'const sn = parseInt(event.s, 16);',
      'const n = Number(count);',
      "const label = Number('kt');",
      "const parts = path.split('/');",
      'const kt = Threshold.parse(ksn.kt, ksn.k.length);',
      "if (threshold.kind === 'numeric') {",
      '// kt / nt carry forward',
      ' * the prior nt / kt rules',
      "const label = `kt ${kt} / nt ${nt}`;",
    ];

    // call our method under test
    const hits = adHocThresholdParses([...forbidden, ...allowed].join('\n'), 'f.ts');

    // only the forbidden lines are reported, with file:line
    expect(hits).toEqual(forbidden.map((line, i) => `f.ts:${i + 1}: ${line.trim()}`));
  });

  test.skipIf(!IN_MONOREPO)('no source file outside the Threshold namespace parses kt/nt/bt itself', () => {
    // setup: every non-test source file in packages/*/src
    const packages = readdirSync(join(ROOT, 'packages'), { withFileTypes: true }).filter((d) => d.isDirectory());
    const files = packages.flatMap((p) => {
      const src = join(ROOT, 'packages', p.name, 'src');
      return readdirSync(join(ROOT, 'packages', p.name)).includes('src') ? sourceFiles(src) : [];
    });

    // call our method under test
    const hits = files
      .map((f) => relative(ROOT, f))
      .filter((f) => f !== NAMESPACE_FILE)
      .flatMap((f) => adHocThresholdParses(readFileSync(join(ROOT, f), 'utf8'), f));

    // none: use Threshold.parse / Threshold.witness
    expect(hits).toEqual([]);
  });
});
