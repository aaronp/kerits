import { Type } from '@sinclair/typebox';

export type StringPredicateOp = 'eq' | 'neq' | 'contains' | 'startsWith' | 'oneOf' | 'present';
export type NumberPredicateOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
export type DatePredicateOp = 'after' | 'before' | 'on' | 'between' | 'ageGte' | 'withinLast';
export type EnumPredicateOp = 'eq' | 'neq' | 'oneOf';
export type BooleanPredicateOp = 'true' | 'false';

export type FieldPredicateOp =
  | StringPredicateOp
  | NumberPredicateOp
  | DatePredicateOp
  | EnumPredicateOp
  | BooleanPredicateOp;

export type SubjectFieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'email'
  | 'url'
  | 'choice'
  | 'schema'
  | 'identity';

export type PredicateOperands = {
  readonly op: FieldPredicateOp;
  readonly value?: string | number;
  readonly value2?: string | number;
  readonly values?: readonly string[];
};

export type FieldPredicate = PredicateOperands & {
  readonly path: string;
  readonly fieldType?: SubjectFieldType;
};

const OPS = [
  'eq',
  'neq',
  'contains',
  'startsWith',
  'oneOf',
  'present',
  'gt',
  'gte',
  'lt',
  'lte',
  'between',
  'after',
  'before',
  'on',
  'ageGte',
  'withinLast',
  'true',
  'false',
] as const;
const FIELD_TYPES = ['string', 'number', 'boolean', 'date', 'email', 'url', 'choice', 'schema', 'identity'] as const;

export const FieldPredicateSchema = Type.Object(
  {
    path: Type.String({ minLength: 1 }),
    fieldType: Type.Optional(Type.Union(FIELD_TYPES.map((t) => Type.Literal(t)))),
    op: Type.Union(OPS.map((o) => Type.Literal(o))),
    value: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    value2: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    values: Type.Optional(Type.Array(Type.String())),
  },
  { additionalProperties: false },
);

type OperatorValueKind = 'none' | 'single' | 'range' | 'list';

// How many operands each op needs (same for every field type that supports the op).
const OP_VALUE_KIND: Record<FieldPredicateOp, OperatorValueKind> = {
  eq: 'single',
  neq: 'single',
  contains: 'single',
  startsWith: 'single',
  oneOf: 'list',
  present: 'none',
  gt: 'single',
  gte: 'single',
  lt: 'single',
  lte: 'single',
  between: 'range',
  after: 'single',
  before: 'single',
  on: 'single',
  ageGte: 'single',
  withinLast: 'single',
  true: 'none',
  false: 'none',
};

export function predicateHasRequiredValues(
  op: FieldPredicateOp,
  value?: string | number,
  value2?: string | number,
  values?: readonly string[],
): boolean {
  const kind = OP_VALUE_KIND[op];
  if (!kind) return false;
  switch (kind) {
    case 'none':
      return true;
    case 'single':
      return predicateValueIsPresent(value);
    case 'range':
      return predicateValueIsPresent(value) && predicateValueIsPresent(value2);
    case 'list':
      return (values?.length ?? 0) > 0 || predicateValueIsPresent(value);
  }
}

function predicateValueIsPresent(value: string | number | undefined): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  return typeof value === 'string' && value.trim().length > 0;
}

