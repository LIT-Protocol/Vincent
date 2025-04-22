> **verify**(`jwt`, `expectedAudience`): [`VincentJWT`](../../../../interfaces/VincentJWT.md)

Defined in: [packages/sdk/src/jwt/index.ts:48](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/index.ts#L48)

## Parameters

### jwt

`string`

The JWT string to verify

### expectedAudience

`string`

String that should be in the audience claim(s)

## Returns

[`VincentJWT`](../../../../interfaces/VincentJWT.md)

The decoded VincentJWT object if it was verified successfully

## Example

```typescript
 try {
   const decodedAndVerifiedVincentJWT = verify(jwt, 'https://myapp.com');
  } catch(e) {
   // Handle invalid/expired JWT casew
 }
```
