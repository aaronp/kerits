# Design

In designing 'kerits', the design is broken down into:


1. Purely functional core libraries which implement the KERI fundamentals -- a typescript port of keripy
2. High-level 'application' layer DSLs (domain-specific languages) for easily working with top-level user interactions:
  a. creating accounts, schemas, and registries
  b. issuing credentials, and accepting and revoking credentials
  c. verifying the signatures and integrity of the KERI components (KELs, TELs, etc)
  d. importing/exporting the KERI data
3. A clear abstraction of a stroage layer, powered by a Low-Level isolation the minimal functionality needed from a Key/Value store (KV) so that we can simply plug-in implementations such as an in-memory KV store, on-disk KV store, SQL database KV store, or browser IndexedDB store.


As much of this as possible should be purely functional and event (message) driven, so the same inputs produce the same outputs with minimal side-effects.


# 1. Core Libraries

These can be found [here](../src/).

The `make test` in the [Makefile](../Makefile) runs a regression test over json files representing function inputs and expected outputs.
This test suite can run in the existing keripy implementation and in kerits to ensure consistent implementations

# 2. Application DSLs

These are documented [here](./dsls.md). They encapsulate the top-level use actions which then drive the command-line interface, web UI, and future APIs

# 3. Storage Layer

KERI is very similar to [git](./github-analogy.md). We want a kind of "data access object" which captures the top-level storage concerns, but can then use a more primitive KV adapter so we have the flexibility of supporting local disk, memory, databases and web storage while the assurance provided from code reuse.

The storage designs are based on git designs, and the best way to understand them is with an on-disk represenation, which should be achievable with our storage abstraction plugged into a DiskKV store.


Example layout:
```
.keri/
  kel/EKEL...AID/
    HEAD
    E3x9...Q7a.icp.cesr
    EFz1...Wc2.rot.cesr
    log.index.json

  tel/ERegAAA.../
    HEAD
    EVCP...vcp.cesr
    EISS...iss.cesr

  acdc/EACDC...1.json
  schemas/ESchOver18...json

  refs/
    kel/me
    tel/default
    schema/over18
    tags/schema/over18@1.2.0
    remotes/alice/tel/default

  remotes/alice/
    meta.json
    oobi.json
    heads.json
    cursors.json

  xref/
    reg-to-acdcs.json
    acdc-to-issuer-holder.json
```

Top-Level:
```
.keri/
  kel/                # Key Event Logs; per-AID chains in the format {EVENT_SAID}.{type}.cesr, as well as a 'HEAD' file
  tel/                # Credential registries (Transferable Event Logs); per-registry chains
  acdc/               # ACDC containers (immutable JSON, by SAID)
  schemas/            # JSON Schemas (by SAID)
  refs/               # Git-like aliases/tags for human names → SAIDs
  remotes/            # Remote endpoints + sync cursors; small metadata only
  xref/               # Optional cross-reference accelerators (indexes)
```

## The KEL directory:
```
.keri/kel/{AID}/
  HEAD                         # SAID of latest KEL event (text)
  {EVENT_SAID}.icp.cesr        # icp event, CESR bytes
  {EVENT_SAID}.rot.cesr        # rot event, CESR bytes
  {EVENT_SAID}.ixn.cesr        # ixn event, CESR bytes
  log.index.json               # (optional) ordered SAID list + type map
```
Filenames are the event SAID; content is the CESR blob.

## Traversal
read HEAD, then follow p/sequence inside events backward.
Optionally read the log.index.json, which could be:
```json
{
  "order": ["E3x9...Q7a", "EFz1...Wc2", "EGy4...Dn6"],
  "types": { "E3x9...Q7a": "icp", "EFz1...Wc2": "rot", "EGy4...Dn6": "ixn" }
}
```

## TEL (per Registry SAID)

The top-level TEL layout is the similar to with KEL:
```
.keri/tel/{REGISTRY_SAID}/
  HEAD                         # SAID of latest TEL event (text) in the format {EVENT_SAID}.{type}.cesr, as well as a 'HEAD' file
  {EVENT_SAID}.vcp.cesr        # registry inception
  {EVENT_SAID}.est.cesr        # registry establishment/update
  {EVENT_SAID}.iss.cesr        # credential issuance anchor
  {EVENT_SAID}.rev.cesr        # revocation anchor
  {EVENT_SAID}.acp.cesr        # holder acceptance anchor (in holder's TEL)
  log.index.json               # (optional) ordered SAID list + type map
```


## ACDC & Schemas (content addressed)

```
.keri/acdc/{ACDC_SAID}.json     # immutable container, canonical serialization
.keri/schemas/{SCHEMA_SAID}.json # canonical schema JSON (used to compute SAID)
```

## Refs (aliases & tags; namespaced)
```
.keri/refs/
  kel/{alias}           # → AID (string)          # unique within 'kel'
  tel/{alias}           # → REGISTRY_SAID         # unique within 'tel'
  acdc/{alias}          # → ACDC_SAID             # unique within 'acdc'
  schema/{alias}        # → SCHEMA_SAID           # unique within 'schema'

  tags/
    kel/{tag}           # → KEL event SAID (pin)
    tel/{tag}           # → TEL event SAID (pin)
    acdc/{tag}          # → ACDC SAID (pin)
    schema/{tag}        # → SCHEMA SAID (pin)

  remotes/
    {remote}/
      kel/{alias}       # → remote AID
      tel/{alias}       # → remote REGISTRY_SAID
      acdc/{alias}      # → remote ACDC_SAID
      schema/{alias}    # → remote SCHEMA_SAID

```


## Remotes (metadata only; objects stored locally under same paths)

The file layout is:
```
.keri/remotes/{remote}/
  meta.json            # where/how to fetch; capabilities; auth
  oobi.json            # trust anchors and OOBI verification status
  heads.json           # last-known tips per imported chain
  cursors.json         # incremental sync cursor per chain

```

Example `meta.json`:
```json
{
  "name": "alice",
  "endpoint": "https://keria.alice.example",
  "capabilities": ["kel","tel","acdc","schema"],
  "auth": { "type": "none" },
  "created": "2025-10-07T18:45:00Z"
}
```


Example ```oobi.json```
```json
{
  "aid": "EALICEAIDSAID...",
  "oobis": ["https://keria.alice.example/oobi/EALICEAIDSAID..."],
  "verified": true,
  "verifiedAt": "2025-10-07T18:46:21Z"
}
```

Example ```heads.json```
```json
{
  "kel": { "EALICEAIDSAID...": "EHEADSAID..." },
  "tel": { "EREGALICE...": "EHEADTELSAID..." }
}
```

Example ```cursors.json```
```json
{
  "kel": { "EALICEAIDSAID...": "ELASTPULLEDEVEN..." },
  "tel": { "EREGALICE...": "ELASTPULLEDTEL..." }
}
```

Fetch flow: pull new events since cursors.json until reaching heads.json; verify; store under kel/*, tel/*, acdc/*, schemas/*; advance cursors; update heads if changed.


# Notes & rules
 * Immutability: filenames keyed by SAID; bytes must re-hash to same SAID.
 * HEAD update last: write event, update indexes, then set HEAD.
 * Alias scope: unique within namespace; overlaps across namespaces allowed.
 * Imports: remote objects are identical; only remotes/* and refs/remotes/* differ.
 * Verification on import: re-compute SAIDs; verify CESR parsing, signatures, and chain continuity before writing.
 * Recovery: if HEAD missing, rebuild from log.index.json or scan events by sequence.