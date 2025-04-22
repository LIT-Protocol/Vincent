Defined in: [packages/sdk/src/jwt/types.ts:42](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L42)

Extended payload interface for Vincent-specific JWTs.

 VincentJWTPayload

## Extends

- `JWTPayload`

## Indexable

\[`x`: `string`\]: `any`

## Properties

### app

> **app**: `object`

Defined in: [packages/sdk/src/jwt/types.ts:44](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L44)

The app associated with the JWT.

#### id

> **id**: `string`

#### version

> **version**: `number`

***

### aud?

> `optional` **aud**: `string` \| `string`[]

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:54

#### Inherited from

`JWTPayload.aud`

***

### authentication

> **authentication**: `object`

Defined in: [packages/sdk/src/jwt/types.ts:48](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L48)

The authentication method used to generate the JWT.

#### type

> **type**: `string`

#### value?

> `optional` **value**: `string`

***

### exp?

> `optional` **exp**: `number`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:57

#### Inherited from

`JWTPayload.exp`

***

### iat?

> `optional` **iat**: `number`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:55

#### Inherited from

`JWTPayload.iat`

***

### iss?

> `optional` **iss**: `string`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:52

#### Inherited from

`JWTPayload.iss`

***

### nbf?

> `optional` **nbf**: `number`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:56

#### Inherited from

`JWTPayload.nbf`

***

### pkp

> **pkp**: `IRelayPKP`

Defined in: [packages/sdk/src/jwt/types.ts:43](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/jwt/types.ts#L43)

The PKP associated with the JWT.

***

### rexp?

> `optional` **rexp**: `number`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:58

#### Inherited from

`JWTPayload.rexp`

***

### sub?

> `optional` **sub**: `string`

Defined in: node\_modules/.pnpm/did-jwt@8.0.11/node\_modules/did-jwt/lib/JWT.d.ts:53

#### Inherited from

`JWTPayload.sub`
