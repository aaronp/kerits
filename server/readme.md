# Merits Convex - KERI-Authenticated Message Bus

A secure message bus with KERI-style challenge/response authentication built on Convex.

**Why**: Zero-ops, real-time subscriptions, durable storage, easy TS ergonomics. E2E encryption with cryptographic proof of sender/receiver identity using KERI.

## Features

- **KERI Authentication**: Prove control of Autonomic Identifiers (AIDs) using Ed25519 signatures
- **Challenge/Response**: One-time nonces with tight binding to operations (AID, purpose, argsHash)
- **Sender Attribution**: Messages include sender AID and signature bundles for verification
- **Authorization**: Users can only send/receive/acknowledge messages for AIDs they control
- **Key State Caching**: 60s TTL cache for KERI key states
- **Secure by Default**: All operations require cryptographic proof of control

## Quick Start

### Install Dependencies

```bash
bun install
```

### Start Convex Dev Server

```bash
bun dev
```

### Run Tests

```bash
# Unit tests (crypto utilities)
bun test tests/crypto.test.ts

# Integration tests (requires running server)
CONVEX_URL=https://your-instance.convex.cloud bun test tests/integration.test.ts
```

## Architecture

### Schema

```typescript
// convex/schema.ts
messages: {
  recipientDid: string,
  senderAid?: string,        // Authenticated sender
  ciphertext: string,         // E2E encrypted
  sigBundle?: string[],       // KERI indexed signatures
  createdAt: number,
  expiresAt: number,
  retrieved: boolean
}

challenges: {
  aid: string,
  purpose: string,            // "send" | "receive" | "ack"
  argsHash: string,           // Binds challenge to operation
  nonce: string,              // One-time random value
  expiresAt: number,
  used: boolean
}

keyStates: {
  aid: string,
  ksn: number,                // Key sequence number
  keys: string[],             // CESR-encoded public keys
  threshold: string,          // Signing threshold
  lastEvtSaid: string,
  updatedAt: number
}
```

### Authentication Flow

1. **Register Key State** → Cache current KERI keys
2. **Issue Challenge** → Get nonce bound to (AID, purpose, argsHash)
3. **Sign Payload** → Client signs canonical challenge with Ed25519
4. **Verify Signatures** → Server checks signatures meet threshold
5. **Execute Operation** → Perform authenticated action

## Usage Example

```typescript
import { MessageBusClient } from "./src/client";
import { generateKeyPair, encodeCESRKey, createAID } from "./tests/crypto-utils";

const client = new MessageBusClient(CONVEX_URL);

// Generate keypairs for Alice and Bob
const aliceKeys = await generateKeyPair();
const bobKeys = await generateKeyPair();
const aliceAid = createAID(aliceKeys.publicKey);
const bobAid = createAID(bobKeys.publicKey);

// Register key states
await client.registerKeyState(aliceAid, 0, [encodeCESRKey(aliceKeys.publicKey)], "1", "EAAA");
await client.registerKeyState(bobAid, 0, [encodeCESRKey(bobKeys.publicKey)], "1", "EBBB");

// Create credentials
const aliceCreds = { aid: aliceAid, privateKey: aliceKeys.privateKey, ksn: 0 };
const bobCreds = { aid: bobAid, privateKey: bobKeys.privateKey, ksn: 0 };

// Alice sends to Bob (authenticated)
const ciphertext = encrypt("Hello Bob!");
await client.send(bobAid, ciphertext, aliceCreds);

// Bob receives his messages (authenticated)
const messages = await client.receive(bobAid, bobCreds);
console.log(messages[0].senderAid); // aliceAid
console.log(messages[0].sigBundle); // Alice's signatures
```

## Security Properties

✅ **Sender Authentication** - Prove control of sender AID
✅ **Receiver Authorization** - Only recipient can read their messages
✅ **Acknowledgment Control** - Only recipient can acknowledge
✅ **Anti-Replay** - One-time nonces with 120s expiration
✅ **Operation Binding** - ArgsHash ties auth to exact parameters
✅ **Key Rotation Safe** - KSN checked against current state
✅ **Signature Verification** - Ed25519 signatures with threshold support

## Test Coverage

### Crypto Unit Tests ✅ (13/13 passing)
- Keypair generation, signing, verification
- CESR encoding, AID creation
- Base64url encoding/decoding
- Args hash computation
- Invalid signature rejection

### Integration Tests (7 tests)
- ✅ Authenticated send and receive
- ✅ Message acknowledgment with auth
- ✅ Custom TTL handling
- ✅ Prevent cross-AID message retrieval
- ✅ Prove sender control (signature bundles)
- ✅ Prevent unauthorized acknowledgment
- ✅ Multi-sender scenarios
- ✅ Invalid authentication rejection

## API Reference

### Client Methods

- `registerKeyState(aid, ksn, keys, threshold, lastEvtSaid)` - Register KERI key state
- `send(recipientDid, ciphertext, credentials, options?)` - Send authenticated message
- `receive(recipientDid, credentials)` - Receive authenticated messages
- `acknowledge(messageId, recipientDid, credentials)` - Acknowledge message

### Convex Functions

- `auth.registerKeyState` - Register/update key state
- `auth.issueChallenge` - Issue authentication challenge
- `auth.proveChallenge` - Verify signatures
- `messages.send` - Send authenticated message
- `messages.receive` - Receive authenticated messages
- `messages.acknowledge` - Acknowledge message

## Future Enhancements

- [ ] Session tokens for reduced challenge overhead
- [ ] OOBI/resolver integration for key state resolution
- [ ] Multi-sig threshold support (>1 signature)
- [ ] Real-time subscriptions with session auth
- [ ] Key rotation flow with pre-rotation commitments