# Phase 1:

Design, build and test the core data structures and functionality in [model](./model.md) as a foundation


# Phase 2:

Design, build and test the solid KERI operations for operating on KELs, TELs, ACDCs and Schemas.

I would like to follow a similar approach to the 's' pimped operation in [keri.ts](../types/keri.ts) for working with strings such as 'asAID()' and do the same for controllers (i.e. Operations on key event logs, or 'KELs'), transaction event logs or 'TELs', and Authentic Chained Data Contains (ACDCs)).

These functions will be pure data transformations written in a functional style, such as:

```ts
// users may keep their private keys in any number of places. We provide convenience methods
// for getting/saving them locally, however
const identity =  ... // user's private KeyPair

// they can now rotate their logs. This is essentially the business-logic operations working on the data:
// 
// verifying the identity controls this kelLog, checking for required witnesses, etc.
// it doesn't actually do any IO (read or write any data), but returns a referentially transparent 
// result in a purely functional way to represent the outcome of rotating keys.
//
// in the event the KEL only required a single signer, the result may be an ammended KEL log we
// could then write down (save to disk) and notify others about (i.e. publish to an OOBI service)
//
// in the event of it requiring other signers (witnesses) for a multi-sig account the result would 
// be the messages needed to send to those other AIDs to sign.
//
// the 'RotateResult' would be a strongly typed result type - likely a union type, which could then
// be actioned as per above.
//
const rotateResult = kel(kelLog).rotateKeys(identity)



//
// here is some pseudo-code for what it might look like if the rotateResult contained
// events required to notify witness controllers.
//
// there would be some type 'WitnessEvent', with a static factory method which takes
// a RotateResult and returns an array of 'WitnessEvent's parsed from that result
//
const witnessEvents = WitnessEvent.fromEvent(rotateResult)

if (witnessEvents.length() > 0) {
     
   // some factory method which uses environment config to return an instance of a MessageBus
   const transport = await MessageBus.create() 

   // actually performs the network IO - enqueues messages
   const sendResult = await transport.sendAll(witnessEvents)

   // The sendAll would return some kind of rich 'Broadcast' type which we could 
   // interrogate for the status, or call "awaitAll()" to wait for all receipts, etc.
   //
   // in reality, this may be impractical, as the transport is sending messages in any number
   // of ways -- it could even be an email to recipients, taking days to respond
   // 
   // it could also be other software systems listening to a web socket, however, and take just milliseconds
   //
   // the context matters, so we'll continue with this example, assuming calling 'awaitAll()' is sensible
   const signatures = await sendResult.awaitAll()

   // this follows our 'pimped type' pattern, applying operations to data
   // here we assume some elements of the RotateResult (in the case of requiring signatures)
   // are able to now create a new KelEvent
   const updatedKel = RotateResult(rotateResult).applySignatures(signatures)

   const newKel = kel(updatedKel).updateWith(updatedKel)
   if (newKel.success) {
     // persist 
     const db = KeritsDB.get() // again, taken from context in a 12 factor app way.
     db.updateKel(newKel.data)

     // update the places we publish our KEL
     await transport.notifyOOBI(newKel.data)

   }
}
```


We should be able to follow a similar approach when working with TELs, ACDCs and Schemas.

For example, with Schemas, we may have a 'Data' object:
```ts

const someJson = {
    arbitrary: true,
    json : "yes", 
    numbers : [1,2,3]
}

const d8a = Data.fromJson(someJson)
const schemaData = d8a.schema("My Data", "about me") // derive the schema, providing a title and description

const errors = Schema(schemaData).validate(someJson) 
if (errors.length() > 0) {
    // show the rich validation errors
}

const saidifiedData = d8a.saidified() // returns the data with an "$d" id field (as default), but could allow an explicit field name, such as: d8a.saidified("my-id")


```


The point of this phase is to ensure we have a strong foundation of keri data representations (already started in [types.ts](../types/keri.ts)) which is well tested, with good test-case examples, and kept separate from any side-effecting IO operations (disk or network concerns).

# Phase 3: Unify the IO interfaces

We have some existing 'KV' (key value) abstractions, a message bus, etc.

Here we want to analyse the codebase, and come up with good interfaces we can use at the right level of abstraction to be able to actually send notifications, write things to permanent storage, etc

We can hopefully provide adapters or re-use what we already have, just behind cleaner 'IO' interfaces in kerits `./src/io/*`.

We'll use an in-memory implementation for many integration tests to handle high-level application flows, allowing different user personas to "message" each other by just keeping them in memory behind an IO interface.


# Phase 3: Applications

At this point, we should have a strong foundation for modeling data for a number of use-cases.

We should provide a higher-level API on those use-cases, backed by our data models.

We'll want a directory of 'examples' which showcase:

1. modeling a social network. People adding contacts into groups, and creating and updating sub-groups, and adding information about the people in those groups (e.g. contact information, things they've agreed to, etc). That "information" associated with our contacts will be data associated with a particular schema (which will thus have its own SAID). At the application layer, we can use our relationships TELs to answer "what other nodes do I have for this schema" -- or put a more practical way, "who in my contacts do I have a data for who has a 'first name' schema?"

2. Creating multi-sig accounts -  ad-hoc identities for other controllers, demonstrating the foundation for organisational structures, "bots", plugins, etc.  Much of this logic should already be there and proven in phase 1.


