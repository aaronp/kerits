# Use https://revealjs.com/


# 0. Overview

In the finance sector, vLEIs and KERI offers a clear separation of concerns and responsibilitis needed to give people a great user experience while not compromising on KYC/KYB/AML due diligence.

To demonstrate this, we've worked on both halves of the problem:

1. Governance: A means to easily issue and accept credentials between parties 

2. Usage: A means for asset issuers to trust those credentials to control issued assets
  (and which the holders of those assets can use with simplicity)


What's more, they both need to go together. We learned from Napster that people didn't want to steal music - they just wanted the path of least resistance for access to their music, and were happy to pay for it when iTunes first came along.

To unlock the power of digital assets, we need to marry up strong governance concerns (safety, security, transparency, protections) with an amazing, simple user-experience.


# 0.1 Disclaimer

This is all proof-of-concept, exploratory demo-ware.
There are bugs, short-cuts, and lots of missing features.
Everything shown is open-source, open for comment, and makes no claims or warrenties.

It was built to get the best constructive feedback possible from as many disparate viewpoints as possible.

Aso, "I still don't get it" is great feedback!

# 1.1 Governance (KYC/KYB, AML, Compliance, ...)

Finance at scale is difficult.

Not only are there a lot of moving parts (regulations, checks, audits, sanctions, ..), but they're all constantly changing, and changing differently per jurisdiction.

KERI provides a means to handle that complexity, while still giving end-users ownership of their data by providing a means of discretionary information disclosure with audit lineage.

1.1 Getting started - our first attempt

At first, we just wanted to be able to easily issue and accept credentials.

GLEIF provide great training materials with their [trainging](https://github.com/GLEIF-IT/vlei-trainings) repo.

Our first attempt was to simply encapsulte what was done in that training behind a kind of "backend-for-frontend" API that would better represent the higher-level user actions.

Unfortunately, that wasn't as easy as we first thought. There were some subtle issues which were difficult to troubleshoot - particularly being neophytes to not only KERI, but the specific services built with the reference training.

Given KERI (and software in general) is just a means of producing and consuming data, we took the decision to pivot. 

At it's core, KERI/vLEIs is about trust -- being in control of your data, and making things so simple that there are obviously no issues, rather than so complex there are no obvious issues. (see C. A. R. Hoare: there are two ways to build a software design:
"make it so simple that there are no obvious deficiencies, or make it so complicated that there are no obvious deficiencies")

1.2 Our Pivot/Rethink

We just wanted to simply issue and accept credentials, and want anyone to have to run servers to do it.

This lead us to designing "KERITS" - Keri for Typescript. (It was only after we started that we learned there's already a Keri-TS initiative underway, focused on a CESR implementation. D'oh!)

1.3 Building Kerits

Knowing we ultimately wanted a seemless, simple user experience, this is the design we came up with:


```                                                     
                       ┌───────────────────┐                       
                       │ Merits API        │                       
                       └───────────────────┘                       
                                                                   
                       ┌────┐ ┌─────┐ ┌────┐                       
                       │CLI │ │WebUI│ │MCP │                       
                       └────┘ └─────┘ └────┘                       
                       ┌───────────────────┐       ┌────────────┐  
                       │ DSL               │    ┌─►│DiskKV      │  
                       └───────────────────┘    │  └────────────┘  
                       ┌───────────────────┐    │  ┌────────────┐  
                       │Storage            ┼────┼─►│IndexedDBKV │  
                       └───────────────────┘    │  └────────────┘  
     ┌─────────┐       ┌───────────────────┐    │                  
     │  Keripy ├──┬───►│ Kerits            │    │   ...            
     └─────────┘  │    └───────────────────┘    │                  
                  │                             │  ┌────────────┐  
                  │                             └─►│..SQL-KV... │  
           ┌───────────────┐                       └────────────┘  
           │   shared      │                                       
           │   regression  │                                       
           │   tests       │                                       
           └───────────────┘                                       
                                                                   
```

