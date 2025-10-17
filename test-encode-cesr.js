/**
 * Encode the actual public key bytes to CESR to see what it should be
 */

const actualPublicKey = new Uint8Array([38, 32, 255, 35, 108, 50, 205, 13, 82, 214, 188, 255, 201, 164, 74, 153, 230, 132, 171, 193, 82, 252, 59, 223, 129, 19, 75, 227, 142, 71, 198, 68]);

console.log('Actual public key from signer:', Array.from(actualPublicKey));

// Encode to base64url
let binary = '';
for (let i = 0; i < actualPublicKey.length; i++) {
  binary += String.fromCharCode(actualPublicKey[i]);
}
const base64 = btoa(binary);
const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const cesrKey = 'D' + base64url;

console.log('\nCorrect CESR encoding should be:', cesrKey);
console.log('But signer.verfer.qb64 says:', 'DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE');
console.log('They match?', cesrKey === 'DCYg_yNsMs0NUta8_8mkSpnmhKvBUvw734ETS-OOR8ZE');
