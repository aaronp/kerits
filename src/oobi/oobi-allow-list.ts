import { err, ok, type Result } from '../result.js';

const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1'];

export const OobiAllowList = {
  /** `https:` only (`http:` for local hosts); exact lower-cased `url.host` match against `hosts` — no suffix/wildcard. */
  check(url: string, hosts: readonly string[]): Result<URL, 'oobi-invalid' | 'oobi-host-not-allowed'> {
    let u: URL;
    try {
      u = new URL(url);
    } catch {
      return err('oobi-invalid');
    }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return err('oobi-invalid');
    if (u.protocol === 'http:' && !LOCAL_HOSTNAMES.includes(u.hostname)) return err('oobi-host-not-allowed');
    return hosts.some((h) => h.toLowerCase() === u.host) ? ok(u) : err('oobi-host-not-allowed');
  },
} as const;
