#!/usr/bin/env bun
/**
 * CLI Structure Test
 * Verifies that all modules load correctly
 */

console.log('Testing CLI structure...\n');

try {
  console.log('✓ Loading storage utilities...');
  const storage = await import('./utils/storage.js');
  console.log(`  - getKeritsDir: ${typeof storage.getKeritsDir}`);
  console.log(`  - loadAccountDSL: ${typeof storage.loadAccountDSL}`);
  console.log(`  - listAccounts: ${typeof storage.listAccounts}`);

  console.log('\n✓ Loading graph utilities...');
  const graph = await import('./utils/graph.js');
  console.log(`  - showGraph: ${typeof graph.showGraph}`);

  console.log('\n✓ Loading menus...');
  const accounts = await import('./menus/accounts.js');
  console.log(`  - accountsMenu: ${typeof accounts.accountsMenu}`);

  const registries = await import('./menus/registries.js');
  console.log(`  - registriesMenu: ${typeof registries.registriesMenu}`);

  const contacts = await import('./menus/contacts.js');
  console.log(`  - contactsMenu: ${typeof contacts.contactsMenu}`);

  const schemas = await import('./menus/schemas.js');
  console.log(`  - schemasMenu: ${typeof schemas.schemasMenu}`);

  console.log('\n✓ Testing storage path:');
  const keritsDir = storage.getKeritsDir();
  console.log(`  - KERITS_DIR: ${keritsDir}`);

  console.log('\n✓ Testing account listing:');
  const accounts_list = await storage.listAccounts();
  console.log(`  - Found ${accounts_list.length} accounts: ${accounts_list.join(', ') || '(none)'}`);

  console.log('\n✓ Testing current account:');
  const current = await storage.getCurrentAccount();
  console.log(`  - Current account: ${current || '(none)'}`);

  console.log('\n✅ All tests passed!\n');
  console.log('The CLI is ready to use. Run with:');
  console.log('  make dev');
  console.log('  bun run start');

} catch (error) {
  console.error('\n❌ Test failed:');
  console.error(error);
  process.exit(1);
}
