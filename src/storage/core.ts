/**
 * KerStore - Core KERI storage API factory
 */

import type {
  Kv,
  KerStore,
  StoreOptions,
  PutResult,
  StoredWithMeta,
  StoredEvent,
  EventMeta,
  Attachment,
  SAID,
  AID,
  Graph,
} from './types';
import { DefaultJsonCesrParser, CesrHasher } from './parser';

// Utility functions
function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function encodeJson(obj: unknown): Uint8Array {
  return utf8Encode(JSON.stringify(obj));
}

function decodeJson<T>(bytes: Uint8Array): T {
  return JSON.parse(utf8Decode(bytes)) as T;
}

async function mustGet(kv: Kv, key: string): Promise<Uint8Array> {
  const v = await kv.get(key);
  if (!v) throw new Error(`Missing key: ${key}`);
  return v;
}

// Key Layout (namespaces)
const NS = {
  EVENT: "ev/",
  META: "meta/",
  ATTS: "att/",
  IDX_KEL: "idx/kel/",
  IDX_TEL: "idx/tel/",
  IDX_PREV: "idx/prev/",
  MAP_ALIAS_TO_ID: "map/alias2id/",
  MAP_ID_TO_ALIAS: "map/id2alias/",
} as const;

function kEvent(said: SAID) { return `${NS.EVENT}${said}`; }
function kMeta(said: SAID) { return `${NS.META}${said}`; }
function kAtt(said: SAID, n: number) { return `${NS.ATTS}${said}/${n}`; }
function kIdxKel(aid: AID, s: string) { return `${NS.IDX_KEL}${aid}/${s}`; }
function kIdxTel(ri: SAID, s: string) { return `${NS.IDX_TEL}${ri}/${s}`; }
function kIdxPrev(p: SAID) { return `${NS.IDX_PREV}${p}`; }
function kAlias2Id(scope: string, alias: string) { return `${NS.MAP_ALIAS_TO_ID}${scope}/${alias}`; }
function kId2Alias(scope: string, id: string) { return `${NS.MAP_ID_TO_ALIAS}${scope}/${id}`; }

/**
 * Create a new KerStore instance
 */
