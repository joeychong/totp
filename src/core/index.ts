const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export type Algorithm = 'sha1' | 'sha256' | 'sha512';
export type Bits = 80 | 160;
export type KeyType =  'base32' | 'hex' | 'base64'

export type TotpParameter = {
  alg: Algorithm,
  keyType: KeyType,
  period: number,
  bits: Bits,
  issuer?: string,
  account?: string,
  digits: 6 | 8,
  secureKey?: string
}

export type TotpResult = {
  base32: string,
  hex: string,
  base64: string,
  uri: string
}

export const DEFAULT:TotpParameter = {
  alg: 'sha1',
  keyType: 'base32',
  period: 30,
  bits: 160,
  digits: 6
} as const;

export function generateBase32Key(length: 16 | 32) : string {
  return Array.from({ length }, () => BASE32[Math.floor(Math.random() * 32)]).join('');
}

export function decodeBase32(input: string): number[] {
  // Sanitize input (remove padding and ensure uppercase)
  const sanitizedInput = input.replace(/=+$/, '').toUpperCase();

  let bits = '';
  for (const char of sanitizedInput) {
    const value = BASE32.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in base32 string: ${char}`);
    }
    bits += value.toString(2).padStart(5, '0'); // Base32 = 5-bit chunks
  }

  // Convert bits to bytes
  const bytes:number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return bytes;
}

export function generateRandomKey(bits: Bits) : string {
  if (bits === 80) {
    return generateBase32Key(16); 
  } else {
    return generateBase32Key(32);
  }
}

export function getCounter(period: number) {
  const counter = Math.floor(Date.now() / 1000 / period);
  return counter;
}

/*export function truncation(hmac: number[], digits: 6 | 8) {
  const offset = hmac[hmac.length - 1] & 0x0f;
  const otp = (
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    (hmac[offset + 3])
  ) % (10 ** digits);
  return otp;
}*/

export function generateURI(config: TotpParameter, randomKey: string) {
  let uri = 'otpauth://totp/';
  if (config.issuer) {
    uri += encodeURIComponent(config.issuer);
  }
  if (config.account) {
    uri += encodeURIComponent(config.account);
  }
  uri += '?secret=' + randomKey;
  if (config.issuer) {
    uri += '&issuer=' + encodeURIComponent(config.issuer);
  }
  if (config.alg !== 'sha1') {
    uri += '&algorithm=' + config.alg.toUpperCase();
  }
  if (config.digits !== 6) {
    uri += '&digits=' + config.digits;
  }
  if (config.period !== 30) {
    uri += '&period=' + config.period;
  }

  return uri;
}
