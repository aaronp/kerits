/**
 * MERITS Eden Client
 *
 * Type-safe client for the MERITS API using Eden Treaty
 */

import { edenTreaty } from '@elysiajs/eden';
import type { App } from './index';

// Create type-safe client
const client = edenTreaty<App>('http://localhost:3000');

// Example usage
async function main() {
  console.log('🔗 Testing MERITS API with Eden Treaty client...\n');

  // Test root endpoint
  const root = await client.index.get();
  console.log('GET /', root.data);

  // Test hello endpoint
  const hello = await client.hello.get();
  console.log('\nGET /hello', hello.data);

  // Test hello with name parameter (path parameter syntax)
  const helloName = await client.hello.Alice.get();
  console.log('\nGET /hello/Alice', helloName.data);

  console.log('\n✅ All tests passed!');
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { client };
