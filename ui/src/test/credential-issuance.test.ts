import { describe, test, expect } from 'vitest';
import {
  createIdentity,
  createSchema,
  issueCredential,
  verifyCredential,
  verifyKEL,
  verifyTEL,
} from './helpers';

describe('End-to-End Credential Issuance', () => {
  test('should create identities, schema, issue and verify credential', async () => {
    // Create issuer and holder identities
    const issuer = await createIdentity('University Registrar');
    const holder = await createIdentity('Alice Student');

    // Verify issuer KEL
    expect(verifyKEL(issuer)).toBe(true);
    expect(issuer.kel).toHaveLength(1);
    expect(issuer.kel[0].t).toBe('icp');

    // Verify holder KEL
    expect(verifyKEL(holder)).toBe(true);
    expect(holder.kel).toHaveLength(1);
    expect(holder.kel[0].t).toBe('icp');

    // Create a simple schema for degree credential
    const degreeSchema = createSchema(
      'University Degree',
      'A credential representing a university degree',
      [
        { name: 'degree', type: 'string', required: true },
        { name: 'major', type: 'string', required: true },
        { name: 'gpa', type: 'number', required: true },
        { name: 'graduationDate', type: 'date', required: true },
      ]
    );

    expect(degreeSchema.id).toBeTruthy();
    expect(degreeSchema.name).toBe('University Degree');
    expect(degreeSchema.fields).toHaveLength(4);

    // Issue credential from issuer to holder
    const credential = issueCredential(issuer, holder, degreeSchema, {
      degree: 'Bachelor of Science',
      major: 'Computer Science',
      gpa: 3.8,
      graduationDate: '2024-05-15',
    });

    // Verify credential structure
    expect(credential.id).toBeTruthy();
    expect(credential.issuer).toBe(issuer.prefix);
    expect(credential.recipient).toBe(holder.prefix);
    expect(credential.schema).toBe(degreeSchema.id);
    expect(credential.data.degree).toBe('Bachelor of Science');
    expect(credential.data.major).toBe('Computer Science');
    expect(credential.data.gpa).toBe(3.8);

    // Verify credential with full validation
    expect(
      verifyCredential(credential, issuer.prefix, holder.prefix, degreeSchema.id)
    ).toBe(true);

    // Verify TEL structure
    expect(verifyTEL(credential)).toBe(true);
    expect(credential.tel).toHaveLength(2);
    expect(credential.tel[0].t).toBe('vcp'); // Registry inception
    expect(credential.tel[1].t).toBe('iss'); // Issuance event
    expect(credential.tel[1].i).toBe(credential.sad.d); // References credential SAID

    // Verify SAID integrity
    expect(credential.id).toBe(credential.sad.d);

    // Verify issuer and holder prefixes are self-certifying
    expect(issuer.prefix).toMatch(/^[DE]/); // Ed25519 prefix (D=non-transferable, E=transferable)
    expect(holder.prefix).toMatch(/^[DE]/);

    // Verify registry key is present
    expect(credential.registry).toBeTruthy();
    expect(credential.tel[0].i).toBe(credential.registry);
  });
});
