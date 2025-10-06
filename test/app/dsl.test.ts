/**
 * Tests for KeritsDSL - High-level account management API
 */

import { describe, it, expect } from 'bun:test';
import { createKeritsDSL } from '../../src/app/dsl';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';

// Deterministic test seed
const TEST_SEED_USER1 = new Uint8Array(32).fill(1);
const TEST_SEED_USER2 = new Uint8Array(32).fill(2);

describe('KeritsDSL', () => {
  it('should create accounts with mnemonic and retrieve them', async () => {
    // Setup
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Generate mnemonic from seed
    const account1Mnemonic = dsl.newMnemonic(TEST_SEED_USER1);

    // Verify mnemonic is 24 words
    expect(account1Mnemonic).toHaveLength(24);
    expect(account1Mnemonic.every(w => typeof w === 'string')).toBe(true);
    console.log('✓ Generated 24-word mnemonic');

    // Create account from mnemonic
    const account1 = await dsl.newAccount('account-alias', account1Mnemonic);

    // Verify account structure
    expect(account1.alias).toBe('account-alias');
    expect(account1.aid).toBeDefined();
    expect(account1.verfer).toBeDefined();
    expect(account1.createdAt).toBeDefined();
    console.log('✓ Created account:', account1.alias);

    // Retrieve account by alias
    const retrieved = await dsl.getAccount('account-alias');
    expect(retrieved).toEqual(account1);
    console.log('✓ Retrieved account by alias');

    // List account names
    const names = await dsl.accountNames();
    expect(names).toEqual(['account-alias']);
    console.log('✓ Listed account names:', names);
  });

  it('should handle multiple accounts', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // Create first account
    const mnemonic1 = dsl.newMnemonic(TEST_SEED_USER1);
    const account1 = await dsl.newAccount('alice', mnemonic1);

    // Create second account
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_USER2);
    const account2 = await dsl.newAccount('bob', mnemonic2);

    // Verify both accounts exist
    expect(await dsl.getAccount('alice')).toEqual(account1);
    expect(await dsl.getAccount('bob')).toEqual(account2);

    // Verify account names list
    const names = await dsl.accountNames();
    expect(names).toEqual(['alice', 'bob']);

    console.log('✓ Created and retrieved multiple accounts');
  });

  it('should retrieve account by AID', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const mnemonic = dsl.newMnemonic(TEST_SEED_USER1);
    const account = await dsl.newAccount('test-user', mnemonic);

    // Retrieve by AID
    const byAid = await dsl.getAccountByAid(account.aid);
    expect(byAid).toEqual(account);

    console.log('✓ Retrieved account by AID');
  });

  it('should generate deterministic mnemonics from same seed', () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const mnemonic1 = dsl.newMnemonic(TEST_SEED_USER1);
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_USER1);

    expect(mnemonic1).toEqual(mnemonic2);

    console.log('✓ Mnemonics are deterministic');
  });

  it('should generate different mnemonics from different seeds', () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const mnemonic1 = dsl.newMnemonic(TEST_SEED_USER1);
    const mnemonic2 = dsl.newMnemonic(TEST_SEED_USER2);

    expect(mnemonic1).not.toEqual(mnemonic2);

    console.log('✓ Different seeds produce different mnemonics');
  });

  it('should reject duplicate alias', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const mnemonic1 = dsl.newMnemonic(TEST_SEED_USER1);
    await dsl.newAccount('same-alias', mnemonic1);

    const mnemonic2 = dsl.newMnemonic(TEST_SEED_USER2);

    // Should throw error for duplicate alias
    await expect(dsl.newAccount('same-alias', mnemonic2)).rejects.toThrow(
      'Account alias already exists: same-alias'
    );

    console.log('✓ Duplicate alias rejected');
  });

  it('should return null for non-existent account', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const account = await dsl.getAccount('non-existent');
    expect(account).toBeNull();

    console.log('✓ Returns null for non-existent account');
  });

  it('should allow same mnemonic to create accounts with different aliases', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    const mnemonic = dsl.newMnemonic(TEST_SEED_USER1);

    const account1 = await dsl.newAccount('alias1', mnemonic);
    const account2 = await dsl.newAccount('alias2', mnemonic);

    // Should have same AID and verfer (derived from same mnemonic)
    expect(account1.aid).toBe(account2.aid);
    expect(account1.verfer).toBe(account2.verfer);

    // But different aliases
    expect(account1.alias).toBe('alias1');
    expect(account2.alias).toBe('alias2');

    // Both should be retrievable
    expect(await dsl.getAccount('alias1')).toEqual(account1);
    expect(await dsl.getAccount('alias2')).toEqual(account2);

    console.log('✓ Same mnemonic can have multiple aliases');
  });

  it('should match user example exactly', async () => {
    const kv = new MemoryKv();
    const store = createKerStore(kv);
    const dsl = createKeritsDSL(store);

    // User's example
    const TEST_SEED_USER1 = new Uint8Array(32).fill(1);

    const account1Mnemonic: string[] = dsl.newMnemonic(TEST_SEED_USER1);
    const account1 = await dsl.newAccount('account-alias', account1Mnemonic);

    expect(account1).toEqual(await dsl.getAccount('account-alias'));
    expect(await dsl.accountNames()).toEqual(['account-alias']);

    console.log('✓ User example works exactly as specified');
  });
});
