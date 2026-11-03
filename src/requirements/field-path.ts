type JsonRecord = Record<string, unknown>;

export type FieldPathSegment = {
  readonly property: string;
  readonly array: boolean;
};

const ESCAPED_CHARACTERS = new Set(['\\', '.', '[', ']', '/', '~']);

export function escapeFieldPathProperty(property: string): string {
  let escaped = '';
  for (const character of property) {
    escaped += ESCAPED_CHARACTERS.has(character) ? `\\${character}` : character;
  }
  return escaped;
}

export function formatFieldPath(segments: readonly FieldPathSegment[]): string {
  if (segments.length === 0) throw new Error('Field path must contain at least one segment');
  return segments
    .map(({ property, array }) => {
      if (!property) throw new Error('Field path properties must not be empty');
      return `${escapeFieldPathProperty(property)}${array ? '[]' : ''}`;
    })
    .join('.');
}

export function parseFieldPath(path: string): readonly FieldPathSegment[] {
  if (!path) throw new Error('Field path must not be empty');

  const segments: FieldPathSegment[] = [];
  let property = '';
  let array = false;

  const finishSegment = () => {
    if (!property) throw new Error('Field path segments must not be empty');
    segments.push({ property, array });
    property = '';
    array = false;
  };

  for (let index = 0; index < path.length; index += 1) {
    const character = path[index]!;
    if (character === '\\') {
      const escaped = path[index + 1];
      if (!escaped) throw new Error('Field path must not end with an escape');
      if (!ESCAPED_CHARACTERS.has(escaped)) {
        throw new Error(`Invalid field path escape: \\${escaped}`);
      }
      property += escaped;
      index += 1;
      continue;
    }
    if (character === '.') {
      finishSegment();
      continue;
    }
    if (character === '[' && path[index + 1] === ']') {
      if (!property || array) throw new Error('Invalid field path array marker');
      const following = path[index + 2];
      if (following !== undefined && following !== '.') {
        throw new Error('Field path array marker must terminate its segment');
      }
      array = true;
      index += 1;
      continue;
    }
    if (ESCAPED_CHARACTERS.has(character)) {
      throw new Error(`Reserved field path character must be escaped: ${character}`);
    }
    property += character;
  }

  finishSegment();
  return segments;
}

function readValueAtSegments(value: unknown, segments: readonly FieldPathSegment[]): unknown[] {
  if (segments.length === 0) return [value];

  const [head, ...rest] = segments;
  if (!head) return [value];
  if (value === null || value === undefined || typeof value !== 'object') return [];
  const record = value as JsonRecord;
  if (!Object.hasOwn(record, head.property)) return [];

  const resolved = record[head.property];
  if (!head.array) return readValueAtSegments(resolved, rest);
  if (!Array.isArray(resolved)) return [];
  return resolved.flatMap((item) => readValueAtSegments(item, rest));
}

/** Resolve values at a credential-subject path (supports dot paths and `[]` array notation). */
export function resolveFieldPath(attributes: unknown, path: string): unknown[] {
  if (!attributes || typeof attributes !== 'object') return [];
  const segments = parseFieldPath(path);
  return readValueAtSegments(attributes, segments);
}

export function pathIncludesArray(path: string): boolean {
  return parseFieldPath(path).some((segment) => segment.array);
}

/** Convert internal path to presentation-definition JSONPath. */
export function fieldPathToJsonPath(path: string): string {
  const jsonPath = parseFieldPath(path)
    .map(({ property, array }) => {
      const accessor = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(property) ? `.${property}` : `[${JSON.stringify(property)}]`;
      return `${accessor}${array ? '[*]' : ''}`;
    })
    .join('');
  return `$.credentialSubject${jsonPath}`;
}
