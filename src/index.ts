import { getCounter, TotpParameter, TotpResult, KeyType, DEFAULT } from 'core';
import { createTotp as nodeCreate, verifyTotp as nodeVerify, decodeKey as nodeDecode, generateOtp as nodeGenerate } from './node';
import { createTotp as webCreate, verifyTotp as webVerify, decodeKey as webDecode, generateOtp as webGenerate } from './web';

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function getKeyType(secret: string) : KeyType {
  const len = secret.length;
  let keyType: KeyType = 'base64';
  if (len === 16 || len === 32) {
    keyType = 'base32';
  } else if (len === 20 || len === 40) {
    keyType = 'hex';
  }
  return keyType;
}

export function createTotp(options: Partial<TotpParameter>, useSubtle = false) : Promise<TotpResult> {
  if (isBrowser() || useSubtle) {
    return webCreate(options);
  } else {
    return new Promise((resolve) => {
      resolve(nodeCreate(options));
    });
  }
}

type TotpOptions = Pick<TotpParameter, 'alg' | 'digits' | 'period'>

const DEFAULT_TOTP:TotpOptions = {
  alg: DEFAULT.alg,
  period: DEFAULT.period,
  digits: DEFAULT.digits
} as const;

export function generateTotp(secret: string, options:Partial<TotpOptions> = DEFAULT_TOTP, useSubtle = false) : Promise<string> {
  const opts = { ... DEFAULT_TOTP, ... options};
  const counter = getCounter(opts.period);
  if (isBrowser() || useSubtle) {
    const buff = webDecode(getKeyType(secret), secret);
    return webGenerate(opts.alg, buff, counter, opts.digits);
  } else {
    return new Promise((resolve) => {
      const buff = nodeDecode(getKeyType(secret), secret);
      resolve(nodeGenerate(opts.alg, buff, counter, opts.digits));
    });
  }
}

export function verifyTotp(secret: string, otp: string, windows: 1|2|3 = 1, options:Partial<TotpOptions> = DEFAULT_TOTP, useSubtle = false) : Promise<boolean> {
  const opts = { ... DEFAULT_TOTP, ... options};
  if (isBrowser() || useSubtle) {
    const buff = webDecode(getKeyType(secret), secret);
    return webVerify(opts.alg, buff, otp, windows, opts.period, opts.digits);
  } else {
    return new Promise((resolve) => {
      const buff = nodeDecode(getKeyType(secret), secret);
      resolve(nodeVerify(opts.alg, buff, otp, windows, opts.period, opts.digits));
    });
  }
}

/*( async () => {
  const result = await createTotp({
    account: 'testing',
    bits: 160,
    alg: 'sha1',
    secureKey: 'JRBSHENZK2QUEGSNCZBBZXEGQ7VSWO2H'
  });
  console.log(result);
  const otp = await generateTotp(result.base32);
  console.log(otp);
  console.log(await verifyTotp(result.base32, otp));
  const result2 = await createTotp({
    account: 'testing',
    bits: 160,
    alg: 'sha1',
  }, true);
  console.log(result2);
  const otp2 = await generateTotp(result.base32, {}, true);
  console.log(otp2);
  console.log(await verifyTotp(result.base32, otp2));
})();*/
