import { describe, expect, test } from 'bun:test';
import { evaluateFieldPredicate, predicateHasRequiredValues, resolveFieldPath } from '../../index.js';

const NOW = Date.parse('2026-06-01T00:00:00.000Z');

describe('field predicates (core)', () => {
  test('string eq / number gte / date ageGte', () => {
    // setup: none — pure values
    // method under test: evaluateFieldPredicate across types
    const eq = evaluateFieldPredicate('Bob', { op: 'eq', value: 'Bob' }, 'string', NOW);
    const gte = evaluateFieldPredicate(21, { op: 'gte', value: 18 }, 'number', NOW);
    const age = evaluateFieldPredicate('2000-01-01', { op: 'ageGte', value: 18 }, 'date', NOW);
    const young = evaluateFieldPredicate('2020-01-01', { op: 'ageGte', value: 18 }, 'date', NOW);

    // assertions: correct truth values, date uses injected now
    expect([eq, gte, age, young]).toEqual([true, true, true, false]);
  });

  test('resolveFieldPath returns [] for missing paths and all array elements', () => {
    // setup: nested attributes with an array
    const attrs = { a: { b: [{ c: 1 }, { c: 2 }] } };

    // method under test: path resolution
    const missing = resolveFieldPath(attrs, 'x.y');
    const many = resolveFieldPath(attrs, 'a.b[].c');

    // assertions: missing → empty, array → every element
    expect(missing).toEqual([]);
    expect(many).toEqual([1, 2]);
  });

  test('predicateHasRequiredValues rejects between without value2', () => {
    // method under test / assertions: operand completeness
    expect(predicateHasRequiredValues('between', 1, undefined)).toBe(false);
    expect(predicateHasRequiredValues('present')).toBe(true);
  });
});
