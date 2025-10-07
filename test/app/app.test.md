# Privacy-Preserving Health Workflow with Nested TELs  
### KERI / ACDC End-to-End Scenario  

**Goal**  
Demonstrate nested TELs, data minimisation, privacy, and verifiable multi-party actions using only KERI / ACDC / TEL primitives.  

**Style**  
Descriptive spec (no code). Each step lists what happens and what to assert / verify.  

**Determinism**  
All data / inputs **must** be deterministic so SAIDs are stable (idempotent & referentially transparent).  

---

## 1️⃣ Actors & High-Level Roles
| Alias | Role | Description |
|-------|------|-------------|
| **alice** | Patient / Subject | Owns private registries and self-certified data |
| **bob** | Spouse | Issues a credential about Alice (“habits”) |
| **doctor-eleanor** | Practitioner | Issues public `isHealthy` attestation referencing Alice’s private data by SAID |
| **insurance-kathy** | Verifier | Validates doctor’s public attestation without accessing PII |

Each actor controls a KERI AID with its own KEL (Key Event Log).

**Assertions**
- Every actor has a valid `icp` event (signature verifies).  
- AID prefixes resolve and KELs are readable.  
- SAIDs for inception events are reproducible across runs.  

---

## 2️⃣ Registries (TELs) & Schemas (ACDC Schemas)
- **TEL** – Credential registry (Trust Event Log) anchored by TEL events (`tel_icp`, issue / grant, revoke).  
- **ACDC** – Authentic Chained Data Container, identified by SAID and validated by schema.  
- **Edges (`e`)** – Links between ACDCs / TELs by SAID.

**Global Invariants**
- Canonical JSON and fixed field ordering for all signed material.  
- Deterministic identifiers (aliases, schema names).  
- Every issuance anchored in a TEL (status verifiable).  
- No mutable state outside signed events affects SAIDs.  

---

## 3️⃣ Scenario Overview
1. Alice creates private **health TEL** and self-issues “about-me” credential.  
2. Alice creates nested **family TEL** under health.  
3. Bob creates **wife TEL** and issues **habits credential** about Alice.  
4. Bob exports habits → Alice imports into family TEL.  
5. Doctor-Eleanor creates **patients TEL** and imports Alice’s family entries.  
6. Doctor-Eleanor issues public **isHealthy** attestation in **public TEL**, referencing Alice’s habits credential by SAID (PII-free).  
7. Doctor-Eleanor exports that attestation → Alice anchors it in her health TEL.  
8. Insurance-Kathy verifies the attestation and traverses TEL graph to confirm provenance without PII.  

---

## 4️⃣ Detailed Steps & Assertions

### Step 1 – Create Identities
**Action** Create AIDs for `alice`, `bob`, `doctor-eleanor`, `insurance-kathy`.  
**Assert**
- Each has valid `icp`.  
- Keys resolve in KEL.  
- SAIDs deterministic.

---

### Step 2 – Alice creates `health` TEL
**Action** `tel_icp(health)` (no parent).  
**Assert**
- Event exists & verifies.  
- SAID stable.  
- Registry resolves by alias + SAID.

---

### Step 3 – Alice creates schema `about-me` & self-issues credential
**Action**
- Define schema (one field `name`).  
- Issue credential `ACDC_aboutMe` in `health` TEL with `{ name:"Alice A." }`.  
**Assert**
- Schema SAID recomputes identically.  
- Credential SAID deterministic; signature valid.  
- Anchoring recorded in `health`.  
- No PII leak beyond `name`.  

---

### Step 4 – Alice creates nested `family` TEL under `health`
**Action** `tel_icp(family)` with parent edge to `health`.  
**Assert**
- Edge references `health` SAID.  
- Parent-child nesting traversable.  
- SAIDs stable.  

---

### Step 5 – Bob creates `wife` TEL and `habits` schema
**Action**
- `tel_icp(wife)` (no parent).  
- Define schema `habits` { drinksPerWeek :number, smokes :boolean }.  
- Issue `ACDC_habits` in `wife` TEL about Alice → `{ 5, true }`.  
**Assert**
- `wife` TEL valid.  
- Schema & credential SAIDs recompute identically.  
- Credential anchored in `wife`; signed by Bob.  
- Subject AID = Alice’s AID.  
- No extra PII exposed.  

---

