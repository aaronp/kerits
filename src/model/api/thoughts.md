There are a lot of nice functional wrappers now for data, kels, tels, etc, but not a cohesive API which stitches together the high-level concepts in a clean way. 

My thoughts are to have an 'IO' package, with a 'KeyValueStore' that is able to simply write and read arbitrary data against a SAID:


We also need some kind of 'Transport' API for sending messages and receiving messages between AIDs. 


Those concepts need working through, but then I can have a top-level kerits API that passes those implementations through: 

```ts
const k : KeritsAPI = kerits(someDb, someTransport) 
const a : AccountAPI = k.createAccount('dave') // also has other top-level methods, such as 'listAccounts', getAccount(). They all return an AccountAPI. 
const tel : TelAPI = a.getTel('foo') // also has listTels(), rotateKeys(), createDelegateAccount('name') 
const acdc = tel.append({ some : "data"}) // uses our Data(json).schema() under the covers to save schemas, validate etc.
```

# Suggestions


Here’s a cohesive, **dependency-injected** API that ties storage (by SAID), KEL/TEL ops, OOBI resolution, schema management, and messaging into a clean top-level developer experience with:

1. Core IO primitives (content-addressed KV)

2. OOBI & resolvers

3. Transport & Channels

4. High-level `KeritsAPI` / `AccountAPI` / `TelAPI`

5. Minimal adapters (memory/disk/IndexedDB, in-mem transport)

6. Example flows \+ test seams

   ---

   # **1\) IO: Content-addressed storage**

Use **`Uint8Array`** for bytes (portable, matches WebCrypto). Include a tiny namespace wrapper and optional indexes.

1. `// io.ts`  
2. `export type SAID = string;          // e.g. 'E...' (CESR)`  
3. `export type Bytes = Uint8Array;`  
4.   
5. `export interface KeyValueStore {`  
6.   `get(id: SAID): Promise<Bytes | null>;`  
7.   `put(id: SAID, data: Bytes): Promise<void>;`  
8.   `del?(id: SAID): Promise<void>;`  
9.   `// Optional convenience`  
10.   `has?(id: SAID): Promise<boolean>;`  
11.   `listKeys?(prefix?: string): Promise<SAID[]>;`  
12. `}`  
13.   
14. `export interface NamespacedStore extends KeyValueStore {`  
15.   `namespace: string;`  
16. `}`  
17.   
18. `export function namespace(store: KeyValueStore, ns: string): NamespacedStore {`  
19.   `const prefix = ns.endsWith(":") ? ns : ns + ":";`  
20.   `const mapId = (id: SAID) => (id.startsWith(prefix) ? id : prefix + id);`  
21.   `return {`  
22.     `namespace: prefix,`  
23.     `async get(id) { return store.get(mapId(id)); },`  
24.     `async put(id, data) { return store.put(mapId(id), data); },`  
25.     `async del(id) { return store.del?.(mapId(id)); },`  
26.     `async has(id) { return store.has?.(mapId(id)) ?? !!(await this.get(id)); },`  
27.     `async listKeys(pfx) { return store.listKeys?.(prefix + (pfx ?? "")) ?? []; }`  
28.   `};`  
29. `}`  
    

    ### **Adapters (minimal)**

30. `// memory-store.ts`  
31. `export function memoryStore(): KeyValueStore {`  
32.   `const m = new Map<string, Bytes>();`  
33.   `return {`  
34.     `async get(id) { return m.get(id) ?? null; },`  
35.     `async put(id, data) { m.set(id, data); },`  
36.     `async del(id) { m.delete(id); },`  
37.     `async has(id) { return m.has(id); },`  
38.     `async listKeys(prefix="") { return [...m.keys()].filter(k => k.startsWith(prefix)); },`  
39.   `};`  
40. `}`  
41.   
42. `// disk-store.node.ts (Node only, uses fs)`  
43. `import { promises as fs } from "node:fs";`  
44. `import { dirname, join } from "node:path";`  
45. `export function diskStore(rootDir: string): KeyValueStore {`  
46.   `const pathFor = (id: string) => join(rootDir, id);`  
47.   `return {`  
48.     `async get(id) { try { return new Uint8Array(await fs.readFile(pathFor(id))); } catch { return null; } },`  
49.     `async put(id, data) { const p = pathFor(id); await fs.mkdir(dirname(p), { recursive: true }); await fs.writeFile(p, data); },`  
50.     `async del(id) { await fs.rm(pathFor(id), { force: true }); },`  
51.     `async has(id) { return (await this.get(id)) !== null; },`  
52.     `async listKeys() { /* optional: walk dir */ return []; },`  
53.   `};`  
54. `}`  
55.   
56. `// indexeddb-store.web.ts (browser)`  
57. `export function indexedDBStore(dbName = "kerits", storeName = "kv"): KeyValueStore { /* ...impl stub ... */ return /* ... */ {} as any; }`  
    

A **ContentAddressedStore** wrapper can compute SAIDs for you and de-dup:

58. `export interface Hasher {`  
59.   `saidOf(data: Bytes): SAID; // canonical JSON + CESR digest, etc.`  
60. `}`  
61.   
62. `export function contentAddressed(store: KeyValueStore, h: Hasher) {`  
63.   `return {`  
64.     `async putObject<T>(obj: T, encode: (o:T)=>Bytes): Promise<SAID> {`  
65.       `const bytes = encode(obj);`  
66.       `const said = h.saidOf(bytes);`  
67.       `await store.put(said, bytes);`  
68.       `return said;`  
69.     `},`  
70.     `async getObject<T>(id: SAID, decode: (b:Bytes)=>T): Promise<T|null> {`  
71.       `const b = await store.get(id); if (!b) return null;`  
72.       `return decode(b);`  
73.     `}`  
74.   `};`  
75. `}`  
      
    ---

    # **2\) OOBI resolution**

Treat OOBI as “get by identifier → document bytes”; the adapter decides the transport (HTTP, memory cache, etc.).

76. `export interface OOBIResolver {`  
77.   `resolve(id: string): Promise<Bytes | null>; // could fetch /oobi/{id}`  
78. `}`  
79.   
80. `export function oobiFromStore(store: KeyValueStore): OOBIResolver {`  
81.   `return { async resolve(id) { return store.get(id); } };`  
82. `}`  
      
    ---

    # **3\) Transport & Channels**

A small **message bus** that can be backed by WS/Convex/HTTP or in-memory. Messages are signed envelopes between AIDs.

83. `export interface AID { uri: string } // e.g. CESR prefix; keep simple here`  
84.   
85. `export type Message = {`  
86.   `id: string;             // SAID of envelope`  
87.   `from: AID;`  
88.   `to: AID;`  
89.   `typ: string;            // "kel.proposal" | "tel.append" | "oobi.query" ...`  
90.   `body: Bytes;            // app-level payload`  
91.   `refs?: string[];        // SAIDs referenced (KEL/TEL/ACDC)`  
92.   `dt: string;             // ISO`  
93.   `sigs?: { keyIndex: number; sig: string }[];`  
94. `};`  
95.   
96. `export interface Channel {`  
97.   `subscribe(onMessage: (m: Message)=>void): () => void; // returns unsubscribe`  
98. `}`  
99.   
100. `export interface Transport {`  
101.   `send(msg: Message): Promise<void>;`  
102.   `channel(aid: AID): Channel;`  
103.   `readUnread?(aid: AID, limit?: number): Promise<Message[]>;`  
104.   `ack?(aid: AID, ids: string[]): Promise<void>;`  
105. `}`  
106.   
107. `// In-memory transport for tests`  
108. `export function memoryTransport(): Transport {`  
109.   `const subs = new Map<string, Set<(m:Message)=>void>>();`  
110.   `const inbox = new Map<string, Message[]>();`  
111.   `function emit(to: string, m: Message) {`  
112.     `inbox.set(to, [...(inbox.get(to) ?? []), m]);`  
113.     `subs.get(to)?.forEach(fn => fn(m));`  
114.   `}`  
115.   `return {`  
116.     `async send(m) { emit(m.to.uri, m); },`  
117.     `channel(a) {`  
118.       `const key = a.uri;`  
119.       `if (!subs.has(key)) subs.set(key, new Set());`  
120.       `return {`  
121.         `subscribe(fn) { subs.get(key)!.add(fn); return () => subs.get(key)!.delete(fn); }`  
122.       `};`  
123.     `},`  
124.     `async readUnread(a, limit=100) {`  
125.       `const arr = inbox.get(a.uri) ?? []; inbox.set(a.uri, []); return arr.slice(0, limit);`  
126.     `},`  
127.     `async ack() { /* no-op for mem */ }`  
128.   `};`  
129. `}`  
       
     ---

     # **4\) High-level APIs**

     ### **Crypto \+ CESR boundary**

