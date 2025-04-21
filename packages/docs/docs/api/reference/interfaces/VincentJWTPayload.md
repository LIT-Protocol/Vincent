# Interface: VincentJWTPayload

Extended payload interface for Vincent-specific JWTs.

 VincentJWTPayload

## Extends

- `JWTPayload`

## Indexable

\[`x`: `string`\]: `any`

## Properties

### app

> **app**: `object`

The app associated with the JWT.

#### id

> **id**: `string`

#### version

> **version**: `number`

***

### aud?

> `optional` **aud**: `string` \| `string`[]

#### Inherited from

`JWTPayload.aud`

***

### authentication

> **authentication**: `object`

The authentication method used to generate the JWT.

#### type

> **type**: `string`

#### value?

> `optional` **value**: `string`

***

### exp?

> `optional` **exp**: `number`

#### Inherited from

`JWTPayload.exp`

***

### iat?

> `optional` **iat**: `number`

#### Inherited from

`JWTPayload.iat`

***

### iss?

> `optional` **iss**: `string`

#### Inherited from

`JWTPayload.iss`

***

### nbf?

> `optional` **nbf**: `number`

#### Inherited from

`JWTPayload.nbf`

***

### pkp

> **pkp**: `IRelayPKP`

The PKP associated with the JWT.

***

### rexp?

> `optional` **rexp**: `number`

#### Inherited from

`JWTPayload.rexp`

***

### sub?

> `optional` **sub**: `string`

#### Inherited from

`JWTPayload.sub`
