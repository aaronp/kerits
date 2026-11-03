import { describe, expect, test } from 'bun:test';
import { OobiAllowList } from '../oobi-allow-list.js';

const hosts = ['data.kerits.id', 'localhost:8817'];

describe('OobiAllowList.check', () => {
  // call out our method under test: check(url, hosts)
  const cases: [string, 'ok' | 'oobi-invalid' | 'oobi-host-not-allowed'][] = [
    ['https://data.kerits.id/oobi/E1', 'ok'],
    ['https://DATA.kerits.id/x', 'ok'],
    ['http://localhost:8817/oobi/E1', 'ok'],
    ['https://evil.test/x', 'oobi-host-not-allowed'],
    ['https://data.kerits.id.evil.test/x', 'oobi-host-not-allowed'],
    ['http://data.kerits.id/x', 'oobi-host-not-allowed'],
    ['ftp://data.kerits.id/x', 'oobi-invalid'],
    ['not a url', 'oobi-invalid'],
  ];
  for (const [url, want] of cases) {
    test(`${url} -> ${want}`, () => {
      const r = OobiAllowList.check(url, hosts);
      // assertions: ok yields the parsed URL, otherwise the named error
      if (want === 'ok') expect(r.ok && r.value.href).toBe(new URL(url).href);
      else expect(!r.ok && r.error).toBe(want);
    });
  }

  test('empty host list allows nothing', () => {
    const r = OobiAllowList.check('https://data.kerits.id/x', []);
    expect(!r.ok && r.error).toBe('oobi-host-not-allowed');
  });
});