130. `export interface Crypto {`  
131.   `sign(data: Bytes, keyIndex: number): Promise<string>;         // CESR sig`  
132.   `verify(data: Bytes, sig: string, pub: string): Promise<boolean>;`  
133.   `` pubKeys(): string[];          // current `k` ``  
134.   `` threshold(): number;          // `kt` ``  
135.   `nextCommit(): { n: SAID; nt: number; nextKeys: string[] }; // committed next set`  
136. `}`  
     

     ### **KEL service (pure ops, content-addressed)**

137. `export interface KelEvent { /* v,t,d,i,s,p?,k?,kt?,n?,nt?,w?,wt?,a?,dt */ }`  
138. `export interface KelEnvelope { event: KelEvent; signatures: {keyIndex:number; sig:string}[]; receipts?: {aid:string; sig:string}[] }`  
139.   
140. `export interface KelService {`  
141.   `incept(args: {`  
142.     `controller: AID;`  
143.     `k: string[]; kt: number;`  
144.     `nextK: string[]; nt: number;`  
145.     `witnesses?: string[]; wt?: number; dt?: string;`  
146.   `}): KelEvent;`  
147.   
148.   `rotate(args: {`  
149.     `controller: AID;`  
150.     `prior: KelEvent;            // to enforce reveal==n`  
151.     `k: string[]; kt: number;`  
152.     `nextK: string[]; nt: number;`  
153.     `dt?: string;`  
154.   `}): KelEvent;`  
155.   
156.   `interaction(args: { controller: AID; prior: KelEvent; anchors?: SAID[]; dt?: string }): KelEvent;`  
157.   
158.   `sign(ev: KelEvent, crypto: Crypto): Promise<KelEnvelope>;`  
159.   `verify(env: KelEnvelope, readPrior: (id: SAID)=>Promise<KelEvent|null>): Promise<{ ok: boolean; reason?: string }>;`  
160. `}`  
     

     ### **TEL service (pure ops)**

161. `export interface TelEvent { /* v,t,d,i,s,p?,a:SAID[], e:any, dt */ }`  
162. `export interface TelEnvelope { event: TelEvent; signatures: {keyIndex:number; sig:string}[]; endorsements?: any[]; }`  
163.   
164. `export interface TelService {`  
165.   `issue(args: { controller: AID; telId: SAID; stateSaid: SAID; anchors?: SAID[]; dt?: string }): TelEvent;`  
166.   `update(args:{ controller: AID; prior: TelEvent; stateSaid: SAID; policySaid?: SAID; dt?: string }): TelEvent;`  
167.   `revoke(args:{ controller: AID; prior: TelEvent; reason?: string; dt?: string }): TelEvent;`  
168.   
169.   `sign(ev: TelEvent, crypto: Crypto): Promise<TelEnvelope>;`  
170.   `verify(env: TelEnvelope, controllerKel: (aid:AID)=>Promise<KelEvent[]>): Promise<{ ok:boolean; reason?:string }>;`  
171. `}`  
     

     ### **Schema/Data registry**

172. `export interface SchemaService {`  
173.   `ensureSchemaFor(data: unknown): Promise<SAID>;     // generate+store JSON Schema, return SAID`  
174.   `validate(data: unknown, schemaSaid: SAID): Promise<void>;`  
175. `}`  
176.   
177. `export interface ACDCService {`  
178.   `issue(payload: unknown, schemaSaid: SAID): Promise<SAID>; // returns ACDC SAID`  
179. `}`  
     

     ### **Top-level `KeritsAPI`**

180. `export interface KeritsAPI {`  
181.   `accounts(): Promise<AccountAPI[]>;`  
182.   `createAccount(alias: string, opts?: { crypto?: Crypto }): Promise<AccountAPI>;`  
183.   `getAccount(aliasOrAid: string): Promise<AccountAPI>;`  
184. `}`  
185.   
186. `export interface AccountAPI {`  
187.   `aid(): AID;`  
188.   `alias(): string;`  
189.   
190.   `// KEL`  
191.   `kel(): Promise<KelEvent[]>;`  
192.   `rotateKeys(): Promise<KelEvent>;                         // uses injected Crypto.nextCommit()`  
193.   `anchor(saids: SAID[]): Promise<KelEvent>;                // ixn`  
194.   
195.   `// TELs`  
196.   `listTels(): Promise<SAID[]>;`  
197.   `getTel(id: string): Promise<TelAPI>;`  
198.   `createTel(name: string): Promise<TelAPI>;`  
199.   
200.   `// Delegation`  
201.   `createDelegateAccount(alias: string): Promise<AccountAPI>; // child AID with dlg + parent anchor`  
202. `}`  
203.   
204. `export interface TelAPI {`  
205.   `id(): SAID;`  
206.   `latest(): Promise<TelEvent | null>;`  
207.   
208.   `append(data: unknown, opts?: { withPolicy?: SAID }): Promise<{ stateSaid: SAID; telEvent: TelEvent }>;`  
209.   `revoke(reason?: string): Promise<TelEvent>;`  
210.   
211.   `// Low level`  
212.   `issueWithState(stateSaid: SAID): Promise<TelEvent>;`  
213.   `updateToState(stateSaid: SAID, policySaid?: SAID): Promise<TelEvent>;`  
214. `}`  
     

     ### **Composition: wire everything in `kerits(...)`**

215. `export function kerits(`  
216.   `stores: {`  
217.     `root: KeyValueStore;        // raw bytes store`  
218.     `kels?: NamespacedStore;     // optional pre-namespaced (else we create)`  
219.     `tels?: NamespacedStore;`  
220.     `schemas?: NamespacedStore;`  
221.     `acdcs?: NamespacedStore;`  
222.     `index?: KeyValueStore;      // for alias → AID mapping, tel name → tel SAID, etc.`  
223.   `},`  
224.   `transport: Transport,`  
225.   `deps: {`  
226.     `hasher: Hasher;`  
227.     `kel: KelService;`  
228.     `tel: TelService;`  
229.     `schema: SchemaService;`  
230.     `acdc: ACDCService;`  
231.     `oobi?: OOBIResolver;`  
232.     `clock?: ()=>string;         // ISO time`  
233.     `cryptoFactory?: (aid:AID)=>Crypto;`  
234.   `}`  
235. `): KeritsAPI { /* construct and return implementation */ }`  
     

**Why this shape works:** everything is **pluggable** (storage, crypto, transport). KEL/TEL services are pure and reusable; the top API orchestrates persistence, signing, messaging, and indexing.

---

# **5\) Minimal adapters to get moving**

* `kelServiceDefault`, `telServiceDefault`: enforce all the rules we outlined (thresholds, reveal==n, signatures from prior keys on `rot`, etc.).

* `schemaServiceDefault`: JSON-Schema generator from example \+ canonicalized bytes into the `schemas` store.

* `acdcServiceDefault`: wraps payload \+ schema metadata, computes SAID, stores in `acdcs`.

  ---

  # **6\) Example usage (aligned with your sketch)**

