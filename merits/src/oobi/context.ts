import { Elysia } from 'elysia';
import type { ResolveOOBIRequest, ResolveOOBIResponse } from './types';
import { resolveOobiWithClient } from './impl/resolveOobi';

interface OOBIRegistryStore {
    resolve(request: ResolveOOBIRequest, timeoutMs?: number, bran?: string): Promise<ResolveOOBIResponse>;
}

function makeOOBIRegistryStore(): OOBIRegistryStore {
    return {
        async resolve(request: ResolveOOBIRequest, timeoutMs: number = 2000, bran?: string): Promise<ResolveOOBIResponse> {
            return await resolveOobiWithClient(request, timeoutMs, bran);
        },
    };
}

export const oobiContext = new Elysia({ name: 'oobiRegistry' })
    .state('oobiRegistry', makeOOBIRegistryStore())
    .derive(({ store }) => ({
        oobiRegistry: store.oobiRegistry
    }))
    .decorate('oobiRegistry', makeOOBIRegistryStore());