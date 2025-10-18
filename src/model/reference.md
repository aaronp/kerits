Here’s a structured breakdown of references \+ guidance \+ suggestions for how to present / link KERI, KEL, TEL, ACDC etc from your LLMs or project. Happy to help you refine this into a diagram or spec as well.

---

## **Good canonical references**

Here are a few that are strong starting points (and suitable for linking in your project or model docs):

| Reference | Why it’s useful / what it covers | Notes / caveats |
| ----- | ----- | ----- |
| **KERI Glossary (Identity.foundation)** | Authoritative definitions of KERI terms including KEL, TEL, duplicates, validators, etc. [identity.foundation](https://identity.foundation/keri/docs/Glossary.html?utm_source=chatgpt.com) | Good baseline for consistent terminology |
| **ACDC Specification (TrustOverIP draft / IETF draft)** | Formal spec of ACDC, linking it to KERI, and describing issuance, revocation, linking, selective disclosure, etc. [trustoverip.github.io+1](https://trustoverip.github.io/tswg-acdc-specification/?utm_source=chatgpt.com) | Use the latest version; treat as evolving |
| **“KERI jargon in a nutshell: SAID & ACDC”** | More approachable, narrative explanation of how ACDCs tie into KEL/TEL and SAID semantics. [Medium](https://medium.com/finema/keri-jargon-in-a-nutshell-part-2-said-and-acdc-de6bc544b95e?utm_source=chatgpt.com) | Good for linking in less formal contexts (e.g. blog, guides) |
| **Security Analysis of KERI (Del Giudice, 2025\)** | Deep dive into KERI’s security model, KAWA, validator roles, tradeoffs etc. [Research Collection](https://www.research-collection.ethz.ch/bitstreams/616a4158-0aac-4eda-96a8-f93505c4eb5d/download?utm_source=chatgpt.com) | Good for motivating design choices and understanding limits |
| **OOBI (Out-Of-Band Introduction) draft** | Covers discovery bootstrapping (how you map AIDs/SAIDs to service endpoints) [IETF](https://www.ietf.org/archive/id/draft-ssmith-oobi-00.html?utm_source=chatgpt.com) | Useful to link to “bootstrapping” in your architecture |
| **KERI Overview / modular architecture slides** (Samuel Smith) | Good summary of component breakdown: KEL, VDR, registry, etc. [GitHub](https://raw.githubusercontent.com/SmithSamuelM/Papers/master/presentations/KERI2_Overview.web.pdf?utm_source=chatgpt.com) | Use as a lightweight reference in documentation |

You may choose one or two of these as *official reference links* in your project, plus some explanatory / tutorial links as auxiliary.

---

## **Conceptual architecture: how KEL, TEL, ACDC, etc relate and should behave**

Below is how I’d describe (and implement) the components, from a system / architectural lens. You can embed a diagram showing “KEL ⇄ TEL ⇄ ACDC issuance & verification”.

### **Core Entities & Concepts**

1. **KEL (Key Event Log / Receipt Infrastructure)**

   * Each *controller* (an entity owning a KERI identifier) has a Key Event Log (KEL).

   * The KEL is the source of truth for that identifier’s key rotation, inception, sequence of events (rotations, delegations, etc.).

   * All events in KEL are cryptographically signed and chained so that the log is tamper-evident.

   * Anyone verifying operations tied to that identifier will reference the KEL to check key validity, history, etc.

2. **TEL (Transaction Event Log / registry log)**

   * A TEL is an external registry of *transactions* (e.g. issuance, revocation, status changes) for ACDCs (or other credential-like objects).

   * The TEL is anchored into the issuer’s KEL — i.e. when an event is recorded in the TEL, there is a cryptographic commitment into the issuer’s KEL. Thus, the registry state is provable relative to the issuer’s identity. (See “registry state by reference to controlling KEL” in Glossary) [identity.foundation](https://identity.foundation/keri/docs/Glossary.html?utm_source=chatgpt.com)

   * Verifiers consult a TEL to check status (revoked or not) or to audit credential issuance history.

3. **ACDC (Authentic Chained Data Container)**

   * ACDC is a credential / data container format designed to work with KERI, providing *authenticity*, provenance, chaining, selective disclosure, etc. [IETF+2trustoverip.github.io+2](https://www.ietf.org/archive/id/draft-ssmith-acdc-02.html?utm_source=chatgpt.com)

   * It has fields such as `v` (version), `d` (its SAID), `i` (issuer AID), and links to a status registry `ri`, and the schema (via SAID) etc. [Medium](https://medium.com/finema/keri-jargon-in-a-nutshell-part-2-said-and-acdc-de6bc544b95e?utm_source=chatgpt.com)

   * The issuance and revocation events of that ACDC are recorded into a TEL, anchored to the issuer’s KEL. [Medium+1](https://medium.com/finema/keri-jargon-in-a-nutshell-part-2-said-and-acdc-de6bc544b95e?utm_source=chatgpt.com)

   * ACDC supports chaining (credential graphs) and selective disclosure / graduated disclosure (you can choose partial content disclosure while preserving verifiability). [Medium+1](https://medium.com/finema/keri-jargon-in-a-nutshell-part-2-said-and-acdc-de6bc544b95e?utm_source=chatgpt.com)

4. **SAID (Self-Addressing Identifier)**

   * Many of the identifiers (for ACDC, for sub-blocks, for schema, etc.) are based on SAIDs, meaning they commit to the content’s digest. This gives integrity and cryptographic binding to content. [Medium+2IETF+2](https://medium.com/finema/keri-jargon-in-a-nutshell-part-2-said-and-acdc-de6bc544b95e?utm_source=chatgpt.com)

   * Because of SAIDs, a signature over the top-level ACDC binds to all blocks referenced therein (directly or via SAIDs).

5. **OOBI / Bootstrapping / Discovery**

   * OOBI (Out-Of-Band Introduction) is a protocol / draft to allow mapping a URI / URL to an AID (or SAID), so one can bootstrap discovery of KERI-derived information. [IETF](https://www.ietf.org/archive/id/draft-ssmith-oobi-00.html?utm_source=chatgpt.com)

   * The OOBI is not inherently trusted; it is a discovery mechanism. What is returned via that endpoint must be verified in-band via KERI / ACDC protocols.

---

### **How the flows / mechanics should work**

Here's a rough sketch of interactions and operational constraints you might adopt in your system:

1. **Identifier initialization / inception**

   * A controller creates an identifier by creating an inception event in its KEL (specifying initial keys, witnesses, etc.).

   * That event is published / propagated so that others can validate the identifier’s initial state.

2. **Key rotation / updates**

   * When the controller needs to rotate keys, it produces a rotation event in the KEL, chaining from prior state, signed by the old key.

   * The updated KEL is then propagated to validators, watchers, etc.

3. **Issuance of an ACDC**

   * The issuer (with its identifier / KEL) crafts an ACDC credential, with appropriate fields and schema, and signs it.

   * The issuer also logs an issuance event into a TEL (a registry), anchoring it to its KEL via a cryptographic commitment.

   * That TEL entry ties the issuance event to the issuer’s identity (KEL).

4. **Revocation / status update**

   * If the issuer wants to revoke or change status of an ACDC, it appends a revocation event into the TEL.

   * Verifiers inspecting the credential check the TEL's status for that ACDC to see if it’s still valid.

5. **Verification by a third party**

   * Given a presented ACDC, the verifier:

     1. Validates the signature and the SAID binding.

     2. Fetches or has the issuer’s KEL (or enough prefix) to confirm the issuer’s current key and that no conflicting events (duplication) exist.

     3. Consults the TEL for the credential’s status (revoked or not).

     4. (Optionally) In a selective disclosure scenario, ensures the disclosed subset content matches the SAID commitments, etc.

6. **Chaining / delegation**

   * ACDCs may reference (“edge links”) other ACDCs to express relationships (e.g. delegation, request → grant → claim). [IETF+1](https://www.ietf.org/archive/id/draft-ssmith-acdc-02.html?utm_source=chatgpt.com)

   * This forms a DAG of credentials (not necessarily a simple linear chain).

   * Delegated authority or credentials can propagate through that graph; each link is verifiable.

7. **Witnesses / validation / duplicity detection**

   * In KERI, controllers may choose witnesses that also receive and attest to events.

   * Validators or watchers observe KELs and look for *duplicitous events* (inconsistent forks) or conflicting state. The glossary mentions “duplicitous event log” (DEL) to capture inconsistent events. [identity.foundation](https://identity.foundation/keri/docs/Glossary.html?utm_source=chatgpt.com)

   * The system must guard against multiple conflicting histories for the same identifier.

   * Note: the specification intentionally leaves parts of validator / confirmation infrastructure underspecified (like how to coordinate watchers, jurors, judges) so implementers have flexibility. [Research Collection+2IETF+2](https://www.research-collection.ethz.ch/bitstreams/616a4158-0aac-4eda-96a8-f93505c4eb5d/download?utm_source=chatgpt.com)