236. `import { memoryStore, diskStore, namespace } from "./io";`  
237. `import { memoryTransport } from "./transport-mem";`  
238. `import { kerits } from "./kerits";`  
239.   
240. `// IO wiring`  
241. `const root = diskStore("./data");`  
242. `const kelStore = namespace(root, "kels");`  
243. `const telsStore = memoryStore(); // transient`  
244. ``const telStore = (telSaid: SAID) => namespace(root, `tel/${telSaid}`);``  
245.   
246. `// Transport`  
247. `const transport = memoryTransport();`  
248.   
249. `// Build API (inject default services)`  
250. `const k: KeritsAPI = kerits(`  
251.   `{ root, kels: kelStore, tels: namespace(root, "tels"), schemas: namespace(root, "schemas"), acdcs: namespace(root, "acdcs"), index: namespace(root, "index") },`  
252.   `transport,`  
253.   `depsDefaults // { hasher, kel, tel, schema, acdc, clock, cryptoFactory }`  
254. `);`  
255.   
256. `// Accounts`  
257. `const a: AccountAPI = await k.createAccount("dave");`  
258. `const tel: TelAPI = await a.createTel("foo");`  
259.   
260. `// Appending data with schema auto-gen`  
261. `` const result = await tel.append({ some: "data" }); // -> generates schema, issues ACDC, creates TEL `iss`/`up` ``  
262. `console.log(result.stateSaid);`  
263.   
264. `// Rotations`  
265. `await a.rotateKeys();`  
266.   
267. `// Delegation`  
268. `` const child: AccountAPI = await a.createDelegateAccount("dept-A"); // child `dlg` + parent anchor `ixn` ``  
269.   
270. `// Messaging`  
271. `const ch = transport.channel(a.aid());`  
272. `const unsubscribe = ch.subscribe(m => { /* handle inbound */ });`  
273. `await transport.send({`  
274.   `id: "E…", from: a.aid(), to: (await child.aid()), typ: "tel.notify",`  
275.   `body: new Uint8Array([/*…*/]), dt: new Date().toISOString()`  
276. `});`  
       
     ---

     # **Testing seams**

* **Unit**: `kelServiceDefault.verify` with crafted envelopes and deterministic keys.

* **Integration**: `kerits` with `memoryStore()` \+ `memoryTransport()`; assert items appear in the right namespaces (`kels:`, `tels:`, `acdcs:`).

* **Property tests**: rotation reveal must equal prior `n`; signatures from old keys; `kt/nt` ranges; duplicate index rejection.

* **Delegation**: child `dlg` invalid until parent `ixn` anchor persisted; then valid.

  ---

  # **Notes on ergonomics**

* Provide small helpers:

  * `k.getAccount("dave").then(a => a.getTel("foo"))`

  * `a.listTels()` returns `{ name, said }[]` via the `index` store.

* For browser, ship `indexedDBStore()` and keep everything else identical.

* For server, ship `diskStore()` and a WS/HTTP transport adapter.

# **Key Rotation**

Here’s a clean, production-ready shape for **multi-sig key rotation as a long-lived workflow**, with rich types, transport-driven coordination, and persistence hooks.

I’ll give you:

* The core types returned by `rotateKeys()` (with `awaitAll()` \+ `status()` \+ events)

* Message schema over your `Transport`

* A reference workflow (propose → collect → finalize → publish)

* Minimal implementation skeleton you can drop in

---

# **1\) Return type from `rotateKeys()`**

`// rotation.ts`  
`export type RotationId = string; // SAID of the rotation proposal envelope`

`export type RotationPhase =`  
  `| "proposed"         // proposal created; messages sent`  
  `| "collecting"       // waiting for cosigner approvals`  
  `| "finalizable"      // threshold reached, ready to finalize+publish`  
  `| "finalized"        // KEL rot event published (env written to store)`  
  `| "failed"           // canceled/expired or rejected by policy`  
  `| "aborted";         // explicitly aborted by initiator`

`export interface SignerRequirement {`  
  `aid: AID;               // cosigner AID`  
  `keyIndex: number;       // index in prior k[]`  
  `required: boolean;      // true if contributes to kt`  
  `signed: boolean;`  
  `signature?: string;     // CESR signature if present`  
  `seenAt?: string;        // ISO`  
`}`

`export interface RotationStatus {`  
  `id: RotationId;`  
  `controller: AID;`  
  `phase: RotationPhase;`  
  `createdAt: string;`  
  `deadline?: string;`  
  `required: number;           // kt (decoded)`  
  `totalKeys: number;          // |k|`  
  `collected: number;          // valid signatures collected`  
  `missing: number;            // required - collected (lower-bounded at 0)`  
  `signers: SignerRequirement[];`  
  `priorEvent: SAID;           // prior KEL d (p)`  
  `revealCommit: SAID;         // SAID({k: newK, kt: newKt}) == prior.n`  
  `nextThreshold: number;      // nt`  
`}`

`export interface RotationProgressEvent {`  
  `type:`  
    `| "signature:accepted"`  
    `| "signature:rejected"`  
    `| "status:phase"`  
    `| "deadline:near"`  
    `| "finalized"`  
    `| "aborted"`  
    `| "error";`  
  `rotationId: RotationId;`  
  `payload?: any;`  
`}`

`export interface RotationHandle {`  
  `/** resolve when required signatures are collected (or failure/abort) */`  
  `awaitAll(opts?: { timeoutMs?: number; throwOnFail?: boolean }): Promise<RotationStatus>;`

  `/** current status snapshot (reads from store/index) */`  
  `status(): Promise<RotationStatus>;`

  `/** cancel flow and notify participants */`  
  `abort(reason?: string): Promise<void>;`

  `/** subscribe to progress events */`  
  `onProgress(handler: (e: RotationProgressEvent) => void): () => void;`  
`}`

**Ergonomics:**

`const handle = await account.rotateKeys();     // returns immediately`  
`const status0 = await handle.status();         // "proposed" or "collecting"`  
`const final = await handle.awaitAll();         // resolves at "finalized"`

---

# **2\) Messages over `Transport`**

Minimal, self-describing envelopes with typed `typ` values. These are domain messages; the KEL `rot` is created/published only when threshold is met.

`// messages.ts`  
`export type RotationProposal = {`  
  `typ: "keri.rot.proposal.v1";`  
  `rotationId: RotationId;`  
  `controller: AID;`  
  `priorEvent: SAID;                 // prior d`  
  `priorKeys: string[];              // prior k[]`  
  `priorThreshold: number;           // decode(kt)`  
  `reveal: {                         // what will be revealed on rot`  
    `newKeys: string[];              // k'`  
    `newThreshold: number;           // kt'`  
    `nextCommit: { n: SAID; nt: number }; // for *next* rotation`  
  `};`  
  `// optional UX`  
  `deadline?: string;`  
  `note?: string;`  
`};`

`export type RotationSign = {`  
  `typ: "keri.rot.sign.v1";`  
  `rotationId: RotationId;`  
  `signer: AID;`  
  `keyIndex: number;                 // index into prior k[]`  
  `sig: string;                      // CESR signature over proposal hash or canonical rot-event body`  
  `ok: boolean;                      // false to explicitly reject`  
  `reason?: string;`  
`};`

`export type RotationFinalize = {`  
  `typ: "keri.rot.finalize.v1";`  
  `rotationId: RotationId;`  
  `rotEventSaid: SAID;               // published KEL rot d`  
`};`

`export type RotationAbort = {`  
  `typ: "keri.rot.abort.v1";`  
  `rotationId: RotationId;`  
  `reason?: string;`  
`};`

**What exactly do signers sign?**  
 Keep it unambiguous:

* Either: **canonical prospective rot event body** (without signatures)  
   `canon(rotCandidate)` → sign bytes

* Or: a **canonical hash of the `RotationProposal`** (include reveal \+ prior)

Pick one and stick to it (I’d sign the **rot candidate**; it’s what will be published).

---

# **3\) High-level workflow (initiator)**

1. **Propose**

   * Build `rot` candidate: `t="rot"`, `p=prior.d`, `k=newKeys`, `kt=newKt`, `n=SAID(nextK+nt)`, `nt`

   * Verify `SAID({k:newKeys, kt:newKt}) === prior.n` (reveal commitment)

   * **Persist** proposal: `rotation:<id>` document (status \= `proposed`)

   * Broadcast `RotationProposal` to all cosigners (`prior.k[]` mapped to AIDs)

2. **Collect**

   * Subscribe to the initiator’s channel; accept `RotationSign` messages:

     * Verify signer is in prior key set and `keyIndex` matches

     * Verify signature over the chosen canonical bytes

     * Deduplicate, mark signer as `signed=true`

   * Transition `phase` to `collecting` and then `finalizable` when `collected ≥ prior.kt`

3. **Finalize**

   * Once threshold met:

     * **Publish** KEL `rot` event with **initiator’s own signature \+ any others (optional; only threshold required)**

     * Persist rot envelope to the KEL store

     * Broadcast `RotationFinalize`

4. **Complete**

   * Update rotation doc to `finalized`

   * Fire `onProgress({type:"finalized"})`

**Abort/timeout:**

