import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { incept, rotate, schema, credential, diger, CESR, registryIncept, issue } from '../lib/keri';
import type { StoredIdentity, StoredSchema, StoredCredential, SchemaField } from '../lib/storage';

/**
 * Creates a new identity with a random mnemonic.
 * Returns the identity data including KEL, keypairs, and mnemonic.
 */
export async function createIdentity(alias: string): Promise<StoredIdentity> {
  const mnemonic = generateMnemonic(256);
  const seed = mnemonicToSeedSync(mnemonic);

  // Derive current and next keypairs
  const currentSeed = seed.subarray(0, 32);
  const nextSeed = seed.subarray(32, 64);

  const currentKeypair = await CESR.generateKeypairFromSeed(currentSeed);
  const nextKeypair = await CESR.generateKeypairFromSeed(nextSeed);
  const nextKeyDigest = diger(nextKeypair.publicKey);

  // Create inception event
  const inceptionEvent = incept({
    keys: [currentKeypair.verfer],
    ndigs: [nextKeyDigest],
  });

  return {
    alias,
    prefix: inceptionEvent.pre,
    mnemonic,
    currentKeys: {
      public: currentKeypair.verfer,
      private: Buffer.from(currentKeypair.privateKey).toString('hex'),
      seed: Buffer.from(currentSeed).toString('hex'),
    },
    nextKeys: {
      public: nextKeypair.verfer,
      private: Buffer.from(nextKeypair.privateKey).toString('hex'),
      seed: Buffer.from(nextSeed).toString('hex'),
    },
    inceptionEvent: inceptionEvent.ked,
    kel: [inceptionEvent.ked],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates a schema with the given fields.
 * Returns the schema data including SAID and fields.
 */
export function createSchema(
  name: string,
  description: string,
  fields: SchemaField[]
): StoredSchema {
  const schemaEvent = schema({
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: name,
    description,
    properties: fields.reduce((acc, field) => {
      acc[field.name] = { type: field.type };
      return acc;
    }, {} as Record<string, any>),
    required: fields.filter(f => f.required).map(f => f.name),
    additionalProperties: false,
  });

  return {
    id: schemaEvent.said,
    name,
    description,
    fields,
    schema: schemaEvent.sed,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Issues a credential from issuer to recipient using the given schema and data.
 * Returns the credential with TEL (registry inception + issuance event).
 */
export function issueCredential(
  issuer: StoredIdentity,
  recipient: StoredIdentity,
  credentialSchema: StoredSchema,
  data: Record<string, any>
): StoredCredential {
  // Create credential ACDC
  const cred = credential({
    schema: credentialSchema.id,
    issuer: issuer.prefix,
    recipient: recipient.prefix,
    data,
  });

  // Create registry inception
  const registry = registryIncept({
    issuer: issuer.prefix,
  });

  // Create issuance event
  const issuanceEvent = issue({
    vcdig: cred.said,
    regk: registry.regk,
  });

  return {
    id: cred.said,
    issuer: issuer.prefix,
    recipient: recipient.prefix,
    schema: credentialSchema.id,
    sad: cred.sad,
    tel: [registry.sad, issuanceEvent.sad],
    registry: registry.regk,
    data,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Verifies a credential by checking:
 * - SAID matches the credential digest
 * - Issuer prefix matches
 * - Recipient prefix matches
 * - Schema ID matches
 * - TEL has both registry inception and issuance events
 */
export function verifyCredential(
  cred: StoredCredential,
  expectedIssuer: string,
  expectedRecipient: string,
  expectedSchema: string
): boolean {
  // Verify credential SAID
  if (cred.id !== cred.sad.d) {
    return false;
  }

  // Verify issuer
  if (cred.issuer !== expectedIssuer || cred.sad.i !== expectedIssuer) {
    return false;
  }

  // Verify recipient
  if (cred.recipient !== expectedRecipient) {
    return false;
  }

  // Verify schema
  if (cred.schema !== expectedSchema || cred.sad.s !== expectedSchema) {
    return false;
  }

  // Verify TEL structure (should have 2 events: registry inception + issuance)
  if (!cred.tel || cred.tel.length !== 2) {
    return false;
  }

  return true;
}

/**
 * Verifies KEL structure for an identity.
 * Checks that the KEL has at least the inception event and the prefix matches.
 */
export function verifyKEL(identity: StoredIdentity): boolean {
  // KEL should have at least inception event
  if (!identity.kel || identity.kel.length === 0) {
    return false;
  }

  // First event should be inception
  const inceptionEvent = identity.kel[0];
  if (inceptionEvent.t !== 'icp') {
    return false;
  }

  // Prefix should match
  if (identity.prefix !== inceptionEvent.pre && identity.prefix !== inceptionEvent.i) {
    return false;
  }

  return true;
}

/**
 * Verifies TEL structure for a credential.
 * Checks that TEL has registry inception and issuance events.
 */
export function verifyTEL(cred: StoredCredential): boolean {
  if (!cred.tel || cred.tel.length !== 2) {
    return false;
  }

  const [registryEvent, issuanceEvent] = cred.tel;

  // Check registry inception event
  if (registryEvent.t !== 'vcp') {
    return false;
  }

  // Check issuance event
  if (issuanceEvent.t !== 'iss') {
    return false;
  }

  // Check that issuance references the credential
  if (issuanceEvent.i !== cred.sad.d) {
    return false;
  }

  return true;
}
