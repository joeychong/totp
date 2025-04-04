# @ebizzone/totp

A modern and minimal TOTP (Time-based One-Time Password) library for Node.js, browsers, and edge environments.

> 🔁 This is yet another TOTP library — **rewritten from the ground up** because most existing libraries are outdated and have not been maintained in over 3 years.

## Why this library?

- ✅ Written in **modern TypeScript**
- ✅ Uses `async/await` and **Web Crypto API**
- ✅ Avoids deprecated APIs like `new Buffer()`
- ✅ Works **seamlessly in Node.js, browsers, and edge runtimes** (like Cloudflare Workers)
- ✅ Auto-detects environment: uses Node.js crypto or falls back to WebCrypto
- ✅ **No external library dependencies** — built to be lightweight and portable

---

## Installation

```bash
npm install @ebizzone/totp
```

---

## Usage

```ts
import { createTotp, generateTotp, verifyTotp } from '@ebizzone/totp';
```

---

## `createTotp(options: Partial<TotpParameter>, useSubtle = false): Promise<TotpResult>`

Generates a new TOTP secret and returns the key in multiple formats and a URI compatible with authenticator apps.

### Parameters

| Name       | Type                | Default  | Required | Description |
|------------|---------------------|----------|----------|-------------|
| `options`  | `Partial<CreateOptions>` | –        | No       | Configuration object for TOTP settings. See table below. |
| `useSubtle`| `boolean`           | `false`  | No       | Use WebCrypto API instead of Node.js crypto |

#### `options` Fields

| Field     | Type                    | Default | Required | Description |
|-----------|-------------------------|---------|----------|-------------|
| `alg`     | `'sha1'` \| `'sha256'` \| `'sha512'` | `'sha1'` | No | Hashing algorithm |
| `period`  | `number`                | `30`    | No       | Time step in seconds |
| `bits`    | `80` \| `160`           | `80`    | No       | Secret size in bits |
| `issuer`  | `string`                | –       | No       | Optional issuer name for URI |
| `account` | `string`                | –       | No       | Optional account name for URI |
| `digits`  | `6` \| `8`              | `6`     | No       | Number of digits for the OTP |
| `secureKey`| `string`               | –       | No       | Provide your own key instead of generating a random one |

### Returns

`Promise<TotpResult>`

```ts
type TotpResult = {
  base32: string;
  hex: string;
  base64: string;
  uri: string; // otpauth:// URI
};
```

---

## `generateTotp(secret: string, options?: Partial<TotpParameter>, useSubtle = false): Promise<string>`

Generates a TOTP code from a given secret and options.

### Parameters

| Name       | Type                | Default  | Required | Description |
|------------|---------------------|----------|----------|-------------|
| `secret`   | `string`            | –        | Yes      | Shared secret string in the format defined by `keyType` |
| `options`  | `Partial<TotpOptions>` | See below | No       | TOTP settings |
| `useSubtle`| `boolean`           | `false`  | No       | Use WebCrypto API instead of Node.js crypto |

#### `options` Fields

| Field     | Type                    | Default | Required | Description |
|-----------|-------------------------|---------|----------|-------------|
| `alg`     | `'sha1'` \| `'sha256'` \| `'sha512'` | `'sha1'` | No | Hashing algorithm |
| `period`  | `number`                | `30`    | No       | Time step in seconds |
| `digits`  | `6` \| `8`              | `6`     | No       | Number of digits for the OTP |

### Returns

`Promise<string>` — The generated TOTP code, e.g. `"123456"`

---

## `verifyTotp(secret: string, otp: string, window = 1, options?: Partial<TotpParameter>, useSubtle = false): Promise<boolean>`

Verifies if a given TOTP code is valid within a specified time window.

### Parameters

| Name       | Type                | Default | Required | Description |
|------------|---------------------|---------|----------|-------------|
| `secret`   | `string`            | –       | Yes      | Shared secret string |
| `otp`      | `string`            | –       | Yes      | OTP code to verify |
| `window`   | `1` \| `2` \| `3`    | `1`     | No       | Time step window to allow before/after current |
| `options`  | `Partial<TotpOptions>` | –  | No       | TOTP settings |
| `useSubtle`| `boolean`           | `false` | No       | Use WebCrypto API instead of Node.js crypto |

#### `options` Fields

| Field     | Type                    | Default | Required | Description |
|-----------|-------------------------|---------|----------|-------------|
| `alg`     | `'sha1'` \| `'sha256'` \| `'sha512'` | `'sha1'` | No | Hashing algorithm |
| `period`  | `number`                | `30`    | No       | Time step in seconds |
| `digits`  | `6` \| `8`              | `6`     | No       | Number of digits for the OTP |

### Returns

`Promise<boolean>` — `true` if the OTP is valid, `false` otherwise

---

## Example

```ts
const secret = await createTotp({
  issuer: 'MyApp',
  account: 'user@example.com'
});

const otp = await generateTotp(secret.base32);

const isValid = await verifyTotp(secret.base32, otp);

console.log({ otp, isValid });
```

> 📷 **Note**: This library **does not provide any QR code generation**.  
> You can use any QR code library (e.g. [`qrcode`](https://www.npmjs.com/package/qrcode)) to convert the `uri` field into a scannable QR code for use with authenticator apps.

---

## Recommended Settings for Authenticator Apps

To ensure compatibility with popular TOTP apps such as **Google Authenticator**, **Authy**, **Microsoft Authenticator**, and **1Password**, it's recommended to use the following options:

| Option      | Recommended Value | Description |
|-------------|-------------------|-------------|
| `alg`       | `'sha1'`           | Most apps use SHA-1 for hashing |
| `keyType`   | `'base32'`         | Base32-encoded secrets are standard |
| `digits`    | `6`                | 6-digit codes are most common |
| `period`    | `30`               | 30-second interval is the default |

These values are used by default in this library, so you only need to change them if you have a specific use case.

---

## Environment Support

All functions auto-detect the runtime:

| Environment         | Crypto Engine     |
|---------------------|-------------------|
| Node.js             | `crypto` module   |
| Browser             | WebCrypto         |
| Edge runtimes (e.g. Cloudflare Workers) | WebCrypto         |

You can also force usage of WebCrypto with `useSubtle = true`.

---

## License

MIT 
