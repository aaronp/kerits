# CESR Signing Issues and Solutions

## Overview
This document summarizes the challenges encountered while implementing CESR signature verification in the KERI TEL system, particularly when running in Bun environment.

## Issues Encountered

### 1. **libsodium Compatibility with Bun**
- **Problem**: `cesr-ts` library depends on `libsodium` which has compatibility issues with Bun
- **Error**: `TypeError: libsodium.crypto_sign_seed_keypair is not a function`
- **Attempted Solutions**:
  - Direct use of `cesr-ts` CesrSigner and CesrVerfer classes
  - Trying to configure libsodium for Bun environment
- **Result**: Failed - libsodium doesn't work reliably in Bun

### 2. **@noble/ed25519 Import Issues**
- **Problem**: Incorrect import syntax for @noble/ed25519
- **Error**: `SyntaxError: Export named 'ed25519' not found in module '@noble/ed25519/index.js'`
- **Solution**: Changed from `import { ed25519 } from '@noble/ed25519'` to `import * as ed25519 from '@noble/ed25519'`

### 3. **SHA512 Hash Function Configuration**
- **Problem**: @noble/ed25519 requires explicit SHA512 configuration
- **Error**: `warn: hashes.sha512 not set`
- **Attempted Solutions**:
  - Setting `ed25519.etc.hashes = { sha512 }` (incorrect)
  - Setting `ed25519.etc.sha512Sync` and `ed25519.etc.sha512` (incorrect)
- **Solution**: Direct assignment `ed25519.hashes.sha512 = sha512`

### 4. **CESR Signature Format Mismatch**
- **Problem**: @noble/ed25519 expects raw 64-byte signatures, but CESR uses code + base64url format
- **Error**: `warn: expected Uint8Array of length 64, got length=66`
- **Solution**: Implemented `encodeSignature()` and `decodeSignature()` methods to convert between CESR format and raw Ed25519 format

### 5. **Public Key Encoding/Decoding**
- **Problem**: CESR public keys use base64url encoding with code prefixes (D/B)
- **Error**: `warn: Invalid CESR signature format` when trying to decode
- **Solution**: Implemented `encodePublicKeyNoble()` and `decodePublicKey()` methods for CESR format handling

### 6. **Signature Verification Logic Issues**
- **Problem**: TEL envelope verification was using keypair public keys instead of signature public keys
- **Impact**: Tests for public key tampering detection were failing
- **Solution**: Updated `TEL.verifyEnvelope` to always use the public key from the signature for verification

### 7. **Controller State Validation**
- **Problem**: Signature verification didn't validate that signature public keys match controller state
- **Impact**: Wrong controller state tests were passing when they should fail
- **Solution**: Added dual validation - both signature validity AND key matching controller state

## Key Findings

### **@noble/ed25519 vs libsodium**
- **@noble/ed25519**: Pure JavaScript implementation, works well in Bun
- **libsodium**: Native bindings, problematic in Bun environment
- **cesr-ts**: Built for libsodium, requires fallback implementation for Bun

### **CESR Format Peculiarities**
- CESR signatures: `0B` (transferable) or `0A` (non-transferable) + base64url encoded 64-byte signature
- CESR public keys: `D` (transferable) or `B` (non-transferable) + base64url encoded 32-byte key
- Base64url uses `-` and `_` instead of `+` and `/`, and omits padding `=`

### **Bun Environment Challenges**
- Bun's module resolution differs from Node.js
- Some native dependencies don't work out of the box
- Need fallback implementations for cryptographic operations

## Final Implementation Strategy

1. **Primary**: Use `cesr-ts` when available (for Node.js compatibility)
2. **Fallback**: Use `@noble/ed25519` with custom CESR format handling (for Bun)
3. **Validation**: Always verify both signature validity AND controller state matching
4. **Error Handling**: Graceful degradation with detailed error messages

## Code Structure

```typescript
// Primary method with fallback
static async verify(signature: string, data: Uint8Array, verferQb64: string, rawPublicKey?: Uint8Array): Promise<boolean> {
    try {
        return await CESR.verifyWithNoble(signature, data, verferQb64, rawPublicKey);
    } catch (fallbackError) {
        console.warn('CESR verification failed with @noble/ed25519:', fallbackError);
        return false;
    }
}
```

This approach ensures compatibility across different JavaScript runtimes while maintaining security guarantees.