* If deadline passes or initiator aborts, set `phase="aborted"` and broadcast `RotationAbort`.

---

# **4\) Cosigner behavior (other devices/accounts)**

* Listen for `RotationProposal`

* Validate commitment reveal vs prior.n and that you’re an authorized signer (in prior.k\[\])

* Prompt user or auto-sign per policy

* Send `RotationSign` back to **initiator** (or broadcast to controller group)

* Optionally verify `RotationFinalize` (and update local KEL)

---

# **5\) `AccountAPI.rotateKeys()` signature**

`export interface AccountAPI {`  
  `rotateKeys(opts?: {`  
    `// supply reveal; if omitted, use Crypto.nextCommit()`  
    `newKeys?: string[];`  
    `newThreshold?: number;`  
    `nextKeys?: string[];`  
    `nextThreshold?: number;`  
    `deadlineMs?: number;`  
    `note?: string;`  
  `}): Promise<RotationHandle>;`  
`}`

---

# **6\) Implementation skeleton**

`// account-rotate.ts`  
`export function makeRotateKeys(accountDeps: {`  
  `clock: () => string;`  
  `stores: {`  
    `index: KeyValueStore;         // for rotation:<id>`  
    `kels: KeyValueStore;`  
  `};`  
  `kel: KelService;`  
  `transport: Transport;`  
  `crypto: Crypto;                 // for initiator`  
  `resolveCosigners: (prior: KelEvent) => Promise<Array<{ aid: AID; keyIndex: number; pub: string }>>;`  
  `// map pub -> AID; typically from your address book or account registry`  
`}) {`  
  `return async function rotateKeys(account: AccountAPI, opts?: any): Promise<RotationHandle> {`  
    `const now = accountDeps.clock();`

    `// 1. Read prior KEL event & controller state`  
    `const kelEvents = await account.kel();`  
    `const prior = kelEvents.at(-1)!; // latest event`  
    `const priorK = prior.k!;`  
    `const priorKt = decodeThreshold(prior.kt!);`

    `// 2. Determine reveal (new k/kt) and next commit (n/nt)`  
    `const revealK = opts?.newKeys ?? accountDeps.crypto.pubKeys();`  
    `const revealKt = opts?.newThreshold ?? accountDeps.crypto.threshold();`

    `const next = opts?.nextKeys && opts?.nextThreshold`  
      `? { nextKeys: opts.nextKeys, nextThreshold: opts.nextThreshold }`  
      `: accountDeps.crypto.nextCommit(); // { n, nt, nextKeys }`

    `// Compute candidate rot event (unsigned)`  
    `const rotEvent = accountDeps.kel.rotate({`  
      `controller: account.aid(),`  
      `prior,`  
      `k: revealK,`  
      `kt: revealKt,`  
      `nextK: next.nextKeys,`  
      `nt: next.nextThreshold,`  
      `dt: now,`  
    `});`

    `// Enforce reveal == prior.n`  
    `const revealSaid = SAIDof({ k: rotEvent.k, kt: rotEvent.kt });`  
    `if (revealSaid !== prior.n) throw new Error("Reveal does not match prior commitment");`

    `// 3. Build proposal`  
    `const rotationId: RotationId = SAIDof(canonicalBytes(rotEvent)); // or SAID of proposal doc`  
    `const proposal: RotationProposal = {`  
      `typ: "keri.rot.proposal.v1",`  
      `rotationId,`  
      `controller: account.aid(),`  
      `priorEvent: prior.d,`  
      `priorKeys: priorK,`  
      `priorThreshold: priorKt,`  
      `reveal: {`  
        `newKeys: revealK,`  
        `newThreshold: revealKt,`  
        `nextCommit: { n: rotEvent.n!, nt: decodeThreshold(rotEvent.nt!) },`  
      `},`  
      `deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,`  
      `note: opts?.note`  
    `};`

    `// 4. Persist rotation doc`  
    ``const docKey = `rotation:${rotationId}`;``  
    `const initialStatus: RotationStatus = {`  
      `id: rotationId, controller: account.aid(), phase: "proposed",`  
      `createdAt: now, deadline: proposal.deadline,`  
      `required: priorKt, totalKeys: priorK.length, collected: 0, missing: priorKt,`  
      `signers: (await accountDeps.resolveCosigners(prior)).map(c => ({`  
        `aid: c.aid, keyIndex: c.keyIndex, required: true, signed: false`  
      `})),`  
      `priorEvent: prior.d, revealCommit: revealSaid, nextThreshold: decodeThreshold(rotEvent.nt!)`  
    `};`  
    `await putJson(accountDeps.stores.index, docKey, initialStatus);`

    `// 5. Notify cosigners`  
    `for (const s of initialStatus.signers) {`  
      `await accountDeps.transport.send({`  
        `id: rotationId,`  
        `from: account.aid(),`  
        `to: s.aid,`  
        `typ: "keri.rot.proposal.v1",`  
        `body: canonicalBytes(proposal),`  
        `dt: now`  
      `});`  
    `}`

    `// 6. Subscribe to replies`  
    `const listeners = new Set<(e: RotationProgressEvent)=>void>();`  
    `const onProgress = (e: RotationProgressEvent) => listeners.forEach(fn => fn(e));`

    `const unsub = accountDeps.transport.channel(account.aid()).subscribe(async (m) => {`  
      `if (m.typ !== "keri.rot.sign.v1") return;`  
      `const msg = decode<RotationSign>(m.body);`  
      `if (msg.rotationId !== rotationId) return;`

      `const status = await getJson<RotationStatus>(accountDeps.stores.index, docKey);`  
      `if (!status || status.phase === "finalized" || status.phase === "aborted") return;`

      `const signer = status.signers.find(s => s.keyIndex === msg.keyIndex);`  
      `if (!signer) return;`

      `if (!msg.ok) {`  
        `onProgress({ type: "signature:rejected", rotationId, payload: msg });`  
        `return;`  
      `}`

      `// Verify signature over canonical rotEvent`  
      `const ok = await accountDeps.kel.verify({`  
        `event: rotEvent,`  
        `sig: msg.sig,`  
        `keyIndex: msg.keyIndex,`  
        `prior`  
      `});`  
      `if (!ok) {`  
        `onProgress({ type: "error", rotationId, payload: "bad signature" });`  
        `return;`  
      `}`

      `if (!signer.signed) {`  
        `signer.signed = true;`  
        `signer.signature = msg.sig;`  
        `signer.seenAt = accountDeps.clock();`  
        `status.collected = status.signers.filter(s => s.signed && s.required).length;`  
        `status.missing = Math.max(0, status.required - status.collected);`  
        `status.phase = status.collected >= status.required ? "finalizable" : "collecting";`  
        `await putJson(accountDeps.stores.index, docKey, status);`  
        `onProgress({ type: "signature:accepted", rotationId, payload: { keyIndex: msg.keyIndex } });`  
        `if (status.phase === "finalizable") onProgress({ type: "status:phase", rotationId, payload: "finalizable" });`  
      `}`  
    `});`

    `// 7. Finalization helper`  
    `async function tryFinalize(): Promise<RotationStatus> {`  
      `const status = await getJson<RotationStatus>(accountDeps.stores.index, docKey);`  
      `if (!status) throw new Error("rotation missing");`  
      `if (status.phase !== "finalizable") return status;`

      `// Attach initiator signature (must be from prior keys too)`  
      `const env = await accountDeps.kel.sign(rotEvent, accountDeps.crypto);`

      `// Publish to KEL store (append)`  
      `await appendKelEnv(accountDeps.stores.kels, env);`

      `// Notify finalize`  
      `await accountDeps.transport.send({`  
        `id: rotationId,`  
        `from: account.aid(),`  
        `to: account.aid(), // could broadcast to all participants`  
        `typ: "keri.rot.finalize.v1",`  
        `body: canonicalBytes(<RotationFinalize>{`  
          `typ: "keri.rot.finalize.v1",`  
          `rotationId,`  
          `rotEventSaid: rotEvent.d`  
        `}),`  
        `dt: accountDeps.clock()`  
      `});`

      `status.phase = "finalized";`  
      `await putJson(accountDeps.stores.index, docKey, status);`  
      `onProgress({ type: "finalized", rotationId, payload: { rot: rotEvent.d } });`  
      `unsub();`  
      `return status;`  
    `}`

    `// 8. Return handle`  
    `const handle: RotationHandle = {`  
      `async awaitAll(opts) {`  
        `const timeoutMs = opts?.timeoutMs ?? 7 * 24 * 3600_000; // default 7 days`  
        `const deadline = Date.now() + timeoutMs;`  
        `while (Date.now() < deadline) {`  
          `const s = await tryFinalize();`  
          `if (s.phase === "finalized" || s.phase === "aborted" || s.phase === "failed") {`  
            ``if (opts?.throwOnFail && s.phase !== "finalized") throw new Error(`rotation ${s.phase}`);``  
            `return s;`  
          `}`  
          `await new Promise(r => setTimeout(r, 1500));`  
        `}`  
        `const s = await (async () => {`  
          `const cur = await getJson<RotationStatus>(accountDeps.stores.index, docKey);`  
          `if (!cur) throw new Error("rotation missing");`  
          `cur.phase = "failed";`  
          `await putJson(accountDeps.stores.index, docKey, cur);`  
          `return cur;`  
        `})();`  
        `if (opts?.throwOnFail) throw new Error("rotation timed out");`  
        `return s;`  
      `},`  
      `async status() {`  
        `const s = await getJson<RotationStatus>(accountDeps.stores.index, docKey);`  
        `if (!s) throw new Error("rotation missing");`  
        `return s;`  
      `},`  
      `async abort(reason) {`  
        `const s = await getJson<RotationStatus>(accountDeps.stores.index, docKey);`  
        `if (!s) return;`  
        `s.phase = "aborted";`  
        `await putJson(accountDeps.stores.index, docKey, s);`  
        `await accountDeps.transport.send({`  
          `id: rotationId, from: account.aid(), to: account.aid(),`  
          `typ: "keri.rot.abort.v1", body: canonicalBytes(<RotationAbort>{ typ:"keri.rot.abort.v1", rotationId, reason }),`  
          `dt: accountDeps.clock()`  
        `});`  
        `onProgress({ type:"aborted", rotationId, payload:{reason} });`  
        `unsub();`  
      `},`  
      `onProgress(handler) { listeners.add(handler); return () => listeners.delete(handler); }`  
    `};`

    `return handle;`  
  `};`  
