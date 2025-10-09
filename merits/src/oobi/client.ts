import { treaty } from '@elysiajs/eden';
import type { oobiRoutes } from './index';
import type { ResolveOOBIRequest, ResolveOOBIResponse } from './types';

// Type for the combined routes
type OobiApi = typeof oobiRoutes;

export class OOBIClient {
    private client: ReturnType<typeof treaty<OobiApi>>;
    private bran?: string;

    constructor(url: string, bran?: string) {
        this.client = treaty<OobiApi>(url);
        this.bran = bran;
    }

    // Update the bran (useful after receiving it from response headers)
    setBran(bran: string) {
        this.bran = bran;
    }

    // Get the current bran
    getBran(): string | undefined {
        return this.bran;
    }

    // OOBI operations
    async resolveOOBI(request: ResolveOOBIRequest, timeoutMs?: number): Promise<{ response: ResolveOOBIResponse; bran?: string }> {
        const headers: Record<string, string> = {};
        if (timeoutMs) {
            headers['x-timeout'] = timeoutMs.toString();
        }
        if (this.bran) {
            headers['x-keria-bran'] = this.bran;
        }

        const response = await this.client.oobi.resolve.post(request, { headers });

        if (response.error) {
            throw new Error(`Failed to resolve OOBI: ${response.error.value}`);
        }

        // Extract bran from response headers if present
        const responseBran = response.headers?.['x-keria-bran'];
        if (responseBran) {
            this.bran = responseBran; // Update stored bran
        }

        return {
            ...response.data,
            bran: responseBran
        };
    }
}

// Factory function to create client
export const oobiClient = (url: string = 'http://localhost:3001', bran?: string): OOBIClient => {
    return new OOBIClient(url, bran);
};