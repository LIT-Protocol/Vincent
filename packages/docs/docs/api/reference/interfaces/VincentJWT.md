Defined in: [packages/sdk/src/jwt/types.ts:61](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L61)

Interface representing a decoded Vincent JWT

 VincentJWT

## Extends

- `JWTDecoded`

## Properties

### data

> **data**: `string`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:65

#### Inherited from

`JWTDecoded.data`

***

### header

> **header**: `JWTHeader`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:62

#### Inherited from

`JWTDecoded.header`

***

### payload

> **payload**: [`VincentJWTPayload`](VincentJWTPayload.md)

Defined in: [packages/sdk/src/jwt/types.ts:62](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L62)

The payload of the JWT

#### Overrides

`JWTDecoded.payload`

***

### signature

> **signature**: `string`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:64

#### Inherited from

`JWTDecoded.signature`
