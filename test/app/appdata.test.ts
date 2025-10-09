/**
 * Tests for AppDataDSL - Application preferences
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createKerStore } from '../../src/storage/core';
import { MemoryKv } from '../../src/storage/adapters/memory';
import { createKeritsDSL } from '../../src/app/dsl';

describe('AppDataDSL', () => {
  let store: ReturnType<typeof createKerStore>;
  let dsl: ReturnType<typeof createKeritsDSL>;

  beforeEach(() => {
    const kv = new MemoryKv();
    store = createKerStore(kv);
    dsl = createKeritsDSL(store);
  });

  it('should set and get string preferences', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');
    const color = await appData.get<string>('bannerColor');

    expect(color).toBe('#3b82f6');
  });

  it('should set and get boolean preferences', async () => {
    const appData = dsl.appData();

    await appData.set('sidebarExpanded', true);
    const expanded = await appData.get<boolean>('sidebarExpanded');

    expect(expanded).toBe(true);
  });

  it('should set and get object preferences', async () => {
    const appData = dsl.appData();

    const uiPrefs = {
      sidebar: true,
      theme: 'dark',
      fontSize: 14,
      notifications: {
        enabled: true,
        sound: false,
      },
    };

    await appData.set('ui-prefs', uiPrefs);
    const retrieved = await appData.get<typeof uiPrefs>('ui-prefs');

    expect(retrieved).toEqual(uiPrefs);
  });

  it('should set and get array preferences', async () => {
    const appData = dsl.appData();

    const recentFiles = ['file1.json', 'file2.json', 'file3.json'];

    await appData.set('recentFiles', recentFiles);
    const retrieved = await appData.get<string[]>('recentFiles');

    expect(retrieved).toEqual(recentFiles);
  });

  it('should return null for non-existent keys', async () => {
    const appData = dsl.appData();

    const value = await appData.get('nonexistent');

    expect(value).toBeNull();
  });

  it('should list all preference keys', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');
    await appData.set('sidebarExpanded', true);
    await appData.set('theme', 'dark');

    const keys = await appData.list();

    expect(keys).toHaveLength(3);
    expect(keys).toContain('bannerColor');
    expect(keys).toContain('sidebarExpanded');
    expect(keys).toContain('theme');
  });

  it('should delete a preference', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');
    await appData.set('theme', 'dark');

    await appData.delete('bannerColor');

    const color = await appData.get('bannerColor');
    const theme = await appData.get('theme');

    expect(color).toBeNull();
    expect(theme).toBe('dark');
  });

  it('should clear all preferences', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');
    await appData.set('sidebarExpanded', true);
    await appData.set('theme', 'dark');

    await appData.clear();

    const keys = await appData.list();
    expect(keys).toHaveLength(0);

    const color = await appData.get('bannerColor');
    expect(color).toBeNull();
  });

  it('should overwrite existing preferences', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');
    await appData.set('bannerColor', '#ef4444');

    const color = await appData.get<string>('bannerColor');

    expect(color).toBe('#ef4444');
  });

  it('should handle complex nested objects', async () => {
    const appData = dsl.appData();

    const complexPrefs = {
      layout: {
        sidebar: {
          expanded: true,
          width: 250,
          pinned: ['favorites', 'recent'],
        },
        mainPanel: {
          splitView: true,
          orientation: 'horizontal',
        },
      },
      appearance: {
        theme: 'dark',
        accentColor: '#3b82f6',
        fontFamily: 'Inter',
      },
    };

    await appData.set('app-config', complexPrefs);
    const retrieved = await appData.get<typeof complexPrefs>('app-config');

    expect(retrieved).toEqual(complexPrefs);
  });

  it('should handle null and undefined values', async () => {
    const appData = dsl.appData();

    await appData.set('nullValue', null);
    await appData.set('undefinedValue', undefined);

    const nullVal = await appData.get('nullValue');
    const undefinedVal = await appData.get('undefinedValue');

    expect(nullVal).toBeNull();
    expect(undefinedVal).toBeNull(); // undefined becomes null in JSON
  });

  it('should handle number preferences', async () => {
    const appData = dsl.appData();

    await appData.set('fontSize', 14);
    await appData.set('maxItems', 100);
    await appData.set('zoomLevel', 1.5);

    const fontSize = await appData.get<number>('fontSize');
    const maxItems = await appData.get<number>('maxItems');
    const zoomLevel = await appData.get<number>('zoomLevel');

    expect(fontSize).toBe(14);
    expect(maxItems).toBe(100);
    expect(zoomLevel).toBe(1.5);
  });

  it('should be isolated per DSL instance (user isolation)', async () => {
    // User 1
    const kv1 = new MemoryKv();
    const store1 = createKerStore(kv1);
    const dsl1 = createKeritsDSL(store1);
    const appData1 = dsl1.appData();

    // User 2
    const kv2 = new MemoryKv();
    const store2 = createKerStore(kv2);
    const dsl2 = createKeritsDSL(store2);
    const appData2 = dsl2.appData();

    // Set preferences for both users
    await appData1.set('bannerColor', '#3b82f6');
    await appData2.set('bannerColor', '#ef4444');

    // Verify isolation
    const color1 = await appData1.get<string>('bannerColor');
    const color2 = await appData2.get<string>('bannerColor');

    expect(color1).toBe('#3b82f6');
    expect(color2).toBe('#ef4444');
  });

  it('should store preferences under prefs/ prefix in KV store', async () => {
    const appData = dsl.appData();

    await appData.set('bannerColor', '#3b82f6');

    // Directly check the KV store
    const raw = await store.kv.get('prefs/bannerColor');
    expect(raw).not.toBeNull();

    const json = new TextDecoder().decode(raw!);
    const value = JSON.parse(json);
    expect(value).toBe('#3b82f6');
  });

  it('should handle special characters in keys', async () => {
    const appData = dsl.appData();

    await appData.set('user.settings.theme', 'dark');
    await appData.set('cache:enabled', true);
    await appData.set('feature_flags-experimental', false);

    const theme = await appData.get('user.settings.theme');
    const cacheEnabled = await appData.get('cache:enabled');
    const experimental = await appData.get('feature_flags-experimental');

    expect(theme).toBe('dark');
    expect(cacheEnabled).toBe(true);
    expect(experimental).toBe(false);
  });

  it('should handle empty strings', async () => {
    const appData = dsl.appData();

    await appData.set('emptyString', '');

    const value = await appData.get<string>('emptyString');

    expect(value).toBe('');
  });

  it('should handle empty arrays and objects', async () => {
    const appData = dsl.appData();

    await appData.set('emptyArray', []);
    await appData.set('emptyObject', {});

    const arr = await appData.get<any[]>('emptyArray');
    const obj = await appData.get<Record<string, any>>('emptyObject');

    expect(arr).toEqual([]);
    expect(obj).toEqual({});
  });
});
