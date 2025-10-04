#!/usr/bin/env bun
/**
 * Test runner for kerits library
 *
 * Reads test cases from ../testgen/test-cases and runs them using the verify commands.
 * This is a generic test runner that executes the commands specified in test cases.
 */

import { file } from 'bun';
import { readdirSync } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';

interface TestCase {
  file: string;
  description: string;
  commands: {
    generate?: string;
    verify: string;
  };
  input: Record<string, any>;
  expected: Record<string, any>;
}

interface TestResult {
  file: string;
  description: string;
  passed: boolean;
  duration: number;
  actual?: any;
  expected?: any;
  error?: string;
  stdout?: string;
  stderr?: string;
}

async function loadTestCases(): Promise<TestCase[]> {
  const testCasesDir = path.join(import.meta.dir, '../../testgen/test-cases');
  const tests: TestCase[] = [];

  try {
    const entries = readdirSync(testCasesDir);

    for (const entry of entries) {
      if (entry.endsWith('.json') && entry.startsWith('test_')) {
        const filePath = path.join(testCasesDir, entry);
        const content = await file(filePath).text();
        const testCase = JSON.parse(content);
        testCase.file = entry;

        // Only load test cases with commands object
        if (testCase.commands && testCase.commands.verify) {
          tests.push(testCase);
        }
      }
    }
  } catch (error) {
    console.error('Error loading test cases:', error);
  }

  return tests.sort((a, b) => a.file.localeCompare(b.file));
}

function runTest(testCase: TestCase): TestResult {
  const startTime = performance.now();
  const result: TestResult = {
    file: testCase.file,
    description: testCase.description,
    passed: false,
    duration: 0,
  };

  try {
    // Get the verify command
    const verifyCmd = testCase.commands.verify;

    // Map Python verify scripts to TypeScript equivalents
    // testgen/scripts/saidify_verify.sh -> kerits/scripts/saidify_verify.sh
    const tsVerifyCmd = verifyCmd.replace(
      /testgen\/scripts\/(\w+)_verify\.sh/,
      'kerits/scripts/$1_verify.sh'
    );

    // Prepare input JSON
    const inputJson = JSON.stringify(testCase.input);

    // Execute the command from project root
    const projectRoot = path.join(import.meta.dir, '../..');
    const result_exec = spawnSync('bash', ['-c', tsVerifyCmd], {
      input: inputJson,
      encoding: 'utf-8',
      cwd: projectRoot,
      shell: false,
    });

    result.stdout = result_exec.stdout;
    result.stderr = result_exec.stderr;

    if (result_exec.status !== 0) {
      result.error = `Command failed with exit code ${result_exec.status}`;
      if (result_exec.stderr) {
        result.error += `: ${result_exec.stderr}`;
      }
      return result;
    }

    // Parse output
    try {
      const actual = JSON.parse(result_exec.stdout.trim());
      result.actual = actual;
      result.expected = testCase.expected;

      // Compare with expected
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(testCase.expected);

      if (actualStr === expectedStr) {
        result.passed = true;
      } else {
        result.error = 'Output does not match expected';
      }
    } catch (parseError) {
      result.error = `Failed to parse output as JSON: ${result_exec.stdout}`;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  result.duration = performance.now() - startTime;
  return result;
}

function printResults(results: TestResult[], totalDuration: number) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0';

  console.log('\n' + '='.repeat(70));
  console.log('KERITS TEST REPORT');
  console.log('='.repeat(70));
  console.log(`Total:     ${total}`);
  console.log(`Passed:    ${passed}`);
  console.log(`Failed:    ${failed}`);
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Duration:  ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('='.repeat(70));

  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    console.log('-'.repeat(70));

    for (const result of results) {
      if (!result.passed) {
        console.log(`\n${result.file}`);
        console.log(`  Description: ${result.description}`);
        if (result.error) {
          console.log(`  Error: ${result.error}`);
        }
        if (result.stderr) {
          console.log(`  stderr: ${result.stderr.substring(0, 200)}`);
        }
        if (result.actual && result.expected) {
          console.log(`  Expected: ${JSON.stringify(result.expected)}`);
          console.log(`  Actual:   ${JSON.stringify(result.actual)}`);

          // Show differences
          const diffs = findDifferences(result.expected, result.actual);
          if (diffs.length > 0) {
            console.log('  Differences:');
            for (const diff of diffs) {
              console.log(`    - ${diff}`);
            }
          }
        }
      }
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

function findDifferences(expected: any, actual: any, path: string = ''): string[] {
  const diffs: string[] = [];

  if (typeof expected !== typeof actual) {
    diffs.push(`${path || 'root'}: type mismatch (expected ${typeof expected}, got ${typeof actual})`);
    return diffs;
  }

  if (expected === null || actual === null) {
    if (expected !== actual) {
      diffs.push(`${path || 'root'}: ${expected} !== ${actual}`);
    }
    return diffs;
  }

  if (typeof expected === 'object' && !Array.isArray(expected)) {
    const allKeys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of allKeys) {
      const newPath = path ? `${path}.${key}` : key;
      if (!(key in expected)) {
        diffs.push(`${newPath}: unexpected field in actual`);
      } else if (!(key in actual)) {
        diffs.push(`${newPath}: missing field in actual`);
      } else {
        diffs.push(...findDifferences(expected[key], actual[key], newPath));
      }
    }
  } else if (Array.isArray(expected)) {
    if (expected.length !== actual.length) {
      diffs.push(`${path}: array length mismatch (expected ${expected.length}, got ${actual.length})`);
    }
    const minLength = Math.min(expected.length, actual.length);
    for (let i = 0; i < minLength; i++) {
      diffs.push(...findDifferences(expected[i], actual[i], `${path}[${i}]`));
    }
  } else if (expected !== actual) {
    diffs.push(`${path || 'root'}: ${JSON.stringify(expected)} !== ${JSON.stringify(actual)}`);
  }

  return diffs;
}

async function main() {
  console.log('Loading test cases...');
  const testCases = await loadTestCases();

  if (testCases.length === 0) {
    console.log('No test cases found!');
    process.exit(1);
  }

  console.log(`Running ${testCases.length} test cases...\n`);

  const startTime = performance.now();
  const results: TestResult[] = [];
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i]!;
    process.stdout.write(`[${i + 1}/${testCases.length}] ${testCase.file}... `);

    const result = runTest(testCase);
    results.push(result);

    if (result.passed) {
      console.log(`✓ PASSED (${result.duration.toFixed(0)}ms)`);
    } else {
      console.log(`✗ FAILED (${result.duration.toFixed(0)}ms)`);
    }
  }
  const totalDuration = performance.now() - startTime;

  printResults(results, totalDuration);
}

main();
