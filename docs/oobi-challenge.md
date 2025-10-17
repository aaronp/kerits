🔐 Controller-side Flow
1. Create AID and Inception Event

You generate keys and build the inception (icp) event:

{
  "v": "KERI10JSON0000fb_",
  "t": "icp",
  "i": "EDEzWz9wV...lbx",
  "s": "0",
  "kt": "1",
  "k": ["DA8mL9D2k...mQe"],
  "n": "EGsJ7txvY...v8o",
  "bt": "0",
  "b": [],
  "c": [],
  "a": []
}


You sign this event with your private key(s).
The sig attached is already a cryptographic proof that the same keypair created this AID.

However, when publishing, the receiver can’t yet be sure that you are the signer — since anyone could forward this signed event.

2. Receive a Challenge From OOBI Server

Before accepting the posted KEL, the OOBI server challenges you to prove live key control.
It sends something like:

{
  "t": "challenge",
  "a": "EDEzWz9wV...lbx",
  "n": "randomNonce123"
}

3. Sign and Return the Challenge

You sign the nonce using your current signing key(s) from the just-incepted event:

{
  "t": "response",
  "a": "EDEzWz9wV...lbx",
  "n": "randomNonce123",
  "sigs": ["0BDA8mL9D2k...signatureBytes"]
}


This step proves live possession of the private keys tied to the AID.

4. Server Verifies and Accepts the KEL

The OOBI server:

Looks up the current KEL state (from your icp event).

Checks signatures against your current key set k and threshold kt.

If valid → it accepts and stores your KEL as authoritatively controlled by you.

💡 Why This Is Necessary

Without that challenge step, a malicious actor could post a copied KEL belonging to someone else, fooling peers into believing the legitimate controller is reachable at that endpoint.

🧩 Summary
Step	Actor	Action	Proof
1	Controller	Create AID + icp	Signs event
2	OOBI Server	Send random challenge	Nonce
3	Controller	Sign challenge with AID’s keys	Demonstrates live key control
4	Server	Verify sigs meet threshold	Accept and store KEL
✅ Minimal Example Round-Trip
Server → Controller:  CHALLENGE  nonce=R4fWz...
Controller → Server:  RESPONSE  sign(nonce, keys from latest KEL)
Server → OK: Valid signatures (≥ kt)


Result:

OOBI accepts and associates AID EDEzWz9wV...lbx with the published KEL and endpoint — proof of key control established.