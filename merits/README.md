# MERITS - KERI Credential REST API

Minimal, Stateless WebSocket API for KERI Clients (Bun + Elysia)

A tiny **relay** that lets KERI clients:
- **discover** counterparties by **AID**
- **establish a secure channel** by proving control of their **current AID key** and then negotiating **end-to-end encryption** (shape is client-defined)
- remain **un-opinionated** about application messages (the server routes opaque bytes only)

Server holds **no durable storage**; all presence lives **in memory**.

---

## 0) Principles

- **Stateless relay**: keeps only in-memory presence/session maps; restart loses presence.
- **Agnostic payloads**: server neither parses nor decrypts frames (`bytes` are opaque).
- **KERI-native identity proof**: client signs a server nonce with **current AID key** (`kelSeq` supplied); server *may* verify via OOBI/KEL (stubbed for dev).
- **Client-negotiated crypto**: clients do ECDH/AEAD handshake **inside** their exchanged bytes; server just relays.


---

## 1) HTTP (discovery / presence)

- `GET /aids` → **200**: list online AIDs  
  Returns:  
  ```ts
  type AidOnline = {
    aid: string           // AID (qb64)
    since: string         // ISO
    last: string          // ISO
    sessions: number      // concurrent sockets (devices/tabs)
    about?: any           // arbitrary self-published JSON (optional)
  }





# Development Principals

Follow Elysia 



## Installation

```bash
cd /Users/aaron/dev/sandbox/keripy/kerits/merits
bun install
```

## Usage

### Start Server

```bash
# Development mode (auto-reload)
make dev
# or
bun run dev

# Production mode
make start
# or
bun run start
```

Server runs on `http://localhost:3000`

### Test with curl

```bash
make test
```

Or manually:

```bash
curl http://localhost:3000/
curl http://localhost:3000/hello
curl http://localhost:3000/hello/Alice
```

### Use Eden Treaty Client

```bash
make client
# or
bun run client.ts
```

The Eden client provides full type safety:

```typescript
import { edenTreaty } from '@elysiajs/eden';
import type { App } from './index';

const client = edenTreaty<App>('http://localhost:3000');

// Type-safe API calls with autocomplete
const response = await client.hello.get();
console.log(response.data); // { message: string, timestamp: string }

const named = await client.hello({ name: 'Alice' }).get();
console.log(named.data); // { message: string, timestamp: string }
```

## Project Structure

```
merits/
├── index.ts          # Elysia server with routes
├── client.ts         # Eden Treaty client example
├── package.json      # Dependencies and scripts
├── Makefile          # Build targets
├── tsconfig.json     # TypeScript config
└── README.md         # This file
```

## Development

### Makefile Targets

```bash
make dev      # Run in development mode (auto-reload)
make start    # Run in production mode
make install  # Install dependencies
make clean    # Remove node_modules
make test     # Test endpoints with curl
make client   # Run Eden client test
make help     # Show all targets
```
