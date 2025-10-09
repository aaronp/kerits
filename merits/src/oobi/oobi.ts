import { Elysia, t } from 'elysia';
import type { ResolveOOBIRequest } from './types';
import {
    ResolveOOBIRequestSchema,
    ResolveOOBIResponseSchema,
} from './types';
import { oobiContext } from './context';
import { authContext } from '../middleware/auth';

export const oobiRoutes = new Elysia({ prefix: '/oobi' })
    .use(authContext)
    .use(oobiContext)
    // Resolve OOBI
    .post('/resolve', async ({ body, oobiRegistry, headers, userId }) => {
        const request = body as ResolveOOBIRequest;
        const timeoutMs = headers['x-timeout'] ? parseInt(headers['x-timeout'] as string, 10) : 2000;
        const response = await oobiRegistry.resolve(request, timeoutMs, bran);
        return { response };
    }, {
        body: ResolveOOBIRequestSchema,
        response: {
            201: t.Object({
                response: ResolveOOBIResponseSchema
            })
        },
        detail: {
            tags: ['OOBI'],
            description: 'Resolve an Out-of-Band Introduction (OOBI)',
        },
    })