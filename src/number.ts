/**
 * Number utilities for KERI
 *
 * Provides conversion between integers and hex string representations
 * used in KERI key event messages.
 */

/**
 * Convert a non-negative integer to lowercase hex string without leading zeros
 *
 * Used for sequence numbers (s), thresholds (kt, nt, bt), and other numeric fields
 * in KERI events.
 *
 * @param num - Non-negative integer
 * @returns Lowercase hex string without leading zeros (e.g., 0 → "0", 15 → "f", 255 → "ff")
 *
 * @example
 * numToHex(0)   // "0"
 * numToHex(1)   // "1"
 * numToHex(15)  // "f"
 * numToHex(16)  // "10"
 * numToHex(255) // "ff"
 */
export function numToHex(num: number): string {
  if (num < 0) {
    throw new Error(`Invalid num = ${num}, must be non-negative`);
  }
  if (!Number.isInteger(num)) {
    throw new Error(`Invalid num = ${num}, must be an integer`);
  }

  return num.toString(16);
}

/**
 * Convert a hex string to integer
 *
 * @param hex - Hex string (with or without leading zeros)
 * @returns Integer value
 *
 * @example
 * hexToNum("0")   // 0
 * hexToNum("f")   // 15
 * hexToNum("10")  // 16
 * hexToNum("ff")  // 255
 */
export function hexToNum(hex: string): number {
  const num = parseInt(hex, 16);
  if (isNaN(num)) {
    throw new Error(`Invalid hex string: ${hex}`);
  }
  return num;
}
