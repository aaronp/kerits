# Core ACL

See **[acl.md](../../../../acl.md)** (repo root) for the AccessControls / AclTree usage guide with snippets and test links.

Immutable `AclTree` + `Acl` namespace: named nodes flatten to key sets; privilege roots map `(system, op) → nodeId`.

## Pieces

| Module | Role |
|--------|------|
| `AclTree` / `Acl.*` | Pure graph ops (return new trees) |
| `AccessControls` / `projectAccessControls` | Flat `{read,write,admin}` + `tip`; `version` = privilege **node SAID** (`aclHash`) |
| `slotKeysSaid` / `accessControlsTip` | `tip` = keys-commitment SAID (local≡remote via `tipsMatch`; not for `isValid`) |
| `path-acl` (`resolveClosestAclPrefix`, `acceptPathWrite`, `acceptAclPut`) | Hierarchical KVS prefix walk + accept |
| `Snapshot` / `importSnapshot` | Legacy key-set hash; prefer AccessControls |
| `kerits-acl-msg/1` | Signed write/admin (`aclHash` = slot `version`, never tip) |
| `check` / `isValid` / `applyAdmin` | Pure auth against one slot (`version` + keys) |

AID→keys lookup is optional at resolve/project time (KEL). **Entity holds `AclTree`**; remotes store **AccessControls** and run `isValid(slot, msg)`.

**Next remote work:** R2 KVS prefix→system AccessControls + `isValid` (spec §5) — not in this package yet.

## Remotes

| Remote | Projection | Accept |
|--------|------------|--------|
| R2 members | `…/members-acl` AccessControls | `POST /publish/members` + `aclMessage` |
| Merits InMemory / Spacetime | per-topic AccessControls | `isValid` on write/admin; system owns store |

## Wire

See plan `docs/superpowers/plans/2026-09-23-signed-acl-accept.md` — Unix ms, Blake3 SAID digest, Ed25519 CESR, signature excluded from signed input.
