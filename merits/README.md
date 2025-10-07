# MERITS - KERI Credential REST API

REST API server for KERITS credential operations, built with Elysia and Eden Treaty for type-safe client-server communication.

## Overview

MERITS (KERI REST API Server) provides HTTP access to KERITS credential functionality. It uses Elysia for the server and Eden Treaty for type-safe client generation.

## Features

- ⚡ **Fast** - Built on Bun and Elysia (one of the fastest TypeScript frameworks)
- 🔒 **Type-safe** - End-to-end type safety with Eden Treaty
- 🎯 **Simple** - Clean, declarative API design
- 🔄 **Auto-reload** - Development mode with hot reloading
- 📦 **Zero config** - Works out of the box

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

### Available Endpoints

- `GET /` - Server info and status
- `GET /hello` - Simple hello message
- `GET /hello/:name` - Personalized hello

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

### Adding New Routes

```typescript
import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/your-route', () => {
    return { data: 'your response' };
  })
  .post('/your-post', ({ body }) => {
    return { received: body };
  })
  .listen(3000);

export type App = typeof app;
```

The client will automatically get types for new routes!

## Eden Treaty Benefits

1. **Full type inference** - No manual type definitions needed
2. **Autocomplete everywhere** - IDE knows all routes and responses
3. **Compile-time safety** - TypeScript catches API misuse
4. **Runtime validation** - Elysia validates requests automatically
5. **Zero overhead** - Types are erased at runtime

## Future Integration

This server will be extended to expose KERITS DSL functionality:

- Create and manage credentials (ACDCs)
- Issue and revoke credentials
- Verify credential signatures
- Query registries and schemas
- Export/import credential data

## Architecture

```
Client (Eden Treaty) ←→ HTTP ←→ MERITS (Elysia) ←→ KERITS DSL ←→ KerStore
```

Type safety flows from database to client through the entire stack.

## Performance

Elysia is built on Bun and is one of the fastest TypeScript frameworks:

- ~100,000+ req/s for simple routes
- Sub-millisecond response times
- Low memory footprint
- Native TypeScript support

## License

Part of the KERITS project.
