import { decodeBase32, DEFAULT, generateURI, generateRandomKey } from '../core';
import type { Algorithm, KeyType, TotpParameter, TotpResult } from '../core';

export function base32Decode(input: string): Uint8Array {
  return new Uint8Array(decodeBase32(input));
}

export function base16Decode(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string must have an even length');
  }
  
  const length = hex.length / 2;
  const uint8Array = new Uint8Array(length);
  
  for (let i = 0; i < length; i++) {
    const offset = i * 2;
    uint8Array[i] = parseInt(hex.substring(offset, offset + 2), 16);
  }
  
  return uint8Array;
}

export function base64Decode(base64: string): Uint8Array {
  const binary = atob(base64);
  const length = binary.length;
  const uint8Array = new Uint8Array(length);
  for (let i = 0; i < length; i ++) {
    uint8Array[i] = binary.charCodeAt(i);
  }

  return uint8Array;
}

const algMap: Map<Algorithm, string> = new Map()
  .set('sha1', 'SHA-1')
  .set('sha256', 'SHA-256')
  .set('sha512', 'SHA-512');

export async function hash(alg: Algorithm, secret: Uint8Array, data: Uint8Array) : Promise<ArrayBuffer>  {
  // const keyData = new TextEncoder().encode(secret); // Encode as Uint8Array
  const key = await crypto.subtle.importKey(
    'raw',             // Format of the key
    secret,           // Key data
    { name: 'HMAC', hash: { name: algMap.get(alg) ?? '' } }, // Algorithm settings
    false,             // Not exportable
    ['sign']           // Usage: signing only
  );
  const hmac = await crypto.subtle.sign('HMAC', key, data);
  return hmac; 
}

export function decodeKey(keyType: KeyType, secretKey: string) : Uint8Array {
  if (keyType === 'base32') {
    return base32Decode(secretKey);
  } else if (keyType === 'hex') {
    return base16Decode(secretKey);
  } else {
    return base32Decode(secretKey);
  }
}

export async function generateOtp(alg: Algorithm, randomKey: Uint8Array, counter: number, digits = 6) : Promise<string> {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setBigUint64(0, BigInt(counter), false); // false = big-endian  
  const hmac = new Uint8Array(await hash(alg, randomKey, new Uint8Array(buffer)));
  const offset = hmac[hmac.length - 1] & 0x0f;
  const otp = (
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    (hmac[offset + 3])
  ) % (10 ** digits);
  return otp.toString().padStart(digits, '0');
}

export function toHex(buffer: Uint8Array) {
  return Array.from(buffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export function toBase64(buffer: Uint8Array) {
  let s = '';
  for (let i = 0; i < buffer.length; i ++) {
    s += String.fromCharCode(buffer[i]);
  }

  return btoa(s);
}

export async function createTotp(params: Partial<TotpParameter>) : Promise<TotpResult> {
  const config = { ... DEFAULT, ... params };
  const randomKey = config.secureKey ?? generateRandomKey(config.bits);
  const buff = decodeKey('base32', randomKey);
  // const counter = Math.floor(Date.now() / 1000 / config.period);
  // const otp = await generateOtp(config.alg, buff, counter, config.digits);
  const keys = {
    base32: randomKey,
    hex: toHex(buff),
    base64: toBase64(buff),
  };
  const uri = generateURI(config, randomKey);

  return {
    ... keys,
    // otp: otp.toString().padStart(config.digits, '0'),
    uri
  };
}

export async function verifyTotp(alg: Algorithm, secureKey: Uint8Array, otp: string, windows:1|2|3 = 1, period = 30, digits = 6) : Promise<boolean> {
  const counter = Math.floor(Date.now() / 1000 / period);
  for (let i = -windows; i <= windows; i ++) {
    const o = await generateOtp(alg, secureKey, counter - (i * period), digits);
    if (o === otp) {
      return true;
    }
  }
  return false;
}
