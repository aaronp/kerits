/**
 * Insertion-order JSON serializer for KERI derivation paths.
 *
 * NOT canonical JSON. Output depends on Object.keys() enumeration order
 * of the supplied object graph. Used exclusively for KERI SAID computation
 * and version-string byte measurement.
 *
 * See docs/superpowers/specs/2026-04-22-keri-insertion-order-said-design.md.
 */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function serializeInsertionOrder(value: JsonValue): string {
  return serializeValue(value);
}

function serializeValue(value: unknown): string {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value);

    case 'number':
      if (!Number.isFinite(value)) {
        throw new TypeError(`serializeInsertionOrder: non-finite number: ${value}`);
      }
      return JSON.stringify(value);

    case 'boolean':
      return value ? 'true' : 'false';

    case 'object': {
      if (Array.isArray(value)) {
        return serializeArray(value);
      }
      return serializeObject(value as Record<string, unknown>);
    }

    default:
      throw new TypeError(`serializeInsertionOrder: unsupported type '${typeof value}'`);
  }
}

function serializeArray(arr: unknown[]): string {
  const parts: string[] = [];
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (element === undefined) {
      throw new TypeError(`serializeInsertionOrder: undefined at array index ${i}`);
    }
    parts.push(serializeValue(element));
  }
  return `[${parts.join(',')}]`;
}

function serializeObject(obj: Record<string, unknown>): string {
  // Guard: reject non-plain objects (Dates, typed arrays, class instances, etc.)
  const proto = Object.getPrototypeOf(obj);
  if (proto !== null && proto !== Object.prototype) {
    throw new TypeError(
      `serializeInsertionOrder: expected plain object, got ${proto.constructor?.name ?? 'non-plain object'}`,
    );
  }
  const keys = Object.keys(obj);
  const parts: string[] = [];
  for (const key of keys) {
    const val = obj[key];
    if (val === undefined) {
      throw new TypeError(`serializeInsertionOrder: undefined at property '${key}'`);
    }
    parts.push(`${JSON.stringify(key)}:${serializeValue(val)}`);
  }
  return `{${parts.join(',')}}`;
}
