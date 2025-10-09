import { Elysia } from 'elysia';

export interface AuthContext extends Record<string, unknown> {
    userId: string;
}

/**
 * Middleware that handles bran extraction and generation
 */
export const authContext = new Elysia({ name: 'authMiddleware' })
    .derive({ as: "global" }, (_ctx) => {
        console.log('🔧 [Auth] Middleware derive function called');
        const result: AuthContext = {
            userId: "TODO - auth"
        }
        return result;
    });