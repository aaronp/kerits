# IPEX (Issuance and Presentation Exchange Protocol)

## What is IPEX?

IPEX is a peer-to-peer protocol for exchanging verifiable credentials using **exchange messages (exn)**. It provides structured workflows for requesting, offering, issuing, and receiving credentials between parties.

IPEX uses 6 message types:
- **apply** - Request a credential
- **offer** - Offer a credential (response or initiating)
- **agree** - Accept an offered credential
- **grant** - Issue credential with full attachments (ACDC + TEL + KEL)
- **admit** - Acknowledge received credential
- **spurn** - Reject any message

## Why is IPEX Needed?

**Without IPEX** (current implementation):
- Credentials shared via direct SAID/JSON copy-paste
- No structured request/response flow
- Manual coordination between issuer and holder
- Works for simple sharing scenarios

**With IPEX**:
- Formal peer-to-peer exchange protocol
- Cryptographically signed messages
- Chain validation (messages must respond to prior messages)
- Support for multi-step workflows (request → offer → agree → grant → admit)
- Rejection handling (spurn messages)
- Audit trail of exchange process

## Current Status

**✅ Implemented**: IPEX message builder foundation in [src/ipex.ts](../src/ipex.ts)

**❌ Not Integrated**: IPEX DSL, message storage, UI, signature verification

**🔄 Alternative**: Use `RegistryDSL.accept()` for simple credential import without IPEX exchange flow

## Key Use Cases

### Use Case 1: Job Application (Full IPEX Flow)

**Scenario**: Applicant requests employment verification, employer issues credential

```typescript
// 1. Applicant applies for credential
const apply = createApply({
  sender: applicantAid,
  recipient: employerAid,
  schema: employmentSchemaId,
  message: 'Requesting employment verification for 2020-2023',
  attributes: { years: '2020-2023' }
});
// Send apply message to employer

// 2. Employer offers credential
const offer = createOffer({
  sender: employerAid,
  recipient: applicantAid,
  credential: employmentAcdc,
  message: 'Offering employment verification',
  priorMessage: apply.d
});
// Send offer message to applicant

// 3. Applicant agrees to accept
const agree = createAgree({
  sender: applicantAid,
  recipient: employerAid,
  message: 'Accepting employment verification',
  priorMessage: offer.d
});
// Send agree message to employer

// 4. Employer grants full credential with attachments
const grant = createGrant({
  sender: employerAid,
  recipient: applicantAid,
  credential: employmentAcdc,
  issEvent: issEventFromTEL,
  ancEvent: ixnEventFromKEL,
  message: 'Granting employment verification',
  priorMessage: agree.d
});
// Send grant message to applicant

// 5. Applicant admits receipt
const admit = createAdmit({
  sender: applicantAid,
  recipient: employerAid,
  message: 'Acknowledging receipt',
  priorMessage: grant.d
});
// Send admit message to employer
```

### Use Case 2: Credential Rejection

**Scenario**: Applicant requests credential but employer denies

```typescript
// 1. Applicant applies
const apply = createApply({
  sender: applicantAid,
  recipient: employerAid,
  schema: employmentSchemaId
});

// 2. Employer spurns (rejects) request
const spurn = createSpurn({
  sender: employerAid,
  recipient: applicantAid,
  reason: 'Insufficient employment history',
  priorMessage: apply.d
});
// Send spurn message to applicant
```

### Use Case 3: Direct Grant (No Request)

**Scenario**: Employer proactively issues credential to employee

```typescript
// Employer initiates with grant (no prior apply/offer/agree)
const grant = createGrant({
  sender: employerAid,
  recipient: employeeAid,
  credential: employmentAcdc,
  issEvent: issEventFromTEL,
  ancEvent: ixnEventFromKEL,
  message: 'Issuing employment verification'
  // No priorMessage - initiating exchange
});

// Employee admits receipt
const admit = createAdmit({
  sender: employeeAid,
  recipient: employerAid,
  priorMessage: grant.d
});
```

## Message Chain Validation

IPEX enforces strict chaining rules:

```
Valid Chains:
  apply → offer → agree → grant → admit
  offer → agree → grant → admit  (offer initiates)
  grant → admit                   (grant initiates)

Valid Rejections:
  apply → spurn
  offer → spurn
  agree → spurn
  grant → spurn
```

**Chain Validation Example**:
```typescript
import { validateChain } from 'kerits/ipex';

const validation = validateChain(agree, offer);
if (!validation.valid) {
  console.error('Invalid chain:', validation.errors);
  // Errors: ['Invalid response: agree cannot respond to apply']
}
```

## IPEX vs Direct Import

| Feature | IPEX | Direct Import (`accept()`) |
|---------|------|---------------------------|
| **Message Flow** | Structured workflow | Single operation |
| **Signatures** | Cryptographically signed | None |
| **Request/Offer** | Supported | N/A |
| **Rejection** | Spurn messages | N/A |
| **Audit Trail** | Full exchange history | None |
| **Complexity** | High | Low |
| **Use Case** | Formal exchanges | Simple sharing |

**When to use IPEX:**
- Multi-party exchanges requiring formal protocol
- Need audit trail of request/offer/grant process
- Credential marketplace scenarios
- Compliance requirements for exchange process

**When to use Direct Import:**
- Simple credential sharing
- Trusted parties
- Internal credential movement
- Development/testing

## Implementation Reference

### Core Functions

**File**: [src/ipex.ts](../src/ipex.ts)

```typescript
// Create messages
createApply(params: IpexApplyParams): ExchangeMessage
createOffer(params: IpexOfferParams): ExchangeMessage
createAgree(params: IpexAgreeParams): ExchangeMessage
createGrant(params: IpexGrantParams): ExchangeMessage
createAdmit(params: IpexAdmitParams): ExchangeMessage
createSpurn(params: IpexSpurnParams): ExchangeMessage

// Validation
validateChain(message: ExchangeMessage, priorMessage?: ExchangeMessage): ValidationResult

// Parsing
parseExchangeMessage(raw: string): ExchangeMessage
```

### Message Structure

All IPEX messages use the `exn` (exchange) event type:

```typescript
{
  v: 'KERI10JSON000xxx_',  // Version string
  t: 'exn',                 // Type: exchange
  d: 'E...',                // Message SAID
  i: 'E...',                // Sender AID
  rp: 'E...',               // Recipient AID
  p: 'E...',                // Prior message SAID (or empty)
  dt: '2024-10-07...',      // ISO 8601 timestamp
  r: '/ipex/apply',         // Route (message type)
  q: {},                    // Query modifiers
  a: {                      // Attributes (message-specific)
    m: 'message text',
    // ... other fields
  },
  e: {                      // Embeds (optional - credentials, events)
    acdc: {...},
    iss: {...},
    anc: {...}
  }
}
```

## Testing

**Test Generator**: [testgen/generators/gen_ipex.sh](../../testgen/generators/gen_ipex.sh)

IPEX test generation requires keripy habitat objects, making it complex. The message builder in [src/ipex.ts](../src/ipex.ts) creates correctly-formatted IPEX messages with proper SAID computation and chaining.

## Future Integration

To fully integrate IPEX into the DSL:

1. **Add IPEX methods to AccountDSL**:
   ```typescript
   interface AccountDSL {
     sendApply(params: ApplyParams): Promise<ExchangeMessage>;
     sendOffer(params: OfferParams): Promise<ExchangeMessage>;
     listMessages(): Promise<ExchangeMessage[]>;
     // ...
   }
   ```

2. **Store exchange messages**: Add `exn` message storage to KerStore

3. **Build UI**: Inbox/outbox for sent/received messages

4. **Add signature verification**: Verify message signatures

5. **Create IPEX handler**: Process incoming messages and trigger workflows

## See Also

- [DSL Documentation](./dsls.md) - Full DSL API reference
- [Revocation Flow](./dsls.md#use-case-2b-credential-revocation-and-import-flow) - Credential lifecycle
- [IPEX Source](../src/ipex.ts) - Message builder implementation
- [KERI IPEX Spec](https://weboftrust.github.io/ietf-ipex/) - Official specification
