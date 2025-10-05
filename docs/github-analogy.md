# 🧭 Big Picture Analogy: KERI as GitHub for Trust

This analogy helps understand KERI's architecture by mapping its components to familiar GitHub concepts.

## Core Concepts

| KERI Concept | GitHub Analogy | Description |
|--------------|----------------|-------------|
| **KEL (Key Event Log)** | 🪪 Your GitHub account<br/>(your identity, signing keys) | Tracks your key history — who you are, what keys you control, and rotations. |
| **AID (Autonomic Identifier)** | 🧰 Your GitHub username /<br/>SSH key | Your globally verifiable identity, root of trust for all your actions. |
| **Anchoring a TEL in the KEL** | 🔗 Creating a new repository<br/>under your account | You "declare" a new credential registry (TEL) as yours by anchoring it in your KEL. |
| **TEL (Transaction Event Log /<br/>Credential Registry)** | 📁 A GitHub repository | A self-contained, versioned log where you "commit" credential lifecycle events (issue, revoke, etc.). |
| **Witnesses** | 👀 GitHub mirrors or<br/>collaborators with write access | Other AIDs that replicate and receipt your registry — proving it's not just you claiming something. |
| **TEL events**<br/>(iss, rev, upg, …) | 🧾 Commits in the repo | Each event represents a change in credential state (issued, revoked, etc.). |
| **ACDC (Credential)** | 📄 A file or commit content<br/>in that repo | The actual credential payload (the claim) referenced by the TEL events. |
| **Schema** | 📑 File format / contract for<br/>the repo contents | Defines what kind of "files" (credentials) can live in this registry — e.g. Over18, EmployeeBadge, Diploma. |
| **Witness receipts /<br/>validator receipts** | ✅ Pull request approvals<br/>or CI checks | Third parties' signatures proving an event really happened and is logged correctly. |
| **Delegated TEL** | 🧑‍💼 Org-owned repo under<br/>another org's account | Like a sub-repo operated by an entity (registry operator) but ultimately controlled by the parent AID. |

## How It Works Together

### Creating Your Identity
1. **Create your AID** (like setting up a GitHub account)
   - Generate your signing keys
   - Create your inception event
   - Get witnesses to receipt it

2. **Your KEL** (like your GitHub profile)
   - Records all your key rotations
   - Proves your identity over time
   - Can be verified by anyone

### Creating a Credential Registry
1. **Anchor a TEL** (like creating a new repository)
   - Reference the new TEL in a KEL event
   - This "claims ownership" of the registry
   - Witnesses receipt the anchoring

2. **Issue Credentials** (like committing files)
   - Create an issuance event in the TEL
   - Include the credential SAID
   - Witnesses receipt the event

3. **Revoke or Update** (like new commits)
   - Create revocation/update events
   - All changes are logged
   - Witnesses provide receipts

### Verification
When someone wants to verify a credential:

1. **Check the ACDC** (the credential itself)
2. **Find its TEL** (the repository where lifecycle is tracked)
3. **Verify the TEL is anchored** in the issuer's KEL (ownership proof)
4. **Check witness receipts** (third-party confirmations)
5. **Verify no revocation event** exists in the TEL

Just like you can verify:
- A GitHub commit is authentic (signed by the author)
- The commit is in a repo owned by that user
- The repo has backups/mirrors (witnesses)
- The commit hasn't been reverted

## Key Differences from GitHub

While the analogy is helpful, KERI has some unique properties:

- **Decentralized**: No central "GitHub server" — witnesses are independent
- **Cryptographically Verifiable**: Everything is signed and can be verified offline
- **Immutable**: Events can't be deleted or modified, only superseded
- **Self-Certifying**: Your identifier IS your public key (no username registration)
- **Portable**: You can move your identity and registries to different witnesses

## Summary

Think of KERI as:
- **KEL** = Your GitHub account (identity)
- **TEL** = A repository (credential registry)
- **Events** = Commits (state changes)
- **Witnesses** = Mirrors (decentralized backups)
- **ACDCs** = Files (the actual credentials)
- **Schemas** = File formats (credential types)

This architecture provides verifiable, portable, and decentralized trust infrastructure — like a distributed GitHub for credentials instead of code.
