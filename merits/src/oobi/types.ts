import { t } from 'elysia';

export interface ResolveOOBIRequest {
    oobi: string;
    alias?: string;
}

export interface OOBIOperation {
    name: string;
    done: boolean;
}

export interface ResolveOOBIResponse {
    operation: OOBIOperation;
    success: boolean;
}

// Request Schemas
export const ResolveOOBIRequestSchema = t.Object({
    oobi: t.String({ description: 'The OOBI URL to resolve' }),
    alias: t.String({ description: 'Alias for the resolved OOBI' })
});

// Response Schemas
export const OOBIOperationSchema = t.Object({
    name: t.String(),
    done: t.Boolean(),
    response: t.Optional(t.Any())
});

export const ResolveOOBIResponseSchema = t.Object({
    operation: OOBIOperationSchema,
    success: t.Boolean()
});