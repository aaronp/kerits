# Model

This model describes how we can leverage SAIDs and our keri schemas work to ensure we have a SAID (unique ID) representing all of our core data structures.

We should be sure to follow the [KERI specification](./reference.md) any time we're not sure what to do.

This also should let us easily store these as ACDCs if we need to (but we don't have to). Ultimately that would just be an implementation detail behind some clean, simple APIs.


## Note: We keep as much as possible a purely functional, immutable, referentially transparent approach - saving the actual IO operations (reading and writing data, notifying users, sending or receiving messages) to small IO interfaces on 'the edge'

Our operations follow this kind of simple 'pimped string' pattern:

```ts
export type SAID = string & { readonly __brand: 'SAID' }
export type AID = string & { readonly __brand: 'AID' }
export type ALIAS = string & { readonly __brand: 'ALIAS' }
export function s(str: string) {
  return {
    asAID: (): AID => str as AID,
    asSAID: (): SAID => str as SAID,
    asALIAS: (): ALIAS => str as ALIAS,
  };
}
```

## Layout
 ./src/model/types.ts <-- common types (SAID, AID, PublicKey, etc)

 ./src/model/keys/keys.ts <-- `Keys` is able to generate keys from mnumonics, seesds, validate signatures, etc

 ./src/model/kel/types.ts <-- kel types (e.g. KelEvent)
 ./src/model/kel/kel-ops.ts <-- operations on Kel data events (purely functional/referentially transparent operations which return pure data types representing actions such as 'notify' events)
 
 ./src/model/tel/types.ts <-- kel types (e.g. TelEvent)
 ./src/model/tel/tel-ops.ts <-- operations on tel data

 ./src/model/acdc/types.ts <-- kel types (e.g. TelEvent)
 ./src/model/acdc/acdc-ops.ts <-- operations on tel data

 ./src/model/data/data.ts <-- schema types, and a 'Data' object for working with json (e.g. Data(someJson).schema(), Data(someJson).saidify(), const diffs = Data(someJson).validate(schema))'

 ./src/model/io/db.ts <-- simple interface for a key-value store - for reading and writing values by a key. We can have one per keri type (e.g. kel, tel, acdc, schemas, etc), or just `const someDb = DB.disk('/path/to/storage')` or `const mem - DB.inMemory()`

 ./src/model/transport/transport.ts <-- contains interfaces for sending and receiving messages

## Core Data Structures

### Data Operations
All arbitrary data can be wrapped with SAIDs using our Data operations:
```typescript
const data = Data.fromJson({ name: "John", age: 30 });
const saidified = data.saidified(); // Adds SAID field
const schema = data.schema("Person", "Basic person info");
```

### SAID Associations (Multi-map)
A generic directional multi-map for SAID relationships:
```typescript
// A references B, C, D
associations.set(saidA, [saidB, saidC, saidD]);

// Query: what does A reference?
associations.get(saidA) // [saidB, saidC, saidD]

// Query: what references B? (reverse lookup)
associations.getReverse(saidB) // [saidA, saidE]
```

This enables complex queries like "what entities reference this schema?" and supports tree structures, attributes, and network modeling.

## Contacts

Contacts are represented as AIDs (unique IDs). 
My contacts are just literally a set of unique IDs [abc, 123, xyz].

## Groups

Groups are just collections of those IDs. 

Groups should be modelled as TELs (they have a unique ID based on their inception event), and their membership is just the list of IDs contained in that group. We treat the "latest" (most recent) entry in that group as the "winner". 

E.g., group "foo" (where 'foo' is just an alias for the TEL Id), may start with the membership at seq 0 with value [].
We then append to that TEL to have seq no 1 to be [x,y], seq no 2 to be [x,b], showing that group 'foo' currently has membership [x,b]

**Group membership changes are additive (append-only)**. TELs are like ad-hoc blockchains - we always maintain the full lineage, and the actual data structures depend on the use-case.

## Aliases

Aliases are just bidirectional associations of friendly names against IDs.

These are modeled in a similar way as groups, where we can have any number of alias TELs, which give us a kind of 'namespaces'.

My 'friends' aliases might map nicknames against contact IDs - things like "booger" or "stinky" are associated with contact IDs (and those contact IDs map back to the names).

This map is just another data structure where the 'latest' in the TEL is the current representation.

Because these are just mappings of names to IDs, I can have a base 'aliases' TEL which maps aliases of TELs to their names (e.g. 'friends', 'colleagues', 'group-A')

## Networks and Attributes modeled as Relationships

We want to map relationships as associations of SAIDs. For any given SAID, we can get the array of SAIDs associated with that Id.

Because all data is represented by SAIDs, this will allow us to:

1. association other arbitrary data against a SAID (e.g. contact details, messages, notes). This allows us to build up data as we discover it about any entity.

2. model tree structures. e.g., parent nodes are one-to-many associations of a node to a child. We can model cyclic relationships with the same one-to-many relationship, but call that "parents" rather than "children". In a practical sense, this can allow us to map out networks (groups of groups ..)

## Enhanced KEL Operations

KEL operations provide comprehensive key management, verification, and CESR conversion:

### Key Lineage Tracking
```typescript
// Track complete public key history throughout KEL lifecycle
const lineage = kel.getKeyLineage();
// Returns: [{ sequence: "0", eventType: "icp", currentKeys: [...], threshold: "1" }, ...]
```

### Event History Verification
```typescript
// Prove only key holders could append events to the KEL
const verificationResult = await kel.verifyEventHistory(signingKeys);
// Returns: { isValid: boolean, verifiedEvents: number, totalEvents: number, errors: string[] }
```

### CESR Conversion
```typescript
// Convert KEL to CESR format for transmission/storage
const cesrData = kel.toCESR();

// Reconstruct KEL from CESR format
const reconstructedKel = KEL.fromCESR(cesrData.data!, aid);
```

### Real Cryptographic Operations
```typescript
// Use actual key generation and signing (not mocks)
const keys = await Keys.createForInception();
const kel = await kel(aid).inceptionWithGeneratedKeys();

// Sign arbitrary data with current KEL keys
const signature = await kel.signData(documentData, signingKeys);

// Verify signatures using KEL public keys
const isValid = await kel.verifySignature(documentData, signature.data!);
```

## Functional Operations Pattern

All operations follow a pure functional approach with fluent APIs:

```typescript
// For KELs - enhanced with real cryptography
const result = await kel(aid).inceptionWithGeneratedKeys();
const rotateResult = await kel.rotateKeysForSingleOwner();

// For TELs  
const result = tel(telData).appendEvent(newEvent);

// For ACDCs
const result = acdc(acdcData).validate();

// For Data
const result = data(jsonData).saidified();
```

Each operation returns a result object that can be inspected for success/failure and contains the transformed data.