/**
 * Golden file testing utilities
 *
 * Supports saving, loading, and comparing golden file snapshots
 * for regression testing of KEL operations
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { KelSnapshot } from '../snapshot';
import { Data } from '../../data/data';

/**
 * Save a snapshot to a golden file
 *
 * @param filePath - Path to save the golden file
 * @param snapshot - Snapshot to save
 */
export async function saveGolden(filePath: string, snapshot: KelSnapshot): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Pretty print for readability (2-space indent)
    const json = JSON.stringify(snapshot, null, 2);
    await fs.writeFile(filePath, json, 'utf-8');
}

/**
 * Load a snapshot from a golden file
 *
 * @param filePath - Path to the golden file
 * @returns The snapshot, or null if file doesn't exist
 */
export async function loadGolden(filePath: string): Promise<KelSnapshot | null> {
    try {
        const json = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(json) as KelSnapshot;
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return null; // File doesn't exist
        }
        throw err;
    }
}

/**
 * Compare two snapshots and return a human-readable diff
 *
 * Uses canonical JSON comparison for deterministic results
 *
 * @param actual - Actual snapshot
 * @param expected - Expected snapshot
 * @returns Diff description, or null if equal
 */
export function diffSnapshots(actual: KelSnapshot, expected: KelSnapshot): string | null {
    const { text: actualText } = Data.fromJson(actual).canonicalize();
    const { text: expectedText } = Data.fromJson(expected).canonicalize();

    if (actualText === expectedText) {
        return null; // Snapshots are equal
    }

    // For now, return a simple character-by-character diff indicator
    // In the future, this could use a proper diff algorithm
    const minLen = Math.min(actualText.length, expectedText.length);
    let firstDiff = 0;
    while (firstDiff < minLen && actualText[firstDiff] === expectedText[firstDiff]) {
        firstDiff++;
    }

    const context = 50;
    const start = Math.max(0, firstDiff - context);
    const end = Math.min(actualText.length, firstDiff + context);

    return `Snapshots differ at position ${firstDiff}:
Expected: ...${expectedText.slice(start, end)}...
Actual:   ...${actualText.slice(start, end)}...

Full diff:
Expected length: ${expectedText.length}
Actual length:   ${actualText.length}`;
}

/**
 * Assert that actual matches expected, with golden file update support
 *
 * If UPDATE_GOLDEN env var is set, saves the actual snapshot as the new golden file
 * Otherwise, loads the golden file and asserts equality
 *
 * @param filePath - Path to the golden file (relative to project root, e.g., 'test/golden/kel/my-test.json')
 * @param actual - Actual snapshot from the test
 * @throws Error if snapshots don't match and UPDATE_GOLDEN is not set
 *
 * @example
 * await assertMatchesGolden('test/golden/kel/inception.json', snapshot);
 */
export async function assertMatchesGolden(
    filePath: string,
    actual: KelSnapshot
): Promise<void> {
    const shouldUpdate = process.env.UPDATE_GOLDEN === '1' || process.env.UPDATE_GOLDEN === 'true';

    if (shouldUpdate) {
        // Update mode: save the actual snapshot as the new golden file
        await saveGolden(filePath, actual);
        console.log(`✓ Updated golden file: ${filePath}`);
        return;
    }

    // Check mode: load and compare
    const expected = await loadGolden(filePath);

    if (!expected) {
        throw new Error(
            `Golden file not found: ${filePath}\n` +
            `Run with UPDATE_GOLDEN=1 to create it.`
        );
    }

    const diff = diffSnapshots(actual, expected);
    if (diff) {
        throw new Error(
            `Snapshot mismatch:\n${diff}\n\n` +
            `File: ${filePath}\n` +
            `Run with UPDATE_GOLDEN=1 to accept the new snapshot.`
        );
    }
}

/**
 * Helper for round-trip testing: dump -> load -> dump -> compare
 *
 * Verifies that snapshots are stable across serialization
 *
 * @param snapshot1 - First snapshot
 * @param snapshot2 - Second snapshot (after round-trip)
 * @throws Error if snapshots don't match
 */
export function assertRoundTrip(snapshot1: KelSnapshot, snapshot2: KelSnapshot): void {
    const diff = diffSnapshots(snapshot1, snapshot2);
    if (diff) {
        throw new Error(`Round-trip failed:\n${diff}`);
    }
}
