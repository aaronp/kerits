# IPEX Signing Implementation Options

## Current State
- IPEX grant messages: JSON only (ACDC + ISS event + ANC event)
- No cryptographic signatures attached
- Validation via SAID integrity only

## Option 1: Minimal CESR - Inline Signatures ⭐ IMPLEMENTING NOW
Store signatures in event metadata (`sigs` field).

**Tasks:**
1. Update `issueCredential()` to sign ISS event, store sigs in metadata
2. Update `createVcp()` to sign VCP event, store sigs in metadata
3. Update `exportIPEX()` to include signatures in ISS/ANC events
4. Add signature verification in `registryDsl.accept()`
5. UI already extracts/displays from `issEvent.sigs`

**Pros:** Quick, JSON-only, works now
**Cons:** Not standard KERI

## Option 2: CESR Streaming - Standard KERI Wire Format
Implement proper CESR: `<event-json>\r\n-<attachment-cesr>`

**Tasks:**
1. Create CESR codec module (`src/cesr/`)
   - Base64 encoding/decoding
   - Parse indexed sigs: `-AAB<sig1><sig2>`
   - Witness receipts: `-CAB<witness-sigs>`
2. Update event creation to attach CESR
3. Update IPEX export/import to parse CESR wire format
4. Implement signature verification (extract keys from KEL, verify against SAID)

**Pros:** Standard KERI, interoperable, supports witnesses
**Cons:** Significant effort, no longer pure JSON

## Option 3: Hybrid - JSON with CESR Strings
Add `_cesr` field containing CESR-encoded attachments as base64 string.

**Pros:** JSON transport, includes CESR sigs
**Cons:** Not standard, still need CESR codec

## Option 4: KERIpy API Backend
Delegate all CESR to KERIpy via API.

**Pros:** Reuses KERIpy, correct crypto
**Cons:** Backend coupling, no client-side operation

## Roadmap
- **Phase 1 (Now):** Option 1 - Get signatures working
- **Phase 2 (Production):** Option 2 - Proper CESR for interoperability
