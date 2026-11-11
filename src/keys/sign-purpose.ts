/**
 * SignPurpose: why one particular sign or derive request is being made, carried to the key's store with the
 * request so its handler (kerits' vault policy, an external store, a nano key component) can decide whether to
 * prompt. `purpose` is opaque here (kerits fills it from the sdk's `SigningPurpose` union); `purposeText` is
 * human-readable text any handler can show.
 *
 * Per request, never stored on a key. Not to be confused with `KeyUse` (acl: signing vs encryption key set)
 * or the sdk's `KeyLabel` (a stored label on a key-store row).
 */
export type SignPurpose = {
  readonly purpose: Readonly<{ type: string }>;
  readonly purposeText: string;
};
