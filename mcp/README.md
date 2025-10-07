# KERITS MCP Server

Model Context Protocol (MCP) server for the KERITS credential system. Provides LLM access to KERI-based verifiable credentials (ACDCs), schemas, and cryptographic signatures.

## Overview

This MCP server exposes KERITS DSL functionality through standardized tools that can be used by Claude Desktop and other MCP-compatible clients. It enables natural language queries about credentials, signatures, and verification status.

## Features

### Available Tools

1. **get_credential** - Retrieve a credential by ID or alias
   - Input: `credential_id` (SAID or alias), optional `account`
   - Returns: Full credential details including issuer, holder, schemas, status, and data

2. **list_credentials** - List all credentials in a registry
   - Input: `registry` (alias), optional `account`
   - Returns: Array of credentials with metadata

3. **get_credential_signature** - Get signature information
   - Input: `credential_id` (SAID), optional `account`
   - Returns: Issuer details and signature info (who signed the credential)

4. **verify_credential** - Verify credential integrity
   - Input: `credential_id` (SAID), optional `account`
   - Returns: Verification status, validity, and details

5. **list_schemas** - List all credential schemas
   - Returns: Array of available schemas with titles and descriptions

6. **get_schema** - Get schema details
   - Input: `schema_id` (SAID or alias)
   - Returns: Full schema definition (JSON Schema)

## Installation

```bash
cd /Users/aaron/dev/sandbox/keripy/kerits/mcp
bun install
```

## Usage

### Running the Server

```bash
bun start
```

The server runs on stdio, making it compatible with MCP clients.

### Development Mode (Auto-reload)

```bash
bun run dev
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector bun run index.ts
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "kerits": {
      "command": "bun",
      "args": ["run", "/Users/aaron/dev/sandbox/keripy/kerits/mcp/index.ts"]
    }
  }
}
```

After configuration, restart Claude Desktop. The tools will appear automatically.

## Example Queries

Once configured, you can ask Claude questions like:

- "Who signed credential ABC123?"
- "List all credentials in the 'medical-records' registry"
- "Verify credential XYZ456"
- "Show me the schema for driver's licenses"
- "What credentials have been issued today?"
- "Is this credential still valid?"

## Architecture

```
┌─────────────────┐
│ Claude Desktop  │
│   (MCP Client)  │
└────────┬────────┘
         │ stdio
         │
┌────────▼────────┐
│  KERITS MCP     │
│    Server       │
└────────┬────────┘
         │
┌────────▼────────┐
│  KERITS DSL     │
│  (TypeScript)   │
└────────┬────────┘
         │
┌────────▼────────┐
│   KerStore      │
│  (SQLite DB)    │
└─────────────────┘
```

The MCP server acts as a bridge between natural language queries and the KERITS cryptographic data layer.

## Data Access

- **Storage**: Uses the kerits DSL which wraps KerStore (SQLite)
- **Accounts**: Automatically uses the first account if not specified
- **Registries**: Searches across all registries when looking up credentials
- **Schemas**: Global namespace, shared across all accounts

## Security Notes

- This server provides **read-only** access to credential data
- No write operations (issuing, revoking) are exposed via MCP
- All data access goes through the kerits DSL validation layer
- Credentials are verified using KERI cryptographic primitives

## Development

### Project Structure

```
mcp/
├── index.ts          # Main MCP server implementation
├── package.json      # Dependencies and scripts
├── tsconfig.json     # TypeScript configuration
└── README.md         # This file
```

### Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `../src/app/dsl` - KERITS DSL for data access

### Adding New Tools

1. Define tool schema in the `tools` array
2. Create handler function (e.g., `handleNewTool`)
3. Add case to switch statement in `CallToolRequestSchema` handler
4. Test with MCP Inspector

## Troubleshooting

### Server won't start
- Check that bun is installed: `bun --version`
- Verify kerits dependencies: `cd .. && bun install`
- Check for TypeScript errors: `bun run index.ts`

### Tools not appearing in Claude
- Restart Claude Desktop after config changes
- Check config file syntax (must be valid JSON)
- View Claude logs: `~/Library/Logs/Claude/mcp*.log`

### "No accounts found" errors
- Create a KERITS account first using the UI or CLI
- Verify database exists: `ls ~/.kerits/kerits.db`

## Future Enhancements

Potential additions:
- Resource endpoints for streaming credential data
- Prompt templates for common queries
- Sampling support for credential recommendations
- Event subscriptions for credential updates
- Multi-account filtering and aggregation
- Advanced search across credential fields

## License

Part of the KERITS project.