### Step 6 – Bob exports habits → Alice imports into `family` TEL
**Action** Serialize & import credential unchanged.  
**Assert**
- SAID identical pre/post.  
- Anchor appears in `family` TEL.  
- Signatures unchanged.  
- Import events verifiable.  

---

### Step 7 – Doctor-Eleanor creates `patients` TEL
**Action** `tel_icp(patients)`.  
**Assert**
- Valid event + SAID.  
- KEL/TEL cross-reference consistent.  

---

### Step 8 – Alice exports `family` → Doctor imports into `patients`
**Action**
- Alice exports selected entries (e.g. `ACDC_habits`).  
- Doctor imports into `patients`.  
**Assert**
- Imported entries retain SAIDs.  
- No content mutation; signatures still verify.  
- `patients` TEL records import anchors deterministically.  

---

### Step 9 – Doctor issues public `isHealthy:true` attestation (edge→habits)
**Action**
- If needed, `tel_icp(public)`.  
- Issue `ACDC_isHealthy` with `{ isHealthy:true, issued_at, expiry }`.  
- Edge section `e.subject.n = SAID(ACDC_habits)`.  
**Assert**
- `public` TEL anchoring event present.  
- Credential signed by Doctor Eleanor.  
- Edge points exactly to `ACDC_habits`.  
- Status = issued, not revoked, within expiry.  
- No habits fields leaked.  

---

### Step 10 – Doctor exports attestation → Alice anchors in `health`
**Action** Export `ACDC_isHealthy`; Alice anchors in `health`.  
**Assert**
- SAID identical to original.  
- Signature valid.  
- `health` TEL contains anchor to `isHealthy`.  
- Graph traversal from `health` reaches `public` via edge chain without revealing PII.  

---

### Step 11 – Verification by Insurance-Kathy
**Action**
1. Fetch `ACDC_isHealthy` from `public` (or Alice’s `health`).  
2. Validate doctor’s signature and AID via KEL.  
3. Check TEL status (not revoked, within expiry).  
4. Confirm `e.subject.n == SAID(ACDC_habits)`.  
5. Traverse SAID chain `public → patients → family → habits → wife`.  
**Assert**
- All signatures valid.  
- SAID graph consistent.  
- No private data access required for verification.  

---

## 5️⃣ Privacy & Data-Minimisation Guarantees
- `isHealthy` contains no PII — only SAID edge.  
- Cross-party imports preserve SAIDs and signatures.  
- Validation by SAID matching + signatures + status, never by raw content.  
- Private fields remain under Alice’s control.  

---

## 6️⃣ Required Assertions Checklist
- Determinism → identical SAIDs on rerun.  
- All signatures verify (KEL, TEL, ACDC).  
- Registry hierarchy correct (family ⊂ health, patients/public ⊂ doctor, wife ⊂ bob).  
- Every credential anchored in expected TEL.  
- Edge correctness → `isHealthy.e.subject.n = habits SAID`.  
- Status valid (not revoked, unexpired).  
- Graph traversal verifiable via SAIDs only.  
- No PII leakage in doctor / insurer contexts.  

---

## 7️⃣ Optional Extensions
- **Revocation:** Doctor revokes `isHealthy`; verifier must fail status check.  
- **Expiry test:** Simulate expired credential.  
- **Selective disclosure:** Alice reveals partial fields to show SAID change.  
- **Audit graph:** Export Mermaid/DOT graph of SAIDs & issuers (no PII).  
- **Policy tests:** Add TEL rules and assert enforcement.  

---

## 8️⃣ Artifacts per Step
For each step capture:
- Inputs (actor, TEL alias/parent, schema JSON, credential attributes).  
- Produced IDs (AID prefixes, TEL / schema / credential SAIDs).  
- Events (`icp`, `tel_icp`, issuance, anchor, import, revocation).  
- Signatures (detached or embedded).  
- Verification log (PASS/FAIL for each assertion).  

---

## 9️⃣ Success Criteria
- All assertions pass.  
- Independent verifier (insurance-kathy) can validate `isHealthy` without PII.  
- Reruns produce identical SAIDs for every artifact.  

---

## 🔟 Glossary
**AID** – Autonomic Identifier.  
**KEL** – Key Event Log.  
**TEL** – Trust Event Log (credential registry).  
**ACDC** – Authentic Chained Data Container (credential).  
**SAID** – Self-Addressing Identifier (digest of content).  
**Edge (`e`)** – Link from one ACDC to another or TEL object by SAID.  
**Anchor** – TEL event binding credential SAID for issue / revoke status.  
