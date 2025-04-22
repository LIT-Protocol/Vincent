> **isExpired**(`decodedJWT`): `boolean`

Defined in: [packages/sdk/src/jwt/index.ts:73](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/index.ts#L73)

When a JWT is expired, you need to use [VincentWebAppClient.redirectToConsentPage](../../../../interfaces/VincentWebAppClient.md#redirecttoconsentpage) to get a new JWT

## Parameters

### decodedJWT

[`VincentJWT`](../../../../interfaces/VincentJWT.md)

## Returns

`boolean`

true if expired, false otherwise

## Example

```typescript
  import { jwt } from '@lit-protocol/vincent-sdk';

  const { decode, isExpired } = jwt;

  const decodedVincentJWT = decode(jwt);
  const isJWTExpired = isExpired(decodedVincentJWT);

  if(!isJWTExpired) {
    // User is logged in
  } else {
    // User needs to get a new JWT
    vincentWebAppClient.redirectToConsentPage({redirectUri: window.location.href });
  }
```
