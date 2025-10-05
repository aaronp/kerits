/**
 * CESR Codex - Derivation Codes and Size Tables
 *
 * Defines all Matter derivation codes and their size parameters
 */

/**
 * Sizage - Size parameters for a derivation code
 *
 * @property hs - Hard size: number of chars in stable/hard part of code (1, 2, or 4)
 * @property ss - Soft size: number of chars in variable/soft part of code
 * @property xs - Extra size: number of pre-pad chars in soft part
 * @property fs - Full size: total size in chars (null for variable-sized)
 * @property ls - Lead size: number of lead bytes to pre-pad raw material (0, 1, or 2)
 */
export interface Sizage {
  hs: number;
  ss: number;
  xs: number;
  fs: number | null;
  ls: number;
}

/**
 * MatterCodex - All Matter derivation codes
 */
export class MatterCodex {
  // Ed25519 and X25519
  static readonly Ed25519_Seed = 'A';        // Ed25519 256 bit random seed for private key
  static readonly Ed25519N = 'B';            // Ed25519 non-transferable prefix
  static readonly X25519 = 'C';              // X25519 public encryption key
  static readonly Ed25519 = 'D';             // Ed25519 verification key

  // Digests - 256 bit
  static readonly Blake3_256 = 'E';          // Blake3 256 bit digest
  static readonly Blake2b_256 = 'F';         // Blake2b 256 bit digest
  static readonly Blake2s_256 = 'G';         // Blake2s 256 bit digest
  static readonly SHA3_256 = 'H';            // SHA3 256 bit digest
  static readonly SHA2_256 = 'I';            // SHA2 256 bit digest

  // ECDSA
  static readonly ECDSA_256k1_Seed = 'J';    // ECDSA secp256k1 256 bit seed

  // Ed448 and X448
  static readonly Ed448_Seed = 'K';          // Ed448 448 bit seed
  static readonly X448 = 'L';                // X448 public encryption key

  // Numbers - Fixed size
  static readonly Short = 'M';               // Short 2 byte number
  static readonly Big = 'N';                 // Big 8 byte number

  // X25519 private key
  static readonly X25519_Private = 'O';      // X25519 private decryption key

  // Cipher
  static readonly X25519_Cipher_Seed = 'P';  // X25519 sealed box cipher of seed

  // ECDSA secp256r1
  static readonly ECDSA_256r1_Seed = 'Q';    // ECDSA secp256r1 256 bit seed

  // More numbers
  static readonly Tall = 'R';                // Tall 5 byte number
  static readonly Large = 'S';               // Large 11 byte number
  static readonly Great = 'T';               // Great 14 byte number
  static readonly Vast = 'U';                // Vast 17 byte number

  // Labels and Tags
  static readonly Label1 = 'V';              // Label1 1 byte
  static readonly Label2 = 'W';              // Label2 2 bytes
  static readonly Tag3 = 'X';                // Tag3 3 B64 chars
  static readonly Tag7 = 'Y';                // Tag7 7 B64 chars
  static readonly Tag11 = 'Z';               // Tag11 11 B64 chars

  // Salt
  static readonly Salt_256 = 'a';            // Salt 256 bits

  // Two character codes (0x)
  static readonly Salt_128 = '0A';           // Salt 128 bits
  static readonly Ed25519_Sig = '0B';        // Ed25519 signature
  static readonly ECDSA_256k1_Sig = '0C';    // ECDSA secp256k1 signature

  // Digests - 512 bit
  static readonly Blake3_512 = '0D';         // Blake3 512 bit digest
  static readonly Blake2b_512 = '0E';        // Blake2b 512 bit digest
  static readonly SHA3_512 = '0F';           // SHA3 512 bit digest
  static readonly SHA2_512 = '0G';           // SHA2 512 bit digest

  static readonly Long = '0H';               // Long 4 byte number
  static readonly ECDSA_256r1_Sig = '0I';    // ECDSA secp256r1 signature

