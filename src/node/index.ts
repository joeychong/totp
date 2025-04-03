import { createHmac } from 'crypto';
import { decodeBase32, DEFAULT, generateURI, generateRandomKey } from '../core';
import type { Algorithm, KeyType, TotpParameter, TotpResult } from '../core';

export function base32Decode(input: string): Buffer {
  return Buffer.from(decodeBase32(input));
}

export function hash(alg: Algorithm, secret: Buffer, data: Buffer) : Buffer  {
  const hmac = createHmac(alg, secret).update(data).digest();
  return hmac;
}

export function decodeKey(keyType: KeyType, secretKey: string) : Buffer {
  if (keyType === 'base32') {
    return base32Decode(secretKey);
  } else if (keyType === 'hex') {
    return Buffer.from(secretKey, 'hex');
  } else {
    return Buffer.from(secretKey, 'base64');
  }
}

export function generateOtp(alg: Algorithm, randomKey: Buffer, counter: number, digits = 6) : string {
  const buffer = Buffer.alloc(8); // 8-byte buffer (64-bit)
  buffer.writeBigUInt64BE(BigInt(counter), 0);
  const hmac = hash(alg, randomKey, buffer);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const otp = (
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    (hmac[offset + 3])
  ) % (10 ** digits);
  return otp.toString().padStart(digits, '0');
}

export function createTotp(params: Partial<TotpParameter>) : TotpResult {
  const config = { ... DEFAULT, ... params };
  const randomKey = config.secureKey ?? generateRandomKey(config.bits);
  const buff = decodeKey('base32', randomKey);
  // const counter = Math.floor(Date.now() / 1000 / config.period);
  // const otp = generateOtp(config.alg, buff, counter, config.digits);
  const keys = {
    base32: randomKey,
    hex: buff.toString('hex'),
    base64: buff.toString('base64'),
  };
  const uri = generateURI(config, randomKey);

  return {
    ... keys,
    //otp: otp.toString().padStart(config.digits, '0'),
    uri
  };
}

export function verifyTotp(alg: Algorithm, secureKey: Buffer, otp: string, windows:1|2|3 = 1, period = 30, digits = 6) : boolean {
  const counter = Math.floor(Date.now() / 1000 / period);
  for (let i = -windows; i <= windows; i ++) {
    const o = generateOtp(alg, secureKey, counter - (i * period), digits);
    if (o === otp) {
      return true;
    }
  }
  return false;
}
