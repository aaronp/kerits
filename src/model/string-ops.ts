import type { AID, SAID, ALIAS, Threshold } from './types';

/**
 * String operations helper for branded type conversions
 * Provides a fluent API for converting strings to branded types
 *
 * Usage: s('someId').asAID(), s('someHash').asSAID(), etc.
 */
export function s(str: string) {
    return {
        asAID: (): AID => str as AID,
        asSAID: (): SAID => str as SAID,
        asALIAS: (): ALIAS => str as ALIAS,
        asThreshold: (): Threshold => str as Threshold,
    };
}
