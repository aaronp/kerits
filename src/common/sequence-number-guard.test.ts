/**
 * Guard: the SequenceNumber namespace (common/types.ts) is the only reader and writer of a KERI sequence number
 * `s`. No source file in packages/{name}/src may parse one itself (parseInt / parseFloat / Number / BigInt on
 * `.s`, `["s"]`, `sn`, `snh` or `sequence`, also with the argument on the next line, or unary `+` on `.s`) or
 * write one as decimal (`s:` / `sequence:` set from String(…), a template, .toString(…) or `'' +`
 * concatenation): a decimal "10" is keripy's 16.
 */
import { describe, expect, test } from 'bun:test';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { SequenceNumber } from './types.js';

const ROOT = resolve(import.meta.dir, '../../../..');
const NAMESPACE_FILE = 'packages/core/src/common/types.ts';
/** The scan covers the monorepo's packages: the standalone core copy (sync-core) has none, and monorepo CI runs it. */
const IN_MONOREPO = existsSync(join(ROOT, NAMESPACE_FILE));
/** parseInt( / parseFloat( / Number( / BigInt( (also as Number.*) and its first argument. */
const PARSE_CALL = /(?<![\w.])(?:Number\.parseInt|Number\.parseFloat|parseInt|parseFloat|Number|BigInt)\(([^,)]*(?:\)[^,)]*)?)/g;
/** A parse call whose argument starts on the next line. */
const PARSE_CALL_OPEN = /(?<![\w.])(?:Number\.parseInt|Number\.parseFloat|parseInt|parseFloat|Number|BigInt)\(\s*$/;
/**
 * A sequence-number field: the property `.s`, a bare `s` argument, an `sn` / `snh` / `sequence` identifier or
 * property, or an `eventSn(` accessor.
 */
const FIELD = /(?:\??\.s\b(?!\s*\()|\[\s*['"]s['"]\s*\]|^\s*s\s*$|(?<![\w'"-])(?:sn|snh|sequence)\b(?!['"])|\beventSn\()/;
/** Unary `+` coercion of an `.s` / `["s"]` field. */
const UNARY_PLUS = /(?:^|[(=,:!?&|\s])\+(?!\+)\s*[\w$]+(?:\??\.[\w$]+|!)*(?:\??\.s\b|\[\s*['"]s['"]\s*\])/;
/** `s:` / `sequence:` written from String(…), a template literal or .toString(…). */
const DECIMAL_WRITE =
  /(?:^|[{,(\s])(?:s|sequence):\s*(?:String\(|`|[\w.?!]+\.toString\(|(?:''|"")\s*\+|[\w.?!()]+\s*\+\s*(?:''|""))/;

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

/** file:line of every ad-hoc sequence-number parse or decimal write. */
function adHocSequenceNumbers(text: string, file: string): string[] {
  const lines = text.split('\n');
  return lines.flatMap((line, i) => {
    const c = code(line);
    const split = PARSE_CALL_OPEN.test(c) && FIELD.test((code(lines[i + 1] ?? '').split(/[,)]/)[0] ?? '').trim());
    const hit =
      [...c.matchAll(PARSE_CALL)].some((m) => FIELD.test(m[1]!)) || split || UNARY_PLUS.test(c) || DECIMAL_WRITE.test(c);
    return hit ? [`${file}:${i + 1}: ${line.trim()}`] : [];
  });
}

describe('SequenceNumber guard', () => {
  test('the pattern catches the forms it forbids, and nothing else', () => {
    // setup: lines that parse or write a sequence number ad hoc, and lines that don't
    const forbidden = [
      'const targetSn = parseInt(sealSource.s, 10);', // delegation-validation (decimal: "10" read as 10)
      'fallbackSn = parseInt(String(event.event.s), 10);', // append-event-logic
      'const sn = Number.parseInt(String(head.event.s), 16);', // challenge (hex, but ad hoc)
      "localKelHeadSn = ksn === undefined ? 'empty' : Number(ksn.s);",
      'sn: Number(deltaEvents[i]!.event.s),',
      'const n = parseInt(sn, 16);',
      's: String(sn),', // attachments (decimal write)
      'const sealSource = { s: String(stored.sn), d: stored.said };',
      'sequence: String(input.head.sn + 1),', // kel-data
      's: keyState.seqNo.toString(16),',
      'anchors: [{ i: aid, s: `${sn}`, d }],',
      'const targetSn = parseInt(s, 10);', // anchor-targets
      'return parseInt(KELEvents.eventSn(event.finalized.event), 10);', // append-event-types
      'return Number.parseInt(s, 10);', // the deleted parseKeriSn
      'const n = +event.s;',
      'if (sn > +ksn!.s) {',
      'const n = BigInt(ksn.s);',
      'const n = parseFloat(e.event.s);',
      "const n = Number(event['s']);",
      'const n = Number.parseInt(\n  ksn.s,\n  16,\n);', // a call split across lines
      "s: '' + sn,",
      "anchors: [{ i, s: sn + '', d }],",
    ];
    const allowed = [
      'const sn = SequenceNumber.of(event.s);',
      's: SequenceNumber.encode(sn),',
      'const n = Number(count);',
      'const sig = parseInt(att.sig, 10);',
      "const label = Number('sn');",
      "s: '0',",
      'sequence: SequenceNumber.encode(head.sn + 1),',
      'const parsed = SequenceNumber.parse(stored.s);',
      'this.s(foo)',
      'const total = a + b;',
      "const label = 'kel ' + aid;",
      'const n = BigInt(current.seqNo);',
      'const x = Number(\n  count,\n);',
    ];

    // call our method under test
    const hits = adHocSequenceNumbers([...forbidden, ...allowed].join('\n'), 'f.ts');

    // only the forbidden cases are reported, each at its first line, with file:line
    const starts = forbidden.reduce<number[]>((acc, c, i) => [...acc, i === 0 ? 1 : acc[i - 1]! + forbidden[i - 1]!.split('\n').length], []);
    expect(hits).toEqual(forbidden.map((c, i) => `f.ts:${starts[i]}: ${c.split('\n')[0]!.trim()}`));
  });

  test.skipIf(!IN_MONOREPO)('no source file outside the SequenceNumber namespace parses or writes s itself', () => {
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
      .flatMap((f) => adHocSequenceNumbers(readFileSync(join(ROOT, f), 'utf8'), f));

    // none: use SequenceNumber.parse / .of / .encode
    expect(hits).toEqual([]);
  });
});

describe('SequenceNumber', () => {
  test('parse reads keripy hex; encode writes numh', () => {
    // call our method under test: the decimal/hex split, case, leading zeros, and the forms kerits refuses
    const parsed = ['0', '9', 'a', 'f', '10', '11', 'FF', '01', '', '0x1', ' 1', '1_0', '-1', 'g'].map((s) =>
      SequenceNumber.parse(s),
    );
    const encoded = [0, 9, 10, 15, 16, 17, 255].map(SequenceNumber.encode);

    // assertions: hex values; malformed for anything but hex digits (keripy int(s, 16) takes some: spec §4f)
    const malformed = (s: string) => ({
      ok: false,
      error: { kind: 'malformed', message: `sequence number ${JSON.stringify(s)} is not a hex string` },
    });
    expect(parsed).toEqual([
      { ok: true, value: 0 },
      { ok: true, value: 9 },
      { ok: true, value: 10 },
      { ok: true, value: 15 },
      { ok: true, value: 16 },
      { ok: true, value: 17 },
      { ok: true, value: 255 },
      { ok: true, value: 1 },
      malformed(''),
      malformed('0x1'),
      malformed(' 1'),
      malformed('1_0'),
      malformed('-1'),
      malformed('g'),
    ]);
    expect(encoded).toEqual(['0', '9', 'a', 'f', '10', '11', 'ff']);
    expect(() => SequenceNumber.encode(-1)).toThrow('SequenceNumber.encode: -1 is not a non-negative integer');
    expect(() => SequenceNumber.of('0x1')).toThrow('SequenceNumber.of: sequence number "0x1" is not a hex string');
  });
});