`}`

Note: utilities `putJson/getJson/appendKelEnv/SAIDof/canonicalBytes/decodeThreshold` are your existing helpers.

---

# **7\) Single-sig fast path**

If `prior.kt === 1` and the initiator controls that key, **finalize immediately** without proposals:

`if (priorKt === 1 && controlsKey(accountDeps.crypto, prior)) {`  
  `// sign + append rot now, return handle already "finalized"`  
`}`

---

# **8\) UX niceties**

* `onProgress` can emit `"deadline:near"` when `deadline - now < 24h`.

* `status()` can compute ETA \= `deadline - now`, and list `missing` cosigners (by AID).

* Add `resendRequests()` on handle to re-broadcast the proposal to missing cosigners.

* Persist each signature as `rotation:<id>:sig:<keyIndex>` for idempotency.

---

# **9\) Security & correctness guardrails**

* Always verify **signatures from the PRIOR key set**.

* Ensure **reveal \== prior.n**.

* Reject **duplicate keyIndex** or out-of-bounds indices.

* Consider allowing **more than `kt`** signatures; include them if available when publishing.

* Optionally require **witness receipts** for the `rot` per your KEL policy.

---

# **10\) Example usage**

`const dave = await k.getAccount("dave");`

`// Start rotation (gathers cosigners out-of-band)`  
`const rot = await dave.rotateKeys({ note: "quarterly rotation", deadlineMs: 3*24*3600_000 });`

`rot.onProgress(e => console.log("progress", e.type, e.payload));`  
`console.log(await rot.status());            // { phase: "collecting", ... }`

`const final = await rot.awaitAll();         // resolves when finalized (or failed/aborted)`  
`console.log("rotation final:", final.phase, final.priorEvent, "→", final.revealCommit);`

---

This design gives you a **first-class workflow object** that you can persist, resume after restarts, and drive entirely through your pluggable `Transport`. It scales from **1-of-1 instant rotations** to **multi-day multi-sig rotations** without changing the calling code.

# Updates to our base API

ere’s a drop-in set of TypeScript modules that match what we just designed, wired into `kerits(...)`. They compile together and give you a working `rotateKeys()` workflow with `awaitAll()` / `status()` / `onProgress()` and transport-driven cosigner coordination.

I’ve kept it tight but complete enough to run. You can paste these into your repo under `src/` and adjust imports as needed.

---

# **`src/types.ts`**

`// src/types.ts`  
`export type SAID = string;`  
`export type Bytes = Uint8Array;`

`export interface AID { uri: string } // CESR prefix; simple for now`

`export type RotationId = string;`

`export type RotationPhase =`  
  `| "proposed"`  
  `| "collecting"`  
  `| "finalizable"`  
  `| "finalized"`  
  `| "failed"`  
  `| "aborted";`

`export interface SignerRequirement {`  
  `aid: AID;`  
  `keyIndex: number;`  
  `required: boolean;`  
  `signed: boolean;`  
  `signature?: string;`  
  `seenAt?: string;`  
`}`

`export interface RotationStatus {`  
  `id: RotationId;`  
  `controller: AID;`  
  `phase: RotationPhase;`  
  `createdAt: string;`  
  `deadline?: string;`  
  `required: number;`  
  `totalKeys: number;`  
  `collected: number;`  
  `missing: number;`  
  `signers: SignerRequirement[];`  
  `priorEvent: SAID;`  
  `revealCommit: SAID;`  
  `nextThreshold: number;`  
`}`

`export interface RotationProgressEvent {`  
  `type:`  
    `| "signature:accepted"`  
    `| "signature:rejected"`  
    `| "status:phase"`  
    `| "deadline:near"`  
    `| "finalized"`  
    `| "aborted"`  
    `| "error";`  
  `rotationId: RotationId;`  
  `payload?: any;`  
`}`

`export interface RotationHandle {`  
  `awaitAll(opts?: { timeoutMs?: number; throwOnFail?: boolean }): Promise<RotationStatus>;`  
  `status(): Promise<RotationStatus>;`  
  `abort(reason?: string): Promise<void>;`  
  `onProgress(handler: (e: RotationProgressEvent) => void): () => void;`  
`}`

`// Messages over Transport`  
`export type RotationProposal = {`  
  `typ: "keri.rot.proposal.v1";`  
  `rotationId: RotationId;`  
  `controller: AID;`  
  `priorEvent: SAID;`  
  `priorKeys: string[];`  
  `priorThreshold: number;`  
  `reveal: {`  
    `newKeys: string[];`  
    `newThreshold: number;`  
    `nextCommit: { n: SAID; nt: number };`  
  `};`  
  `deadline?: string;`  
  `note?: string;`  
`};`

`export type RotationSign = {`  
  `typ: "keri.rot.sign.v1";`  
  `rotationId: RotationId;`  
  `signer: AID;`  
  `keyIndex: number;`  
  `sig: string;`  
  `ok: boolean;`  
  `reason?: string;`  
`};`

`export type RotationFinalize = {`  
  `typ: "keri.rot.finalize.v1";`  
  `rotationId: RotationId;`  
  `rotEventSaid: SAID;`  
`};`

`export type RotationAbort = {`  
  `typ: "keri.rot.abort.v1";`  
  `rotationId: RotationId;`  
  `reason?: string;`  
`};`

---

# **`src/io.ts`**

`// src/io.ts`  
`import type { SAID, Bytes } from "./types";`

`export interface KeyValueStore {`  
  `get(id: SAID): Promise<Bytes | null>;`  
  `put(id: SAID, data: Bytes): Promise<void>;`  
  `del?(id: SAID): Promise<void>;`  
  `has?(id: SAID): Promise<boolean>;`  
  `listKeys?(prefix?: string): Promise<SAID[]>;`  
`}`

`// Memory store adapter (quick start)`  
`export function memoryStore(): KeyValueStore {`  
  `const m = new Map<string, Bytes>();`  
  `return {`  
    `async get(id) { return m.get(id) ?? null; },`  
    `async put(id, data) { m.set(id, data); },`  
    `async del(id) { m.delete(id); },`  
    `async has(id) { return m.has(id); },`  
    `async listKeys(prefix = "") { return [...m.keys()].filter(k => k.startsWith(prefix)); },`  
  `};`  