  // More tags
  static readonly Tag1 = '0J';               // Tag1 1 B64 char + 1 prepad
  static readonly Tag2 = '0K';               // Tag2 2 B64 chars
  static readonly Tag5 = '0L';               // Tag5 5 B64 chars + 1 prepad
  static readonly Tag6 = '0M';               // Tag6 6 B64 chars
  static readonly Tag9 = '0N';               // Tag9 9 B64 chars + 1 prepad
  static readonly Tag10 = '0O';              // Tag10 10 B64 chars

  // Four character codes (1xxx)
  static readonly ECDSA_256k1N = '1AAA';     // ECDSA secp256k1 non-transferable
  static readonly ECDSA_256k1 = '1AAB';      // ECDSA secp256k1 public key
  static readonly Ed448N = '1AAC';           // Ed448 non-transferable
  static readonly Ed448 = '1AAD';            // Ed448 public key
  static readonly Ed448_Sig = '1AAE';        // Ed448 signature
  static readonly Tag4 = '1AAF';             // Tag4 4 B64 chars
  static readonly DateTime = '1AAG';         // DateTime 32 char ISO-8601
  static readonly X25519_Cipher_Salt = '1AAH'; // X25519 cipher of salt
  static readonly ECDSA_256r1N = '1AAI';     // ECDSA secp256r1 non-transferable
  static readonly ECDSA_256r1 = '1AAJ';      // ECDSA secp256r1 public key

  // Special values
  static readonly Null = '1AAK';             // Null/None/empty
  static readonly No = '1AAL';               // Boolean false
  static readonly Yes = '1AAM';              // Boolean true
  static readonly Tag8 = '1AAN';             // Tag8 8 B64 chars
  static readonly Escape = '1AAO';           // Escape code
  static readonly Empty = '1AAP';            // Empty value

  // Variable sized - Small (2 char code + 2 char size)
  static readonly StrB64_L0 = '4A';          // String Base64 lead size 0
  static readonly StrB64_L1 = '5A';          // String Base64 lead size 1
  static readonly StrB64_L2 = '6A';          // String Base64 lead size 2

  // Variable sized - Large (4 char code + 4 char size)
  static readonly StrB64_Big_L0 = '7AAA';    // String Base64 big lead size 0
  static readonly StrB64_Big_L1 = '8AAA';    // String Base64 big lead size 1
  static readonly StrB64_Big_L2 = '9AAA';    // String Base64 big lead size 2

  // Byte strings
  static readonly Bytes_L0 = '4B';           // Byte string lead size 0
  static readonly Bytes_L1 = '5B';           // Byte string lead size 1
  static readonly Bytes_L2 = '6B';           // Byte string lead size 2
  static readonly Bytes_Big_L0 = '7AAB';     // Byte string big lead size 0
  static readonly Bytes_Big_L1 = '8AAB';     // Byte string big lead size 1
  static readonly Bytes_Big_L2 = '9AAB';     // Byte string big lead size 2
}

/**
 * Sizes table - Maps derivation code to size parameters
 */
