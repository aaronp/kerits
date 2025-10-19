```
src/
  model/                 // PURE domain (deterministic, referentially transparent)
    types.ts            // SAID, AID, ALIAS, Result, Effect, etc
    said/
      codec.ts          // SAID algorithms, stable canon, versioning
    data/
      data.ts           // Data.fromJson, saidified, schema, validate
      schema.ts         // JSON Schema helpers, SAIDed schema objects
      associations.ts   // Directed multi-map (forward + reverse indexes)
    kel/
      types.ts          // KEL events, state, seals
      kel-ops.ts        // pure KEL transforms: icp/rot/ixn, lineage, verify, to/from CESR
      verify.ts         // replay & validation logic (deterministic)
    tel/
      types.ts
      tel-ops.ts        // append-only sequences, conflict rules, “winner = highest seq”
    acdc/
      types.ts
      acdc-ops.ts       // pack/unpack, attach proofs, anchor in KEL/TEL
  io/                    // EDGES / SIDE EFFECTS (drivers + adapters)
    db.ts               // DB interface (KV), mem/disk adapters
    transport.ts        // MessageBus interface + adapters (ws/email/convex/etc)
    crypto.ts           // Keys interface (keygen, sign/verify) with adapters (noble/WebAuthn)
    cesr.ts             // encode/decode bindings (implementation adapter)
  apps/
    examples/           // runnable demos & integration tests (social graph, multisig, groups/aliases)

```

# Key rule: model/* can import only from model/*. No IO in the model. IO adapters depend on model.