`}`

`// Namespacing helper`  
`export function namespace(store: KeyValueStore, ns: string): KeyValueStore {`  
  `const prefix = ns.endsWith(":") ? ns : ns + ":";`  
  `const map = (id: SAID) => (id.startsWith(prefix) ? id : prefix + id);`  
  `return {`  
    `async get(id) { return store.get(map(id)); },`  
    `async put(id, data) { return store.put(map(id), data); },`  
    `async del(id) { return store.del?.(map(id)); },`  
    `async has(id) { return store.has?.(map(id)) ?? !!(await store.get(map(id))); },`  
    `async listKeys(pfx) { return store.listKeys?.(prefix + (pfx ?? "")); },`  
  `};`  
`}`

`// Tiny JSON helpers`  
`export async function putJson(store: KeyValueStore, id: SAID, obj: any) {`  
  `const data = new TextEncoder().encode(JSON.stringify(obj));`  
  `await store.put(id, data);`  
`}`

`export async function getJson<T>(store: KeyValueStore, id: SAID): Promise<T | null> {`  
  `const b = await store.get(id);`  
  `if (!b) return null;`  
  `return JSON.parse(new TextDecoder().decode(b)) as T;`  
`}`

---

# **`src/transport.ts`**

`// src/transport.ts`  
`import type { AID, Bytes } from "./types";`

`export type Message = {`  
  `id: string;`  
  `from: AID;`  
  `to: AID;`  
  `typ: string;`  
  `body: Bytes;`  
  `dt: string;`  
`};`

`export interface Channel {`  
  `subscribe(onMessage: (m: Message) => void): () => void;`  
`}`

`export interface Transport {`  
  `send(msg: Message): Promise<void>;`  
  `channel(aid: AID): Channel;`  
  `readUnread?(aid: AID, limit?: number): Promise<Message[]>;`  
  `ack?(aid: AID, ids: string[]): Promise<void>;`  
`}`

`// In-memory bus (for tests & local dev)`  
`export function memoryTransport(): Transport {`  
  `const subs = new Map<string, Set<(m: Message) => void>>();`  
  `const inbox = new Map<string, Message[]>();`  
  `function push(to: string, m: Message) {`  
    `inbox.set(to, [...(inbox.get(to) ?? []), m]);`  
    `subs.get(to)?.forEach(fn => fn(m));`  
  `}`  
  `return {`  
    `async send(m) { push(m.to.uri, m); },`  
    `channel(a) {`  
      `const key = a.uri;`  
      `if (!subs.has(key)) subs.set(key, new Set());`  
      `return {`  
        `subscribe(fn) { subs.get(key)!.add(fn); return () => subs.get(key)!.delete(fn); }`  
      `};`  
    `},`  
    `async readUnread(a, limit = 100) {`  
      `const arr = inbox.get(a.uri) ?? [];`  
      `inbox.set(a.uri, []);`  
      `return arr.slice(0, limit);`  
    `},`  
    `async ack() {},`  
  `};`  
`}`

---

# **`src/services/kel.ts`**

`// src/services/kel.ts`  
`import type { AID, SAID } from "../types";`

`export interface KelEvent {`  
  `v: string; t: "icp" | "rot" | "ixn" | "dlg" | "rpy";`  
  `d: SAID; i: AID; s: string; p?: SAID;`  
  `k?: string[]; kt?: string;          // establishment`  
  `n?: SAID; nt?: string;              // next commitment`  
  `w?: string[]; wt?: string;          // witnesses (optional)`  
  `a?: any[]; dt: string;`  
`}`

`export interface CesrSig { keyIndex: number; sig: string }`  
`export interface KelEnvelope { event: KelEvent; signatures: CesrSig[]; receipts?: CesrSig[] }`

`export interface Crypto {`  
  `sign(data: Uint8Array, keyIndex: number): Promise<string>;`  
  `verify(data: Uint8Array, sig: string, pub: string): Promise<boolean>;`  
  `pubKeys(): string[];          // current k[]`  
  `threshold(): number;          // current kt (decoded)`  
  `nextCommit(): { n: SAID; nt: number; nextKeys: string[] };`  
`}`

`export interface KelService {`  
  `incept(args: {`  
    `controller: AID;`  
    `k: string[]; kt: number;`  
    `nextK: string[]; nt: number;`  
    `witnesses?: string[]; wt?: number;`  
    `dt?: string;`  
  `}): KelEvent;`

  `rotate(args: {`  
    `controller: AID;`  
    `prior: KelEvent;`  
    `k: string[]; kt: number;`  
    `nextK: string[]; nt: number;`  
    `dt?: string;`  
  `}): KelEvent;`

  `interaction(args: { controller: AID; prior: KelEvent; anchors?: SAID[]; dt?: string }): KelEvent;`

  `sign(ev: KelEvent, crypto: Crypto): Promise<KelEnvelope>;`

  `verifyEnvelope(env: KelEnvelope, readPrior: (said: SAID) => Promise<KelEvent | null>): Promise<{ ok: boolean; reason?: string }>;`

  `// helpers`  
  `canonicalBytes(ev: KelEvent): Uint8Array;`  
  `saidOf(ev: KelEvent): SAID;`  
  `saidOfKeyset(k: string[], kt: number): SAID; // SAID({k, kt})`  
  `decodeThreshold(kt: string): number;`  
  `encodeThreshold(n: number): string;`  
`}`

Plug your existing implementation here. What matters for `rotateKeys()` is:

* `saidOfKeyset(k, kt)` (for `reveal == prior.n` check)

* `canonicalBytes(ev)` for signatures

* `verifyEnvelope` validating “signatures from prior keys” on `rot`.

---

# **`src/services/tel.ts` (interface only for completeness)**

`// src/services/tel.ts`  
`import type { AID, SAID } from "../types";`

`export interface TelEvent {`  
  `v: string; t: "iss" | "up" | "rev";`  
  `d: SAID; i: AID; s: string; p?: SAID;`  
  `a: SAID[]; e: any; dt: string;`  
`}`

`export interface TelEnvelope { event: TelEvent; signatures: { keyIndex: number; sig: string }[] }`

`export interface TelService {`  
  `// typical hooks, not used directly by rotateKeys`  
  `sign(ev: TelEvent, crypto: any): Promise<TelEnvelope>;`  
  `verify(env: TelEnvelope, controllerKel: (aid: AID) => Promise<any>): Promise<{ ok: boolean; reason?: string }>;`  
`}`

---

# **`src/rotation/rotateKeys.ts`**

`// src/rotation/rotateKeys.ts`  
`import type {`  
  `RotationId, RotationHandle, RotationStatus, RotationProposal, RotationSign,`  
  `RotationFinalize, RotationAbort, RotationProgressEvent, AID, SAID`  
`} from "../types";`  
`import type { KeyValueStore, getJson, putJson } from "../io"; // we re-export helpers below`  
`import { getJson as _getJson, putJson as _putJson } from "../io";`  
`import type { KelService, KelEvent, Crypto, KelEnvelope } from "../services/kel";`  
`import type { Transport } from "../transport";`

`const enc = new TextEncoder();`  
`const dec = new TextDecoder();`

`export interface RotateKeysDeps {`  
  `clock: () => string;`  
  `stores: { index: KeyValueStore; kels: KeyValueStore; };`  
  `kel: KelService;`  
  `transport: Transport;`  
  `crypto: Crypto; // initiator`  
  `// Maps prior.k[] pubs to AIDs and keyIndex positions`  
  `resolveCosigners: (prior: KelEvent) => Promise<Array<{ aid: AID; keyIndex: number; pub: string }>>;`  
  `appendKelEnv: (store: KeyValueStore, env: KelEnvelope) => Promise<void>;`  
`}`