export const Sizes = new Map<string, Sizage>([
  // Single character codes - 32 byte keys/seeds
  ['A', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Ed25519_Seed
  ['B', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Ed25519N
  ['C', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // X25519
  ['D', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Ed25519
  ['E', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Blake3_256
  ['F', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Blake2b_256
  ['G', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Blake2s_256
  ['H', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // SHA3_256
  ['I', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // SHA2_256
  ['J', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // ECDSA_256k1_Seed

  // Single character codes - 56 byte keys
  ['K', { hs: 1, ss: 0, xs: 0, fs: 76, ls: 0 }],  // Ed448_Seed
  ['L', { hs: 1, ss: 0, xs: 0, fs: 76, ls: 0 }],  // X448

  // Single character codes - Numbers
  ['M', { hs: 1, ss: 0, xs: 0, fs: 4, ls: 0 }],   // Short (2 bytes)
  ['N', { hs: 1, ss: 0, xs: 0, fs: 12, ls: 0 }],  // Big (8 bytes)
  ['O', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // X25519_Private
  ['P', { hs: 1, ss: 0, xs: 0, fs: 124, ls: 0 }], // X25519_Cipher_Seed
  ['Q', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // ECDSA_256r1_Seed
  ['R', { hs: 1, ss: 0, xs: 0, fs: 8, ls: 0 }],   // Tall (5 bytes)
  ['S', { hs: 1, ss: 0, xs: 0, fs: 16, ls: 0 }],  // Large (11 bytes)
  ['T', { hs: 1, ss: 0, xs: 0, fs: 20, ls: 0 }],  // Great (14 bytes)
  ['U', { hs: 1, ss: 0, xs: 0, fs: 24, ls: 0 }],  // Vast (17 bytes)

  // Single character codes - Labels and Tags
  ['V', { hs: 1, ss: 0, xs: 0, fs: 4, ls: 1 }],   // Label1
  ['W', { hs: 1, ss: 0, xs: 0, fs: 4, ls: 0 }],   // Label2
  ['X', { hs: 1, ss: 3, xs: 0, fs: 4, ls: 0 }],   // Tag3 (special)
  ['Y', { hs: 1, ss: 7, xs: 0, fs: 8, ls: 0 }],   // Tag7 (special)
  ['Z', { hs: 1, ss: 11, xs: 0, fs: 12, ls: 0 }], // Tag11 (special)

  // Single character codes - Salt
  ['a', { hs: 1, ss: 0, xs: 0, fs: 44, ls: 0 }],  // Salt_256

  // Two character codes
  ['0A', { hs: 2, ss: 0, xs: 0, fs: 24, ls: 0 }], // Salt_128
  ['0B', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // Ed25519_Sig (64 bytes)
  ['0C', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // ECDSA_256k1_Sig
  ['0D', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // Blake3_512
  ['0E', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // Blake2b_512
  ['0F', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // SHA3_512
  ['0G', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // SHA2_512
  ['0H', { hs: 2, ss: 0, xs: 0, fs: 8, ls: 0 }],  // Long (4 bytes)
  ['0I', { hs: 2, ss: 0, xs: 0, fs: 88, ls: 0 }], // ECDSA_256r1_Sig
  ['0J', { hs: 2, ss: 1, xs: 1, fs: 4, ls: 0 }],  // Tag1 (special)
  ['0K', { hs: 2, ss: 2, xs: 0, fs: 4, ls: 0 }],  // Tag2 (special)
  ['0L', { hs: 2, ss: 5, xs: 1, fs: 8, ls: 0 }],  // Tag5 (special)
  ['0M', { hs: 2, ss: 6, xs: 0, fs: 8, ls: 0 }],  // Tag6 (special)
  ['0N', { hs: 2, ss: 9, xs: 1, fs: 12, ls: 0 }], // Tag9 (special)
  ['0O', { hs: 2, ss: 10, xs: 0, fs: 12, ls: 0 }], // Tag10 (special)

  // Four character codes
  ['1AAA', { hs: 4, ss: 0, xs: 0, fs: 48, ls: 1 }], // ECDSA_256k1N
  ['1AAB', { hs: 4, ss: 0, xs: 0, fs: 48, ls: 1 }], // ECDSA_256k1
  ['1AAC', { hs: 4, ss: 0, xs: 0, fs: 80, ls: 1 }], // Ed448N
  ['1AAD', { hs: 4, ss: 0, xs: 0, fs: 80, ls: 1 }], // Ed448
  ['1AAE', { hs: 4, ss: 0, xs: 0, fs: 156, ls: 1 }], // Ed448_Sig
  ['1AAF', { hs: 4, ss: 4, xs: 0, fs: 8, ls: 0 }],  // Tag4 (special)
  ['1AAG', { hs: 4, ss: 0, xs: 0, fs: 36, ls: 1 }], // DateTime
  ['1AAH', { hs: 4, ss: 0, xs: 0, fs: 100, ls: 0 }], // X25519_Cipher_Salt
  ['1AAI', { hs: 4, ss: 0, xs: 0, fs: 48, ls: 1 }], // ECDSA_256r1N
  ['1AAJ', { hs: 4, ss: 0, xs: 0, fs: 48, ls: 1 }], // ECDSA_256r1
  ['1AAK', { hs: 4, ss: 0, xs: 0, fs: 4, ls: 0 }],  // Null
  ['1AAL', { hs: 4, ss: 0, xs: 0, fs: 4, ls: 0 }],  // No
  ['1AAM', { hs: 4, ss: 0, xs: 0, fs: 4, ls: 0 }],  // Yes
  ['1AAN', { hs: 4, ss: 8, xs: 0, fs: 12, ls: 0 }], // Tag8 (special)
  ['1AAO', { hs: 4, ss: 0, xs: 0, fs: 4, ls: 0 }],  // Escape
  ['1AAP', { hs: 4, ss: 0, xs: 0, fs: 4, ls: 0 }],  // Empty

  // Variable sized - Small (2 char code + 2 char size)
  ['4A', { hs: 2, ss: 2, xs: 0, fs: null, ls: 0 }], // StrB64_L0
  ['5A', { hs: 2, ss: 2, xs: 0, fs: null, ls: 1 }], // StrB64_L1
  ['6A', { hs: 2, ss: 2, xs: 0, fs: null, ls: 2 }], // StrB64_L2
  ['4B', { hs: 2, ss: 2, xs: 0, fs: null, ls: 0 }], // Bytes_L0
  ['5B', { hs: 2, ss: 2, xs: 0, fs: null, ls: 1 }], // Bytes_L1
  ['6B', { hs: 2, ss: 2, xs: 0, fs: null, ls: 2 }], // Bytes_L2

  // Variable sized - Large (4 char code + 4 char size)
  ['7AAA', { hs: 4, ss: 4, xs: 0, fs: null, ls: 0 }], // StrB64_Big_L0
  ['8AAA', { hs: 4, ss: 4, xs: 0, fs: null, ls: 1 }], // StrB64_Big_L1
  ['9AAA', { hs: 4, ss: 4, xs: 0, fs: null, ls: 2 }], // StrB64_Big_L2
  ['7AAB', { hs: 4, ss: 4, xs: 0, fs: null, ls: 0 }], // Bytes_Big_L0
  ['8AAB', { hs: 4, ss: 4, xs: 0, fs: null, ls: 1 }], // Bytes_Big_L1
  ['9AAB', { hs: 4, ss: 4, xs: 0, fs: null, ls: 2 }], // Bytes_Big_L2
]);

/**
 * Hards table - Maps first character to hard size
 */
export const Hards = new Map<string, number>([
  // A-Z = 1
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => [c, 1] as [string, number]),
  // a-z = 1
  ...'abcdefghijklmnopqrstuvwxyz'.split('').map(c => [c, 1] as [string, number]),
  // Numbers
  ['0', 2], ['1', 4], ['2', 4], ['3', 4], ['4', 2], ['5', 2],
  ['6', 2], ['7', 4], ['8', 4], ['9', 4],
]);

/**
 * Digest code selector based on algorithm name
 */
export class DigDex {
  static readonly Blake3_256 = 'E';
  static readonly Blake3_512 = '0D';
  static readonly Blake2b_256 = 'F';
  static readonly Blake2b_512 = '0E';
  static readonly SHA3_256 = 'H';
  static readonly SHA3_512 = '0F';
  static readonly SHA2_256 = 'I';
  static readonly SHA2_512 = '0G';
}
