/** Domain-level single-artifact publish status for non-KEL publishers. */
export type PublishStatus = { readonly status: 'published' | 'updated' };

/** Error from a non-KEL publish operation. */
export type PublishError =
  | { readonly kind: 'rejected'; readonly message: string }
  | { readonly kind: 'protocol-error'; readonly message: string; readonly code?: string }
  | { readonly kind: 'transport-error'; readonly message: string };
