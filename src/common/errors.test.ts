import { describe, expect, it } from 'bun:test';
import {
  ConflictError,
  ControllerNotFoundError,
  CoreError,
  createStructuredValidationError,
  isStructuredValidationError,
  KelErrorCode,
  NetworkError,
  NotFoundError,
  PermissionError,
  ThresholdError,
  ValidationError,
  ValidationErrorCode,
  VaultErrorCode,
  VerificationError,
} from './errors.js';

describe('CoreError', () => {
  it('sets code and message', () => {
    const e = new CoreError('msg', 'CODE');
    expect(e.message).toBe('msg');
    expect(e.code).toBe('CODE');
    expect(e.name).toBe('CoreError');
  });

  it('stores optional details', () => {
    const e = new CoreError('msg', 'CODE', { foo: 1 });
    expect(e.details).toEqual({ foo: 1 });
  });
});

describe('error subclasses', () => {
  it('ValidationError has code VALIDATION_ERROR', () => {
    const e = new ValidationError('bad');
    expect(e.code).toBe('VALIDATION_ERROR');
    expect(e instanceof CoreError).toBe(true);
  });

  it('NotFoundError has code NOT_FOUND', () => {
    expect(new NotFoundError('x').code).toBe('NOT_FOUND');
  });

  it('ConflictError has code CONFLICT', () => {
    expect(new ConflictError('x').code).toBe('CONFLICT');
  });

  it('PermissionError has code PERMISSION_DENIED', () => {
    expect(new PermissionError('x').code).toBe('PERMISSION_DENIED');
  });

  it('NetworkError has code NETWORK_ERROR', () => {
    expect(new NetworkError('x').code).toBe('NETWORK_ERROR');
  });

  it('ThresholdError has code THRESHOLD_NOT_MET', () => {
    expect(new ThresholdError('x').code).toBe('THRESHOLD_NOT_MET');
  });

  it('VerificationError has code VERIFICATION_FAILED', () => {
    expect(new VerificationError('x').code).toBe('VERIFICATION_FAILED');
  });

  it('ControllerNotFoundError has code CONTROLLER_NOT_FOUND', () => {
    expect(new ControllerNotFoundError('x').code).toBe('CONTROLLER_NOT_FOUND');
  });
});

describe('error code consts', () => {
  it('VaultErrorCode has expected keys', () => {
    expect(VaultErrorCode.VAULT_APPEND_FAILED).toBe('VAULT_APPEND_FAILED');
    expect(VaultErrorCode.VAULT_KEY_NOT_FOUND).toBe('VAULT_KEY_NOT_FOUND');
  });

  it('KelErrorCode has expected keys', () => {
    expect(KelErrorCode.KEL_APPEND_FAILED).toBe('KEL_APPEND_FAILED');
  });

  it('ValidationErrorCode has expected keys', () => {
    expect(ValidationErrorCode.INVALID_AID).toBe('INVALID_AID');
  });
});

describe('createStructuredValidationError', () => {
  it('returns a structured error', () => {
    const err = createStructuredValidationError('INVALID_AID', 'bad aid', { field: 'i' });
    expect(err.type).toBe('validation');
    expect(err.code).toBe('INVALID_AID');
    expect(err.message).toBe('bad aid');
    expect(err.details?.field).toBe('i');
  });
});

describe('isStructuredValidationError', () => {
  it('returns true for valid structured error', () => {
    const err = createStructuredValidationError('CODE', 'msg');
    expect(isStructuredValidationError(err)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(isStructuredValidationError(new Error('x'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isStructuredValidationError(null)).toBe(false);
  });
});