`export function makeRotateKeys(deps: RotateKeysDeps) {`  
  `const getJson = <T,>(s: KeyValueStore, id: string) => _getJson<T>(s, id);`  
  `const putJson = (s: KeyValueStore, id: string, v: any) => _putJson(s, id, v);`

  `return async function rotateKeys(controllerAid: AID, prior: KelEvent, opts?: {`  
    `newKeys?: string[];`  
    `newThreshold?: number;`  
    `nextKeys?: string[];`  
    `nextThreshold?: number;`  
    `deadlineMs?: number;`  
    `note?: string;`  
  `}): Promise<RotationHandle> {`

    `const now = deps.clock();`

    `// Reveal set and next-commit set`  
    `const revealK = opts?.newKeys ?? deps.crypto.pubKeys();`  
    `const revealKt = opts?.newThreshold ?? deps.crypto.threshold();`

    `const next = (opts?.nextKeys && opts?.nextThreshold)`  
      `? { nextKeys: opts.nextKeys, nextThreshold: opts.nextThreshold }`  
      `: deps.crypto.nextCommit();`

    `// Build rot candidate (unsigned)`  
    `const rotEvent = deps.kel.rotate({`  
      `controller: controllerAid,`  
      `prior,`  
      `k: revealK,`  
      `kt: revealKt,`  
      `nextK: next.nextKeys,`  
      `nt: next.nextThreshold,`  
      `dt: now,`  
    `});`

    `// Enforce reveal == prior.n`  
    `const revealSaid = deps.kel.saidOfKeyset(rotEvent.k!, deps.kel.decodeThreshold(rotEvent.kt!));`  
    `if (revealSaid !== prior.n) throw new Error("Reveal does not match prior commitment");`

    `// Proposal id — SAID of canonical rot body (or SAID of a proposal doc)`  
    `const rotationId: RotationId = deps.kel.saidOf(rotEvent);`

    `const priorKt = deps.kel.decodeThreshold(prior.kt!);`  
    `const cosigners = await deps.resolveCosigners(prior);`

    `const proposal: RotationProposal = {`  
      `typ: "keri.rot.proposal.v1",`  
      `rotationId,`  
      `controller: controllerAid,`  
      `priorEvent: prior.d,`  
      `priorKeys: prior.k!,`  
      `priorThreshold: priorKt,`  
      `reveal: {`  
        `newKeys: revealK,`  
        `newThreshold: revealKt,`  
        `nextCommit: { n: rotEvent.n!, nt: deps.kel.decodeThreshold(rotEvent.nt!) },`  
      `},`  
      `deadline: opts?.deadlineMs ? new Date(Date.now() + opts.deadlineMs).toISOString() : undefined,`  
      `note: opts?.note,`  
    `};`

    ``const docKey = `rotation:${rotationId}`;``  
    `const status0: RotationStatus = {`  
      `id: rotationId, controller: controllerAid, phase: "proposed",`  
      `createdAt: now, deadline: proposal.deadline,`  
      `required: priorKt, totalKeys: prior.k!.length, collected: 0,`  
      `missing: priorKt,`  
      `signers: cosigners.map(c => ({ aid: c.aid, keyIndex: c.keyIndex, required: true, signed: false })),`  
      `priorEvent: prior.d, revealCommit: revealSaid,`  
      `nextThreshold: deps.kel.decodeThreshold(rotEvent.nt!)`  
    `};`

    `await putJson(deps.stores.index, docKey, status0);`

    `// Broadcast proposal`  
    `const body = enc.encode(JSON.stringify(proposal));`  
    `for (const s of status0.signers) {`  
      `await deps.transport.send({`  
        `id: rotationId, from: controllerAid, to: s.aid,`  
        `typ: "keri.rot.proposal.v1", body, dt: now`  
      `});`  
    `}`

    `// Progress events`  
    `const listeners = new Set<(e: RotationProgressEvent) => void>();`  
    `const onProgress = (e: RotationProgressEvent) => listeners.forEach(fn => fn(e));`

    `// Subscribe for signatures`  
    `const unsub = deps.transport.channel(controllerAid).subscribe(async (m) => {`  
      `if (m.typ !== "keri.rot.sign.v1") return;`  
      `const msg = JSON.parse(dec.decode(m.body)) as RotationSign;`  
      `if (msg.rotationId !== rotationId) return;`

      `const status = await getJson<RotationStatus>(deps.stores.index, docKey);`  
      `if (!status || status.phase === "finalized" || status.phase === "aborted" || status.phase === "failed") return;`

      `const signer = status.signers.find(s => s.keyIndex === msg.keyIndex);`  
      `if (!signer) return;`

      `if (!msg.ok) {`  
        `onProgress({ type: "signature:rejected", rotationId, payload: msg });`  
        `return;`  
      `}`

      `// Verify signature over canonical rot bytes using PRIOR key`  
      `const canon = deps.kel.canonicalBytes(rotEvent);`  
      `const pub = prior.k![msg.keyIndex];`  
      `const ok = await deps.crypto.verify(canon, msg.sig, pub);`  
      `if (!ok) {`  
        `onProgress({ type: "error", rotationId, payload: "bad signature" });`  
        `return;`  
      `}`

      `if (!signer.signed) {`  
        `signer.signed = true;`  
        `signer.signature = msg.sig;`  
        `signer.seenAt = deps.clock();`  
        `status.collected = status.signers.filter(s => s.signed && s.required).length;`  
        `status.missing = Math.max(0, status.required - status.collected);`  
        `status.phase = status.collected >= status.required ? "finalizable" : "collecting";`  
        `await putJson(deps.stores.index, docKey, status);`  
        `onProgress({ type: "signature:accepted", rotationId, payload: { keyIndex: msg.keyIndex } });`  
        `if (status.phase === "finalizable") onProgress({ type: "status:phase", rotationId, payload: "finalizable" });`  
      `}`  
    `});`

    `async function tryFinalize(): Promise<RotationStatus> {`  
      `const status = await getJson<RotationStatus>(deps.stores.index, docKey);`  
      `if (!status) throw new Error("rotation missing");`  
      `if (status.phase !== "finalizable") return status;`

      `// Initiator signs with PRIOR key index it controls`  
      `const env = await deps.kel.sign(rotEvent, deps.crypto);`

      `// Publish rot to store`  
      `await deps.appendKelEnv(deps.stores.kels, env);`

      `// Notify finalize (optional broadcast to all cosigners)`  
      `const fin: RotationFinalize = { typ: "keri.rot.finalize.v1", rotationId, rotEventSaid: rotEvent.d };`  
      `await deps.transport.send({`  
        `id: rotationId, from: controllerAid, to: controllerAid,`  
        `typ: "keri.rot.finalize.v1", body: enc.encode(JSON.stringify(fin)), dt: deps.clock()`  
      `});`

      `status.phase = "finalized";`  
      `await putJson(deps.stores.index, docKey, status);`  
      `onProgress({ type: "finalized", rotationId, payload: { rot: rotEvent.d } });`  
      `unsub();`  
      `return status;`  
    `}`

    `const handle: RotationHandle = {`  
      `async awaitAll(opts) {`  
        `const timeoutMs = opts?.timeoutMs ?? 7 * 24 * 3600_000;`  
        `const start = Date.now();`  
        `while (Date.now() - start < timeoutMs) {`  
          `const s = await tryFinalize();`  
          `if (s.phase === "finalized" || s.phase === "aborted" || s.phase === "failed") {`  
            ``if (opts?.throwOnFail && s.phase !== "finalized") throw new Error(`rotation ${s.phase}`);``  
            `return s;`  
          `}`  
          `await new Promise(r => setTimeout(r, 1200));`  
        `}`  
        `const cur = await getJson<RotationStatus>(deps.stores.index, docKey);`  
        `if (cur) {`  
          `cur.phase = "failed";`  
          `await putJson(deps.stores.index, docKey, cur);`  
          `if (opts?.throwOnFail) throw new Error("rotation timed out");`  
          `return cur;`  
        `}`  
        `throw new Error("rotation missing");`  
      `},`  
      `async status() {`  
        `const s = await getJson<RotationStatus>(deps.stores.index, docKey);`  
        `if (!s) throw new Error("rotation missing");`  
        `return s;`  
      `},`  
      `async abort(reason) {`  
        `const s = await getJson<RotationStatus>(deps.stores.index, docKey);`  
        `if (!s) return;`  
        `s.phase = "aborted";`  
        `await putJson(deps.stores.index, docKey, s);`  
        `const abort: RotationAbort = { typ: "keri.rot.abort.v1", rotationId, reason };`  
        `await deps.transport.send({`  
          `id: rotationId, from: controllerAid, to: controllerAid,`  
          `typ: "keri.rot.abort.v1", body: enc.encode(JSON.stringify(abort)), dt: deps.clock()`  
        `});`  
        `onProgress({ type: "aborted", rotationId, payload: { reason } });`  
        `unsub();`  
      `},`  
      `onProgress(handler) { listeners.add(handler); return () => listeners.delete(handler); }`  
    `};`

    `return handle;`  
  `};`  