1.3.1 Kerits Core

We created a set of tests based on json inputs and expected outputs.

We wrote a custom test-running to exercise the keripy python codebase, 
as well as a typescript test-runner which used the same inputs and expected exactly the same outputs.
(We wrote Kerits in a purely-functional approach)

Now we can use a common data-set which both the keripy python can kerits can both run, and allow us to keep up with keripy changes

(Note: Our test-running is in a fork of keripy [here](https://github.com/aaronp/keripy))

Keripy:

```
> make test
Running keripy Python tests...
Running 75 test cases...

[1/75] test_cesr_blake3_256.json... ✓ PASSED (210ms)
[2/75] test_cesr_ed25519_seed.json... ✓ PASSED (124ms)
[3/75] test_cesr_ed25519_verkey.json... ✓ PASSED (125ms)
[4/75] test_cesr_ed25519_verkey_nt.json... ✓ PASSED (149ms)
[5/75] test_cesr_number_short.json... ✓ PASSED (123ms)
[6/75] test_cesr_salt_256.json... ✓ PASSED (123ms)
[7/75] test_cesr_var_string.json... ✓ PASSED (126ms)
[8/75] test_credential_001.json... ✓ PASSED (36ms)
[9/75] test_credential_002.json... ✓ PASSED (26ms)
[10/75] test_credential_003.json... ✓ PASSED (25ms)
[11/75] test_credential_004.json... ✓ PASSED (27ms)
[12/75] test_credential_005.json... ✓ PASSED (25ms)
[13/75] test_diger_001.json... ✓ PASSED (125ms)
[14/75] test_diger_002.json... ✓ PASSED (121ms)
[15/75] test_diger_003.json... ✓ PASSED (124ms)
[16/75] test_diger_004.json... ✓ PASSED (124ms)
[17/75] test_incept_001.json... ✓ PASSED (128ms)
[18/75] test_incept_002.json... ✓ PASSED (125ms)
[19/75] test_incept_003.json... ✓ PASSED (124ms)
[20/75] test_receipt_001.json... ✓ PASSED (130ms)
[21/75] test_receipt_002.json... ✓ PASSED (126ms)
[22/75] test_receipt_003.json... ✓ PASSED (126ms)
[23/75] test_rotate_001.json... ✓ PASSED (29ms)
[24/75] test_rotate_002.json... ✓ PASSED (26ms)
[25/75] test_rotate_003.json... ✓ PASSED (30ms)
[26/75] test_rotate_004.json... ✓ PASSED (28ms)
[27/75] test_saidify_001.json... ✓ PASSED (289ms)
[28/75] test_saidify_002.json... ✓ PASSED (239ms)
[29/75] test_saidify_003.json... ✓ PASSED (233ms)
[30/75] test_schema_001.json... ✓ PASSED (26ms)
[31/75] test_schema_002.json... ✓ PASSED (25ms)
[32/75] test_schema_003.json... ✓ PASSED (25ms)
[33/75] test_schema_004.json... ✓ PASSED (26ms)
[34/75] test_schema_005.json... ✓ PASSED (33ms)
[35/75] test_sign_001.json... ✓ PASSED (62ms)
[36/75] test_sign_002.json... ✓ PASSED (55ms)
[37/75] test_sign_003.json... ✓ PASSED (53ms)
[38/75] test_sign_004.json... ✓ PASSED (53ms)
[39/75] test_sign_005.json... ✓ PASSED (54ms)
[40/75] test_signer_001.json... ✓ PASSED (139ms)
[41/75] test_signer_002.json... ✓ PASSED (137ms)
[42/75] test_signer_003.json... ✓ PASSED (132ms)
[43/75] test_signer_004.json... ✓ PASSED (126ms)
[44/75] test_signer_005.json... ✓ PASSED (127ms)
[45/75] test_tel_bis_001.json... ✓ PASSED (146ms)
[46/75] test_tel_bis_002.json... ✓ PASSED (136ms)
[47/75] test_tel_bis_003.json... ✓ PASSED (132ms)
[48/75] test_tel_brv_001.json... ✓ PASSED (179ms)
[49/75] test_tel_brv_002.json... ✓ PASSED (157ms)
[50/75] test_tel_brv_003.json... ✓ PASSED (150ms)
[51/75] test_tel_iss_001.json... ✓ PASSED (167ms)
[52/75] test_tel_iss_002.json... ✓ PASSED (153ms)
[53/75] test_tel_iss_003.json... ✓ PASSED (162ms)
[54/75] test_tel_ixn_001.json... ✓ PASSED (28ms)
[55/75] test_tel_ixn_002.json... ✓ PASSED (26ms)
[56/75] test_tel_ixn_003.json... ✓ PASSED (28ms)
[57/75] test_tel_rev_001.json... ✓ PASSED (141ms)
[58/75] test_tel_rev_002.json... ✓ PASSED (132ms)
[59/75] test_tel_rev_003.json... ✓ PASSED (137ms)
[60/75] test_tel_vcp_001.json... ✓ PASSED (148ms)
[61/75] test_tel_vcp_002.json... ✓ PASSED (149ms)
[62/75] test_tel_vcp_003.json... ✓ PASSED (148ms)
[63/75] test_tel_vrt_001.json... ✓ PASSED (143ms)
[64/75] test_tel_vrt_002.json... ✓ PASSED (143ms)
[65/75] test_tel_vrt_003.json... ✓ PASSED (147ms)
[66/75] test_tel_vrt_004.json... ✓ PASSED (144ms)
[67/75] test_tel_vrt_005.json... ✓ PASSED (136ms)
[68/75] test_verify_001.json... ✓ PASSED (132ms)
[69/75] test_verify_002.json... ✓ PASSED (127ms)
[70/75] test_verify_003.json... ✓ PASSED (126ms)
[71/75] test_versify_001.json... ✓ PASSED (139ms)
[72/75] test_versify_002.json... ✓ PASSED (143ms)
[73/75] test_versify_003.json... ✓ PASSED (154ms)
[74/75] test_versify_004.json... ✓ PASSED (127ms)
[75/75] test_versify_005.json... ✓ PASSED (131ms)

======================================================================
TEST REPORT
======================================================================
Timestamp:  2025-10-09T23:14:36.532753
Mode:       verify
Total:      75
Passed:     75
Failed:     0
Pass Rate:  100.0%
Duration:   8.43s
======================================================================

Full report saved to: testgen/test-report.json
```


And then the exact same thing on kerits (except 5x faster):
```
make test
Running compatibility tests...
Loading test cases...
Running 75 test cases...

[1/75] test_cesr_blake3_256.json... ✓ PASSED (21ms)
[2/75] test_cesr_ed25519_seed.json... ✓ PASSED (18ms)
[3/75] test_cesr_ed25519_verkey_nt.json... ✓ PASSED (18ms)
[4/75] test_cesr_ed25519_verkey.json... ✓ PASSED (17ms)
[5/75] test_cesr_number_short.json... ✓ PASSED (17ms)
[6/75] test_cesr_salt_256.json... ✓ PASSED (17ms)
[7/75] test_cesr_var_string.json... ✓ PASSED (17ms)
[8/75] test_credential_001.json... ✓ PASSED (19ms)
[9/75] test_credential_002.json... ✓ PASSED (19ms)
[10/75] test_credential_003.json... ✓ PASSED (20ms)
[11/75] test_credential_004.json... ✓ PASSED (19ms)
[12/75] test_credential_005.json... ✓ PASSED (19ms)
[13/75] test_diger_001.json... ✓ PASSED (18ms)
[14/75] test_diger_002.json... ✓ PASSED (19ms)
[15/75] test_diger_003.json... ✓ PASSED (18ms)
[16/75] test_diger_004.json... ✓ PASSED (19ms)
[17/75] test_incept_001.json... ✓ PASSED (19ms)
[18/75] test_incept_002.json... ✓ PASSED (19ms)
[19/75] test_incept_003.json... ✓ PASSED (20ms)
[20/75] test_receipt_001.json... ✓ PASSED (16ms)
[21/75] test_receipt_002.json... ✓ PASSED (15ms)
[22/75] test_receipt_003.json... ✓ PASSED (16ms)
[23/75] test_rotate_001.json... ✓ PASSED (19ms)
[24/75] test_rotate_002.json... ✓ PASSED (19ms)
[25/75] test_rotate_003.json... ✓ PASSED (19ms)
[26/75] test_rotate_004.json... ✓ PASSED (19ms)
[27/75] test_saidify_001.json... ✓ PASSED (17ms)
[28/75] test_saidify_002.json... ✓ PASSED (18ms)
[29/75] test_saidify_003.json... ✓ PASSED (17ms)
[30/75] test_schema_001.json... ✓ PASSED (20ms)
[31/75] test_schema_002.json... ✓ PASSED (19ms)
[32/75] test_schema_003.json... ✓ PASSED (19ms)
[33/75] test_schema_004.json... ✓ PASSED (20ms)
[34/75] test_schema_005.json... ✓ PASSED (18ms)
[35/75] test_sign_001.json... ✓ PASSED (52ms)
[36/75] test_sign_002.json... ✓ PASSED (51ms)
[37/75] test_sign_003.json... ✓ PASSED (51ms)
[38/75] test_sign_004.json... ✓ PASSED (50ms)
[39/75] test_sign_005.json... ✓ PASSED (51ms)
[40/75] test_signer_001.json... ✓ PASSED (30ms)
[41/75] test_signer_002.json... ✓ PASSED (30ms)
[42/75] test_signer_003.json... ✓ PASSED (31ms)
[43/75] test_signer_004.json... ✓ PASSED (30ms)
[44/75] test_signer_005.json... ✓ PASSED (30ms)
[45/75] test_tel_bis_001.json... ✓ PASSED (25ms)
[46/75] test_tel_bis_002.json... ✓ PASSED (26ms)
[47/75] test_tel_bis_003.json... ✓ PASSED (24ms)
[48/75] test_tel_brv_001.json... ✓ PASSED (23ms)
[49/75] test_tel_brv_002.json... ✓ PASSED (24ms)
[50/75] test_tel_brv_003.json... ✓ PASSED (23ms)
[51/75] test_tel_iss_001.json... ✓ PASSED (24ms)
[52/75] test_tel_iss_002.json... ✓ PASSED (24ms)
[53/75] test_tel_iss_003.json... ✓ PASSED (24ms)
[54/75] test_tel_ixn_001.json... ✓ PASSED (25ms)
[55/75] test_tel_ixn_002.json... ✓ PASSED (24ms)
[56/75] test_tel_ixn_003.json... ✓ PASSED (24ms)
[57/75] test_tel_rev_001.json... ✓ PASSED (24ms)
[58/75] test_tel_rev_002.json... ✓ PASSED (24ms)
[59/75] test_tel_rev_003.json... ✓ PASSED (23ms)
[60/75] test_tel_vcp_001.json... ✓ PASSED (25ms)
[61/75] test_tel_vcp_002.json... ✓ PASSED (24ms)
[62/75] test_tel_vcp_003.json... ✓ PASSED (23ms)
[63/75] test_tel_vrt_001.json... ✓ PASSED (25ms)
[64/75] test_tel_vrt_002.json... ✓ PASSED (24ms)
[65/75] test_tel_vrt_003.json... ✓ PASSED (24ms)
[66/75] test_tel_vrt_004.json... ✓ PASSED (24ms)
[67/75] test_tel_vrt_005.json... ✓ PASSED (24ms)
[68/75] test_verify_001.json... ✓ PASSED (19ms)
[69/75] test_verify_002.json... ✓ PASSED (18ms)
[70/75] test_verify_003.json... ✓ PASSED (20ms)
[71/75] test_versify_001.json... ✓ PASSED (16ms)
[72/75] test_versify_002.json... ✓ PASSED (16ms)
[73/75] test_versify_003.json... ✓ PASSED (14ms)
[74/75] test_versify_004.json... ✓ PASSED (15ms)
[75/75] test_versify_005.json... ✓ PASSED (16ms)

======================================================================
KERITS TEST REPORT
======================================================================
Total:     75
Passed:    75
Failed:    0
Pass Rate: 100.0%
Duration:  1.72s
======================================================================
```



# 1.4 Example use-case: issuing GBP stable-coins for only legal adults can use


We wanted to have a practical, easy to understand use-case to demonstrate the separation of concerns of:

1. someone attesting residency (jurisdiction)
2. someone attesting adulthood (e.g. over 18 in the UK, over 21 in the USA) while still protecting sensitive data (your date-of-birth)

Proof of age is a great, common example. 

Currently people are used to giving up a lot of personal information (their name, address, date-of-birth) by showing state-issued IDs, only to just answer the question "is this person old enough" in certain scenarios. A prime example of convenience (showing a license) winning out over privacy or even efficacy (people can fake drivers licenses)

# 1.4.1 

We're going to demonstrate a separation of trust and responsibilities:

1. an entity attesting age
2. an entity attesting jurisdiction
3. an entity consuming those attestations to issue a digital asset

To do this, we're going to use the [Kerits UI](https://aaronp.github.io/kerits/) to start from scratch. You should be able to follow along in the same way.

1. create the users:
  a. 'DVLA' to attest age
  b. 'HMRC' to attest UK residency
  c. 'Alice' to be the subject buying the adult stablecoins
  d. 'Issuer' consuming the KYC checks and issuing the stablecoins

2. set up the schemas



The user-flow is:

 * create a new identity
 *






2. What we did
  a. false start with BFF
  b. kerits
    i. keripy regression tests
    ii. kerits architecture - core keri functions -> storage -> DSL -> UI / CLI
  c. keritokens
    i. simple reference to KERI AID
    ii. separation of governance and issued tokens
  d. MCP
  e. merits
  f. STEX





This is what's in my head for the story I think (or I would like) to tell with this submission:
**The importance of trust + convenience, and what is possible when you strike the right balance**
1. Trust:
Requires many things, principally of which are clarity and transparency, and a clear separation of concerns (no conflicts of interest)
Show:
* "kerits" -- the core KERI foundation, claims and attestations of information, and data privacy
* "smart tokens" : STEX exchange and KeriTokens for digital assets.separates the concerns of token issuance from KYC/KYB
responsibilities
2. Convenience:
Mostly people will do what's easiest. Napster wasn't about stealing music - people were happy to pay when iTunes came about.
C. A. R. Hoare famously stated there are two ways to build a software design:
"make it so simple that there are no obvious deficiencies, or make it so complicated that there are no obvious deficiencies"
Our submission tries to demonstrate in very simple terms the strong, secure foundations on which we can build robust and


Show:
* "MCP agents" (software artefact):
easily just ask "Is this person on a sanctions list? Is this person allowed to transact on behalf of a company? What is the LEl for this company, and does LSEG acknowledge that? Show me the proof that John Doe is not a politically exposed person"
* "merits" (API software artefact): a secure peer-to-peer channel to sync latest KERI data (e.g. "Do I have Jane Doe's latest identity, or has her private key been compromised?")
* Token Issuance flow (user flow): Issuers not having to re-do or re-onboard recipients
* End users (user flow): Asset holders can simply buy/sell/ transfer digital assets seemlessly and safely, while still protecting their information
* Regulators / Auditors (user flow): The know the due diligence is handled, current, and easily traceable