export function createKerStore(kv: Kv, opts?: StoreOptions): KerStore {
  const hasher = opts?.hasher ?? new CesrHasher();
  const parser = opts?.parser ?? new DefaultJsonCesrParser(hasher);
  const clock = opts?.clock ?? (() => new Date().toISOString());

  async function putEvent(rawCesr: Uint8Array): Promise<PutResult> {
    const parsed = parser.parse(rawCesr);
    const { meta } = parsed;

    if (!meta.t || !meta.d) throw new Error("Parsed meta missing t or d");
    const said = meta.d;

    const now = clock();
    const stored: StoredEvent = {
      said,
      raw: rawCesr,
      kind: parsed.stored.kind,
      size: rawCesr.byteLength,
      ingestedAt: now,
    };

    // Batch write: event, meta, attachments, indices
    const ops: Array<{ type: "put" | "del"; key: string; value?: Uint8Array }> = [];

    ops.push({ type: "put", key: kEvent(said), value: encodeJson(stored) });
    ops.push({ type: "put", key: kMeta(said), value: encodeJson(meta) });

    parsed.attachments.forEach((att, idx) => {
      ops.push({ type: "put", key: kAtt(said, idx), value: encodeJson(att) });
    });

    // Indices
    if (meta.i && meta.s) ops.push({ type: "put", key: kIdxKel(meta.i, meta.s), value: utf8Encode(said) });
    const isTelEvent = meta.t === 'vcp' || meta.t === 'iss' || meta.t === 'rev' || meta.t === 'upg' || meta.t === 'vtc' || meta.t === 'nrx';
    if (meta.ri && isTelEvent) ops.push({ type: "put", key: kIdxTel(meta.ri, said), value: utf8Encode(now) });
    if (meta.p) ops.push({ type: "put", key: kIdxPrev(meta.p), value: utf8Encode(said) });

    if (kv.batch) {
      await kv.batch(ops);
    } else {
      for (const op of ops) {
        if (op.type === "put" && op.value) {
          await kv.put(op.key, op.value);
        }
      }
    }

    return { said, meta };
  }

  async function getEvent(said: SAID): Promise<StoredWithMeta | null> {
    const ev = await kv.get(kEvent(said));
    if (!ev) return null;
    const event = decodeJson<StoredEvent>(ev);
    const metaBytes = await kv.get(kMeta(said));
    if (!metaBytes) return null;
    const meta = decodeJson<EventMeta>(metaBytes);
    const atts = await kv.list(`${NS.ATTS}${said}/`);
    const attachments = atts.map(r => decodeJson<Attachment>(r.value!));
    return { event, meta, attachments };
  }

  async function listKel(aid: AID, fromS = 0, toS = Number.MAX_SAFE_INTEGER): Promise<StoredWithMeta[]> {
    const pref = `${NS.IDX_KEL}${aid}/`;
    const idx = await kv.list(pref, { keysOnly: false });
    const pairs = idx
      .map(({ key, value }) => {
        const s = parseInt(key.slice(pref.length), 10);
        return Number.isFinite(s) ? { s, said: utf8Decode(value!) } : null;
      })
      .filter(Boolean) as Array<{ s: number; said: SAID }>;
    pairs.sort((a, b) => a.s - b.s);
    const filt = pairs.filter(p => p.s >= fromS && p.s <= toS);
    const results = await Promise.all(
      filt.map(p => getEvent(p.said).then(x => x!).catch(() => null))
    );
    return results.filter(Boolean) as StoredWithMeta[];
  }

  async function listTel(ri: SAID, fromS = 0, toS = Number.MAX_SAFE_INTEGER): Promise<StoredWithMeta[]> {
    const pref = `${NS.IDX_TEL}${ri}/`;
    const idx = await kv.list(pref, { keysOnly: false });
    const pairs = idx
      .map(({ key, value }) => {
        const said = key.slice(pref.length);
        const timestamp = utf8Decode(value!);
        return { said, timestamp };
      });
    pairs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const results = await Promise.all(
      pairs.map(p => getEvent(p.said).then(x => x!).catch(() => null))
    );
    return results.filter(Boolean) as StoredWithMeta[];
  }

  async function getByPrior(p: SAID): Promise<StoredWithMeta[]> {
    const idx = await kv.list(`${NS.IDX_PREV}${p}`, { keysOnly: false });
    const saids = idx.map(({ value }) => utf8Decode(value!));
    const results = await Promise.all(
      saids.map(s => getEvent(s).then(x => x!).catch(() => null))
    );
    return results.filter(Boolean) as StoredWithMeta[];
  }

  async function putAlias(scope: string, id: string, alias: string): Promise<void> {
    const ops = [
      { type: "put" as const, key: kAlias2Id(scope, alias), value: utf8Encode(id) },
      { type: "put" as const, key: kId2Alias(scope, id), value: utf8Encode(alias) },
    ];
    if (kv.batch) {
      return kv.batch(ops);
    }
    for (const op of ops) {
      await kv.put(op.key, op.value!);
    }
  }

  async function delAlias(scope: string, idOrAlias: string, byAlias = true): Promise<void> {
    if (byAlias) {
      const idBytes = await kv.get(kAlias2Id(scope, idOrAlias));
      if (!idBytes) return;
      const id = utf8Decode(idBytes);
      const ops = [
        { type: "del" as const, key: kAlias2Id(scope, idOrAlias) },
        { type: "del" as const, key: kId2Alias(scope, id) },
      ];
      if (kv.batch) return kv.batch(ops);
      for (const op of ops) await kv.del(op.key);
    } else {
      const aliasBytes = await kv.get(kId2Alias(scope, idOrAlias));
      if (!aliasBytes) return;
      const alias = utf8Decode(aliasBytes);
      const ops = [
        { type: "del" as const, key: kId2Alias(scope, idOrAlias) },
        { type: "del" as const, key: kAlias2Id(scope, alias) },
      ];
      if (kv.batch) return kv.batch(ops);
      for (const op of ops) await kv.del(op.key);
    }
  }

  async function aliasToId(scope: string, alias: string): Promise<string | null> {
    const v = await kv.get(kAlias2Id(scope, alias));
    return v ? utf8Decode(v) : null;
  }

  async function idToAlias(scope: string, id: string): Promise<string | null> {
    const v = await kv.get(kId2Alias(scope, id));
    return v ? utf8Decode(v) : null;
  }

  async function buildGraph(opts?: { limit?: number; scopeAliases?: string[] }): Promise<Graph> {
    // Import graph builder
    const { buildGraphFromStore } = await import('./graph.js');
    return buildGraphFromStore(kv, { limit: opts?.limit });
  }

  return {
    putEvent,
    getEvent,
    listKel,
    listTel,
    getByPrior,
    putAlias,
    delAlias,
    aliasToId,
    idToAlias,
    buildGraph,
  };
}