`}`

---

# **`src/kerits.ts`**

`// src/kerits.ts`  
`import type { KeyValueStore } from "./io";`  
`import { namespace } from "./io";`  
`import type { Transport } from "./transport";`  
`import type { AID, RotationHandle } from "./types";`  
`import type { KelService, KelEvent, Crypto, KelEnvelope } from "./services/kel";`  
`import { makeRotateKeys } from "./rotation/rotateKeys";`

`export interface KeritsDeps {`  
  `hasher: { saidOf(data: Uint8Array): string };`  
  `kel: KelService;`  
  `tel: any; // not needed for rotation wiring here`  
  `cryptoFactory: (aid: AID) => Crypto;`  
  `clock: () => string;`  
  `resolveCosignerAIDs: (prior: KelEvent) => Promise<Array<{ aid: AID; keyIndex: number; pub: string }>>;`  
  `appendKelEnv: (store: KeyValueStore, env: KelEnvelope) => Promise<void>;`  
`}`

`export interface KeritsStores {`  
  `root: KeyValueStore;`  
  `kels?: KeyValueStore;`  
  `index?: KeyValueStore;`  
`}`

`export interface KeritsAPI {`  
  `createAccount(alias: string): Promise<AccountAPI>;`  
  `getAccount(aliasOrAid: string): Promise<AccountAPI>;`  
  `accounts(): Promise<AccountAPI[]>;`  
`}`

`export interface AccountAPI {`  
  `aid(): AID;`  
  `alias(): string;`

  `kel(): Promise<KelEvent[]>;`

  `rotateKeys(opts?: {`  
    `newKeys?: string[];`  
    `newThreshold?: number;`  
    `nextKeys?: string[];`  
    `nextThreshold?: number;`  
    `deadlineMs?: number;`  
    `note?: string;`  
  `}): Promise<RotationHandle>;`  
`}`

`export function kerits(`  
  `stores: KeritsStores,`  
  `transport: Transport,`  
  `deps: KeritsDeps`  
`): KeritsAPI {`

  `const kels = stores.kels ?? namespace(stores.root, "kels");`  
  `const index = stores.index ?? namespace(stores.root, "index");`

  `// Very simple account registry (alias -> AID JSON)`  
  `async function saveAccount(alias: string, aid: AID) {`  
    ``await index.put(`acct:${alias}`, new TextEncoder().encode(JSON.stringify(aid)));``  
  `}`  
  `async function loadAccount(aliasOrAid: string): Promise<AID> {`  
    `if (aliasOrAid.startsWith("E")) return { uri: aliasOrAid };`  
    ``const b = await index.get(`acct:${aliasOrAid}`);``  
    `if (!b) throw new Error("account not found");`  
    `return JSON.parse(new TextDecoder().decode(b)) as AID;`  
  `}`

  `// Dummy KEL persistence helpers (adapt to your layout)`  
  `async function readKel(aid: AID): Promise<KelEvent[]> {`  
    ``const b = await kels.get(`kel:${aid.uri}`);``  
    `if (!b) return [];`  
    `return JSON.parse(new TextDecoder().decode(b)) as KelEvent[];`  
  `}`  
  `async function writeKel(aid: AID, events: KelEvent[]) {`  
    ``await kels.put(`kel:${aid.uri}`, new TextEncoder().encode(JSON.stringify(events)));``  
  `}`

  `async function appendKelEnv(store: KeyValueStore, env: KelEnvelope) {`  
    `const aid = env.event.i;`  
    `const existing = await readKel(aid);`  
    `await writeKel(aid, [...existing, env.event]);`  
    `// (Optionally persist signatures trail elsewhere)`  
  `}`

  `const rotateKeysFactory = (aid: AID, prior: KelEvent) =>`  
    `makeRotateKeys({`  
      `clock: deps.clock,`  
      `stores: { index, kels },`  
      `kel: deps.kel,`  
      `transport,`  
      `crypto: deps.cryptoFactory(aid),`  
      `resolveCosigners: deps.resolveCosignerAIDs,`  
      `appendKelEnv,`  
    `});`

  `async function createAccount(alias: string): Promise<AccountAPI> {`  
    `const aid = { uri: "E" + alias }; // Replace with real inception flow`  
    `await saveAccount(alias, aid);`  
    `// If you want: perform real kel.incept + persist`  
    `return accountAPI(aid, alias);`  
  `}`

  `function accountAPI(aid: AID, alias: string): AccountAPI {`  
    `return {`  
      `aid: () => aid,`  
      `alias: () => alias,`

      `async kel() { return readKel(aid); },`

      `async rotateKeys(opts) {`  
        `const events = await readKel(aid);`  
        `const prior = events.at(-1);`  
        `if (!prior) throw new Error("no prior KEL event to rotate from");`  
        `return rotateKeysFactory(aid, prior!)(aid, prior!, opts);`  
      `},`  
    `};`  
  `}`

  `return {`  
    `async createAccount(alias) { return createAccount(alias); },`  
    `async getAccount(aliasOrAid) {`  
      `const aid = await loadAccount(aliasOrAid);`  
      `// look up alias back (optional)`  
      `return accountAPI(aid, aliasOrAid.startsWith("E") ? aid.uri : aliasOrAid);`  
    `},`  
    `async accounts() {`  
      `const keys = (await index.listKeys?.("acct:")) ?? [];`  
      `return Promise.all(keys.map(async k => {`  
        `const alias = k.replace(/^acct:/, "");`  
        `const aid = await loadAccount(alias);`  
        `return accountAPI(aid, alias);`  
      `}));`  
    `},`  
  `};`  
`}`

---

# **How to wire it (example)**

`import { memoryStore, namespace } from "./io";`  
`import { memoryTransport } from "./transport";`  
`import { kerits } from "./kerits";`

`// Your concrete KelService & Crypto impls`  
`import { kelServiceDefault } from "./impl/kelServiceDefault";`  
`import { cryptoFactoryDefault } from "./impl/cryptoDefault";`

`// Dependency wiring`  
`const root = memoryStore();`  
`const transport = memoryTransport();`

`const api = kerits(`  
  `{ root, kels: namespace(root, "kels"), index: namespace(root, "index") },`  
  `transport,`  
  `{`  
    `hasher: { saidOf: (b) => "E..." }, // wire your SAID`  
    `kel: kelServiceDefault,`  
    `tel: {}, // not used here`  
    `cryptoFactory: cryptoFactoryDefault,`  
    `clock: () => new Date().toISOString(),`  
    `resolveCosignerAIDs: async (prior) =>`  
      ``(prior.k ?? []).map((pub, idx) => ({ aid: { uri: `E-cosigner-${idx}` }, keyIndex: idx, pub })),``  
    `appendKelEnv: async (store, env) => {`  
      `// This is shadowed in kerits.ts already; you can keep either.`  
      `// Left here to show extensibility (e.g., separate signature trails).`  
    `},`  
  `}`  
`);`

`// Use it`  
`(async () => {`  
  `const a = await api.createAccount("dave");`  
  `// Ensure there is a prior KEL event; in a real app you will create inception first`  
  `// await a.incept(...)`

  `// Start rotation (will remain collecting until cosigners sign)`  
  `const handle = await a.rotateKeys({ note: "quarterly rotation" });`  
  `handle.onProgress(e => console.log("progress", e.type, e.payload));`

  `// elsewhere: cosigners receive proposal over transport and reply with RotationSign`  
`})();`

---

## **Notes & where to plug your existing code**

* **`kelServiceDefault`**: plug your current event building, SAID, canonicalization, and signature verification logic into the `KelService` interface in `services/kel.ts`.

* **`cryptoFactoryDefault(aid)`**: return a `Crypto` that knows how to sign/verify with that account’s *prior* key set and expose `(pubKeys, threshold, nextCommit)`.

* **Persistence**: Adjust `readKel/writeKel/appendKelEnv` to your preferred layout (per-AID files, per-event files keyed by SAID, etc.).

* **Transport**: The `memoryTransport()` works. Swap in WS/Convex/etc by implementing the same interface.