function asString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function predicateStringValue(value: string | number | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function predicateNumberValue(value: string | number | undefined): number | null {
  return asNumber(value);
}

function asDateMs(value: unknown): number | null {
  const text = asString(value);
  if (!text) return null;
  const ms = Date.parse(text);
  return Number.isNaN(ms) ? null : ms;
}

function ageYearsFromDate(value: unknown, nowMs: number): number | null {
  const ms = asDateMs(value);
  if (ms === null) return null;
  const diffMs = nowMs - ms;
  return diffMs / (365.25 * 24 * 60 * 60 * 1000);
}

function evaluateStringPredicate(value: unknown, predicate: PredicateOperands): boolean {
  const target = predicateStringValue(predicate.value);
  switch (predicate.op) {
    case 'present':
      return value !== null && value !== undefined && asString(value) !== '';
    case 'eq':
      return target !== null && asString(value) === target;
    case 'neq':
      return target !== null && asString(value) !== target;
    case 'contains': {
      const text = asString(value);
      return text !== null && target !== null ? text.includes(target) : false;
    }
    case 'startsWith': {
      const text = asString(value);
      return text !== null && target !== null ? text.startsWith(target) : false;
    }
    case 'oneOf': {
      const text = asString(value);
      const options = predicate.values ?? (target ? target.split(',').map((value) => value.trim()) : []);
      return text !== null && options.includes(text);
    }
    default:
      return false;
  }
}

function evaluateNumberPredicate(value: unknown, predicate: PredicateOperands): boolean {
  const n = asNumber(value);
  if (n === null) return false;
  const target = predicateNumberValue(predicate.value);
  const target2 = predicateNumberValue(predicate.value2);
  switch (predicate.op) {
    case 'eq':
      return target !== null && n === target;
    case 'neq':
      return target !== null && n !== target;
    case 'gt':
      return target !== null && n > target;
    case 'gte':
      return target !== null && n >= target;
    case 'lt':
      return target !== null && n < target;
    case 'lte':
      return target !== null && n <= target;
    case 'between':
      return target !== null && target2 !== null && n >= target && n <= target2;
    default:
      return false;
  }
}

function evaluateDatePredicate(value: unknown, predicate: PredicateOperands, nowMs: number): boolean {
  const ms = asDateMs(value);
  if (ms === null && predicate.op !== 'present') return false;
  const target = asDateMs(predicate.value);
  const target2 = asDateMs(predicate.value2);
  switch (predicate.op) {
    case 'after':
      return target !== null && ms !== null && ms > target;
    case 'before':
      return target !== null && ms !== null && ms < target;
    case 'on': {
      if (target === null || ms === null) return false;
      return new Date(ms).toISOString().slice(0, 10) === new Date(target).toISOString().slice(0, 10);
    }
    case 'between':
      return target !== null && target2 !== null && ms !== null && ms >= target && ms <= target2;
    case 'ageGte': {
      const age = ageYearsFromDate(value, nowMs);
      const minAge = predicateNumberValue(predicate.value);
      return age !== null && minAge !== null && age >= minAge;
    }
    case 'withinLast': {
      const days = predicateNumberValue(predicate.value);
      if (days === null || ms === null) return false;
      const windowMs = days * 24 * 60 * 60 * 1000;
      return nowMs - ms <= windowMs;
    }
    default:
      return false;
  }
}

function evaluateEnumPredicate(value: unknown, predicate: PredicateOperands): boolean {
  const text = asString(value);
  const target = predicateStringValue(predicate.value);
  const options = predicate.values ?? (target ? [target] : []);
  switch (predicate.op) {
    case 'eq':
      return text !== null && target !== null && text === target;
    case 'neq':
      return text !== null && target !== null && text !== target;
    case 'oneOf':
      return text !== null && options.includes(text);
    default:
      return false;
  }
}

function evaluateBooleanPredicate(value: unknown, predicate: PredicateOperands): boolean {
  const bool = typeof value === 'boolean' ? value : value === 'true' ? true : value === 'false' ? false : null;
  if (bool === null) return false;
  if (predicate.op === 'true') return bool === true;
  if (predicate.op === 'false') return bool === false;
  return false;
}

export function evaluateFieldPredicate(
  value: unknown,
  predicate: PredicateOperands,
  fieldType: SubjectFieldType,
  nowMs: number,
): boolean {
  if (!predicateHasRequiredValues(predicate.op, predicate.value, predicate.value2, predicate.values)) {
    return false;
  }

  switch (fieldType) {
    case 'number':
      return evaluateNumberPredicate(value, predicate);
    case 'date':
      return evaluateDatePredicate(value, predicate, nowMs);
    case 'choice':
      return evaluateEnumPredicate(value, predicate);
    case 'boolean':
      return evaluateBooleanPredicate(value, predicate);
    case 'email':
    case 'url':
    case 'string':
    case 'schema':
      return evaluateStringPredicate(value, predicate);
    case 'identity':
      return false;
  }
}
