/**
 * Core error types
 *
 * These error classes provide a consistent error hierarchy across the CLI and core packages.
 * Each error includes a code for programmatic handling and optional details for debugging.
 */

/**
 * Base error class for all core errors
 */
export class CoreError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(message: string, code: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Validation errors - invalid input or configuration
 */
export class ValidationError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND', details);
  }
}

/**
 * Conflict errors - resource already exists or state conflict
 */
export class ConflictError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT', details);
  }
}

/**
 * Permission/access denied errors
 */
export class PermissionError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'PERMISSION_DENIED', details);
  }
}

/**
 * Network communication errors
 */
export class NetworkError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
  }
}

/**
 * Threshold not met errors - multisig operations
 */
export class ThresholdError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'THRESHOLD_NOT_MET', details);
  }
}

/**
 * Cryptographic verification errors
 */
export class VerificationError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'VERIFICATION_FAILED', details);
  }
}

/**
 * Controller not found errors - no identity loaded
 */
export class ControllerNotFoundError extends CoreError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONTROLLER_NOT_FOUND', details);
  }
}

/**
 * Error codes for vault operations
 */
export const VaultErrorCode = {
  /** Vault append operation failed (e.g., due to unstaged git changes) */
  VAULT_APPEND_FAILED: 'VAULT_APPEND_FAILED',

  /** Vault key not found */
  VAULT_KEY_NOT_FOUND: 'VAULT_KEY_NOT_FOUND',

  /** Vault corruption or invalid state */
  VAULT_CORRUPTED: 'VAULT_CORRUPTED',

  /** Vault permission denied */
  VAULT_PERMISSION_DENIED: 'VAULT_PERMISSION_DENIED',
} as const;

export type VaultErrorCode = (typeof VaultErrorCode)[keyof typeof VaultErrorCode];

/**
 * Error codes for KEL operations
 */
export const KelErrorCode = {
  /** KEL append operation failed */
  KEL_APPEND_FAILED: 'KEL_APPEND_FAILED',

  /** KEL event verification failed */
  KEL_VERIFICATION_FAILED: 'KEL_VERIFICATION_FAILED',

  /** KEL sequence error */
  KEL_SEQUENCE_ERROR: 'KEL_SEQUENCE_ERROR',

  /** KEL not found */
  KEL_NOT_FOUND: 'KEL_NOT_FOUND',
} as const;

export type KelErrorCode = (typeof KelErrorCode)[keyof typeof KelErrorCode];

/**
 * Error codes for validation
 */
export const ValidationErrorCode = {
  /** Invalid threshold */
  INVALID_THRESHOLD: 'INVALID_THRESHOLD',

  /** Invalid key format */
  INVALID_KEY_FORMAT: 'INVALID_KEY_FORMAT',

  /** Invalid signature */
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',

  /** Missing required field */
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  /** Invalid AID format */
  INVALID_AID: 'INVALID_AID',

  /** Invalid SAID format */
  INVALID_SAID: 'INVALID_SAID',
} as const;

export type ValidationErrorCode = (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

/**
 * Combined error code type
 */
export type ErrorCode = VaultErrorCode | KelErrorCode | ValidationErrorCode;

/**
 * Structured validation error with rich context
 */
export interface StructuredValidationError {
  /** Error type identifier */
  type: 'validation';

  /** Error code for programmatic handling */
  code: ErrorCode | string;

  /** Human-readable error message */
  message: string;

  /** Additional context about the error */
  details?: {
    /** Field that failed validation */
    field?: string;

    /** Expected value or format */
    expected?: string;

    /** Actual value received */
    actual?: string;

    /** Any other relevant details */
    [key: string]: unknown;
  };
}

/**
 * Create a structured validation error
 */
export function createStructuredValidationError(
  code: ErrorCode | string,
  message: string,
  details?: StructuredValidationError['details'],
): StructuredValidationError {
  return {
    type: 'validation',
    code,
    message,
    details,
  };
}

/**
 * Type guard for StructuredValidationError
 */
export function isStructuredValidationError(error: unknown): error is StructuredValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'validation' &&
    'code' in error &&
    'message' in error
  );
}
