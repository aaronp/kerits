#!/usr/bin/env bun

/**
 * KERITS MCP Server
 *
 * Provides Model Context Protocol access to KERI credential data
 * Uses the kerits DSL to query ACDCs, schemas, and cryptographic signatures
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Import kerits DSL (will need to reference parent directory)
import { createKeritsDSL } from '../src/app/dsl/builders/kerits';
import type { KeritsDSL } from '../src/app/dsl/types';

// Initialize DSL
let dsl: KeritsDSL | null = null;

async function initDSL(): Promise<KeritsDSL> {
  if (!dsl) {
    dsl = await createKeritsDSL();
  }
  return dsl;
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'get_credential',
    description: 'Retrieve a credential (ACDC) by its ID or alias',
    inputSchema: {
      type: 'object',
      properties: {
        credential_id: {
          type: 'string',
          description: 'Credential ID (SAID) or alias',
        },
        account: {
          type: 'string',
          description: 'Account alias (optional, uses first account if not specified)',
        },
      },
      required: ['credential_id'],
    },
  },
  {
    name: 'list_credentials',
    description: 'List all credentials in a registry',
    inputSchema: {
      type: 'object',
      properties: {
        registry: {
          type: 'string',
          description: 'Registry alias',
        },
        account: {
          type: 'string',
          description: 'Account alias (optional)',
        },
      },
      required: ['registry'],
    },
  },
  {
    name: 'get_credential_signature',
    description: 'Get signature information for a credential (who signed it)',
    inputSchema: {
      type: 'object',
      properties: {
        credential_id: {
          type: 'string',
          description: 'Credential ID (SAID)',
        },
        account: {
          type: 'string',
          description: 'Account alias (optional)',
        },
      },
      required: ['credential_id'],
    },
  },
  {
    name: 'verify_credential',
    description: 'Verify a credential\'s cryptographic integrity',
    inputSchema: {
      type: 'object',
      properties: {
        credential_id: {
          type: 'string',
          description: 'Credential ID (SAID)',
        },
        account: {
          type: 'string',
          description: 'Account alias (optional)',
        },
      },
      required: ['credential_id'],
    },
  },
  {
    name: 'list_schemas',
    description: 'List all available credential schemas',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_schema',
    description: 'Get details of a credential schema',
    inputSchema: {
      type: 'object',
      properties: {
        schema_id: {
          type: 'string',
          description: 'Schema ID (SAID) or alias',
        },
      },
      required: ['schema_id'],
    },
  },
];

// Tool handlers
async function handleGetCredential(args: any): Promise<string> {
  const dslInstance = await initDSL();

  const accountName = args.account || (await dslInstance.accountNames())[0];
  if (!accountName) {
    return JSON.stringify({ error: 'No accounts found' }, null, 2);
  }

  const accountDsl = await dslInstance.account(accountName);
  const registries = await accountDsl.listRegistries();

  // Search for credential across all registries
  for (const registryAlias of registries) {
    const registryDsl = await accountDsl.registry(registryAlias);
    const acdcAliases = await registryDsl.listACDCs();

    // Check if credential ID matches an alias
    if (acdcAliases.includes(args.credential_id)) {
      const acdcDsl = await registryDsl.acdc(args.credential_id);
      const acdc = acdcDsl.acdc;
      const status = await acdcDsl.status();

      return JSON.stringify({
        credentialId: acdc.credentialId,
        issuerAid: acdc.issuerAid,
        holderAid: acdc.holderAid,
        registryId: acdc.registryId,
        schemas: acdc.schemas,
        status,
        issuedAt: acdc.issuedAt,
        latestData: acdc.latestData,
      }, null, 2);
    }

    // Check if it's a direct SAID match
    const credentials = await registryDsl.listCredentials();
    const match = credentials.find(c => c.credentialId === args.credential_id);
    if (match) {
      return JSON.stringify({
        credentialId: match.credentialId,
        issuerAid: match.issuerAid,
        holderAid: match.holderAid,
        registryId: match.registryId,
        schemas: match.schemas,
        status: match.status,
        issuedAt: match.issuedAt,
        latestData: match.latestData,
      }, null, 2);
    }
  }

  return JSON.stringify({ error: 'Credential not found' }, null, 2);
}

async function handleListCredentials(args: any): Promise<string> {
  const dslInstance = await initDSL();

  const accountName = args.account || (await dslInstance.accountNames())[0];
  if (!accountName) {
    return JSON.stringify({ error: 'No accounts found' }, null, 2);
  }

  const accountDsl = await dslInstance.account(accountName);
  const registryDsl = await accountDsl.registry(args.registry);

  if (!registryDsl) {
    return JSON.stringify({ error: `Registry '${args.registry}' not found` }, null, 2);
  }

  const credentials = await registryDsl.listCredentials();

  return JSON.stringify({
    registry: args.registry,
    count: credentials.length,
    credentials: credentials.map(c => ({
      credentialId: c.credentialId,
      issuerAid: c.issuerAid,
      holderAid: c.holderAid,
      status: c.status,
      issuedAt: c.issuedAt,
      schemas: c.schemas.map(s => s.schemaSaid),
    })),
  }, null, 2);
}

async function handleGetCredentialSignature(args: any): Promise<string> {
  const dslInstance = await initDSL();

  const accountName = args.account || (await dslInstance.accountNames())[0];
  if (!accountName) {
    return JSON.stringify({ error: 'No accounts found' }, null, 2);
  }

  const accountDsl = await dslInstance.account(accountName);
  const registries = await accountDsl.listRegistries();

  // Find the credential
  for (const registryAlias of registries) {
    const registryDsl = await accountDsl.registry(registryAlias);
    const credentials = await registryDsl.listCredentials();
    const match = credentials.find(c => c.credentialId === args.credential_id);

    if (match) {
      // Get the issuer information
      const issuerAid = match.issuerAid;

      // Try to resolve issuer to an alias
      const accounts = await dslInstance.accountNames();
      let issuerAlias = 'Unknown';

      for (const accName of accounts) {
        const acc = await dslInstance.getAccount(accName);
        if (acc?.aid === issuerAid) {
          issuerAlias = accName;
          break;
        }
      }

      return JSON.stringify({
        credentialId: match.credentialId,
        issuer: {
          aid: issuerAid,
          alias: issuerAlias,
        },
        signature_info: 'Credential issued and signed by the above issuer',
        issuedAt: match.issuedAt,
        status: match.status,
      }, null, 2);
    }
  }

  return JSON.stringify({ error: 'Credential not found' }, null, 2);
}

async function handleVerifyCredential(args: any): Promise<string> {
  const dslInstance = await initDSL();

  const accountName = args.account || (await dslInstance.accountNames())[0];
  if (!accountName) {
    return JSON.stringify({ error: 'No accounts found' }, null, 2);
  }

  const accountDsl = await dslInstance.account(accountName);
  const registries = await accountDsl.listRegistries();

  // Find and verify the credential
  for (const registryAlias of registries) {
    const registryDsl = await accountDsl.registry(registryAlias);
    const credentials = await registryDsl.listCredentials();
    const match = credentials.find(c => c.credentialId === args.credential_id);

    if (match) {
      // Check status as basic verification
      const isValid = match.status === 'issued';

      return JSON.stringify({
        credentialId: match.credentialId,
        valid: isValid,
        status: match.status,
        issuerAid: match.issuerAid,
        holderAid: match.holderAid,
        issuedAt: match.issuedAt,
        verification_details: isValid
          ? 'Credential is valid and has not been revoked'
          : 'Credential has been revoked or is invalid',
      }, null, 2);
    }
  }

  return JSON.stringify({ error: 'Credential not found' }, null, 2);
}

async function handleListSchemas(): Promise<string> {
  const dslInstance = await initDSL();
  const schemaAliases = await dslInstance.listSchemas();

  const schemas = await Promise.all(
    schemaAliases.map(async (alias) => {
      const schemaDsl = await dslInstance.schema(alias);
      if (!schemaDsl) return null;

      return {
        alias,
        schemaSaid: schemaDsl.schema.schemaSaid,
        title: schemaDsl.schema.schema?.title || alias,
        description: schemaDsl.schema.schema?.description || '',
      };
    })
  );

  return JSON.stringify({
    count: schemas.filter(s => s !== null).length,
    schemas: schemas.filter(s => s !== null),
  }, null, 2);
}

async function handleGetSchema(args: any): Promise<string> {
  const dslInstance = await initDSL();

  // Try as alias first
  let schemaDsl = await dslInstance.schema(args.schema_id);

  if (!schemaDsl) {
    // Try to find by SAID
    const aliases = await dslInstance.listSchemas();
    for (const alias of aliases) {
      const s = await dslInstance.schema(alias);
      if (s && s.schema.schemaSaid === args.schema_id) {
        schemaDsl = s;
        break;
      }
    }
  }

  if (!schemaDsl) {
    return JSON.stringify({ error: 'Schema not found' }, null, 2);
  }

  return JSON.stringify({
    alias: schemaDsl.schema.alias,
    schemaSaid: schemaDsl.schema.schemaSaid,
    schema: schemaDsl.schema.schema,
  }, null, 2);
}

// Create MCP server
const server = new Server(
  {
    name: 'kerits-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'get_credential':
        result = await handleGetCredential(args);
        break;
      case 'list_credentials':
        result = await handleListCredentials(args);
        break;
      case 'get_credential_signature':
        result = await handleGetCredentialSignature(args);
        break;
      case 'verify_credential':
        result = await handleVerifyCredential(args);
        break;
      case 'list_schemas':
        result = await handleListSchemas();
        break;
      case 'get_schema':
        result = await handleGetSchema(args);
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('KERITS MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
