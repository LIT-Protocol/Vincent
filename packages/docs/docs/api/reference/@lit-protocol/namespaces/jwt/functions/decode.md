> **decode**(`jwt`): [`VincentJWT`](../../../../interfaces/VincentJWT.md)

Defined in: [packages/sdk/src/jwt/index.ts:32](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/index.ts#L32)

Decodes a Vincent JWT in string form and returns an [VincentJWT](../../../../interfaces/VincentJWT.md) decoded object for your use

## Parameters

### jwt

`string`

The JWT string to decode

## Returns

[`VincentJWT`](../../../../interfaces/VincentJWT.md)

The decoded Vincent JWT fields

## Example

```typescript
  try {
    const decodedVincentJWT = decode(jwt);
  } catch(e) {
   // Handle malformed JWT string case
  }

  // You still need to verify the JWT!
 ```
