An OOBI is just a discovery pointer (URI→AID/SAID) to resources you host about an identifier. What those resources return is typically:

The KEL (or enough of it to bootstrap/catch-up) — e.g., serve the inception event and then a query/reply stream to sync further events/receipts (your KERL). 
trustoverip.github.io
+1

**A compact Key State Notice (KSN) — a summarized, canonical snapshot of the current key state (aid, latest SAID, seq no, current keys, next-commitment, witnesses, etc.). KSNs are defined in the KERI spec and are often delivered inside reply messages. 
IETF Datatracker

(Optionally) role OOBIs (witness/agent/watcher endpoints) so others know where to query and post.


 * GET /oobi/{aid}/icp → inception envelope
 * GET /oobi/{aid}/kel?from=… → event stream (and receipts)
 * GET /oobi/{aid}/ksn → current key state notice
 * (optional) role endpoints (witness/agent)

Keep your full KERL locally; serve KEL + KSN via OOBI so others can verify and sync efficiently. 

