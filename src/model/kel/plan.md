At the moment our kel namespace has
 * [types.ts](./types.ts) - pure data structures for e.g. KeyEventLog 
 * [kel-opts](./kel-opts.ts) - pure operations on that data (e.g. creating instance of KelEvents with inceptions, etc)


There's also [rotation](./rotation/rotate-keys.ts) which contains the control flow logic for key rotations (and I intend to do the same for delegation) 

We also have base IO operations in ./src/model/io
 * [key-value-store.ts](./../io/key-value-store.ts) <- for reading/writing data 
 * [transport.ts](../io/transport.ts) <- for sending and receiving messages between controllers 
 * [oobiResolver.ts](../io/oobiResolver.ts) <- special case of key-value-store for looking up values (though that could be iterated on - see [kel-oobi.md](./docs/kel-oobi.md))
 
 These are largely disparate functions which I want to pull together behind a coherent API surface. 
 
 It should be necessary and sufficient to achieve the basic functionality in a user (controller) 
 
 ## Flow 1 - creating a new account
  * incepting a new account (two key pairs) <- pure data / crypto operations
  * storing those key pairs securely in storage (i.e. via my storage abstraction)
  * storing that event somewhere (using another storage key-value, using a CESR encoding)
  * publishing the new KEL somewhere (OOBI resolver), which may involve complex challenge/response sub-steps
  * store the 'alias' for that new AID somewhere (another key-value storage operation)
  * read it back -- read the 'alias' or 'AID' and get the KEL event
  * also resolve the OOBI where it was published and verify the integrity of the KEL
  
## Flow 2 - creating another account (multi-sig flow) 
 * as above, but anchoring the new account with an AID from step 1 
 
## Flow 3 - rotating the keys - single account
 * read the latest KEL from storage
 * optionally verify against the OOBI resolver
 * check the key threshold (in this case, 1)
 * create a new key pair
 * store the new key pair (see storage)
 * verify and store the new KEL event (seq no + 1) in CESR format in KEL storage
 * publish the OOBI update ... 
 

 # Guidance
 I'd like to continue in this way:
  * ensuring basic steps work end-to-end
  * have a coherent API for the high-level business operations, but not overcomplicate things
  * test and demonstrate each flow
  
Ideally it would be something like a kind of DI (or function composition) like:

```ts
const accountsApi = accounts(keyStorageImpl, kelStorageImpl, transportImpl)
const alice : AccountAPI = accountsApi.createAccount(alice) // other variations - optional parameters for first keys, etc
const result = alice.rotateKeys() // optional 'next key' param, otherwise generated and stored automatically
```