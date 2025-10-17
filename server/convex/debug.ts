/**
 * Debug endpoints for troubleshooting authentication
 */

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { verifyAuth } from './auth';

/**
 * Debug mutation to test signature verification
 *
 * This allows step-by-step testing of the auth flow without side effects
 */
export const debugVerify = mutation({
  args: {
    challengeId: v.string(),
    sigs: v.array(v.string()),
    ksn: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      // Call verifyAuth just like a real mutation would
      await verifyAuth(ctx, {
        challengeId: args.challengeId,
        sigs: args.sigs,
        ksn: args.ksn,
      });

      return {
        success: true,
        message: 'Signature verification successful',
      };
    } catch (error) {
      // Return error details for debugging
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  },
});
