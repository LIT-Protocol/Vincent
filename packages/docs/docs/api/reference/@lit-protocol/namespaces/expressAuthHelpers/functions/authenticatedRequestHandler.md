> **authenticatedRequestHandler**(`handler`): (`req`, `res`, `next`) => `void` \| `Promise`\<`void`\>

Defined in: [packages/sdk/src/express-authentication-middleware/express.ts:62](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/express-authentication-middleware/express.ts#L62)

Higher-order helper function to enforce authentication on a request handler and assert the type of `Request` that is
passed into your authenticated Express routes.

This function takes an `AuthenticatedRequestHandler` and returns a new request handler
that verifies that the request has a 'user' property with the correct shape on it before calling the original handler.
If the `req.user` property isn't the correct shape, it sends a `401 Unauthorized` response to the client.

NOTE: This does not verify signatures or any other content -- use `getAuthenticateUserExpressHandler` to create a
middleware that does those things and ensure that your routes use it.

See [express.js documentation](https://expressjs.com/en/guide/writing-middleware.html) for details on writing your route handler

## Parameters

### handler

`AuthenticatedRequestHandler`

## Returns

> (`req`, `res`, `next`): `void` \| `Promise`\<`void`\>

### Parameters

#### req

`Request`

#### res

`Response`

#### next

`NextFunction`

### Returns

`void` \| `Promise`\<`void`\>

## Example

```typescript
import { expressAuthHelpers } from '@lit-protocol/vincent-sdk';
const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-sdk';

// Define an authenticated route handler
const getUserProfile = async (req: ExpressAuthHelpers['AuthenticatedRequest'], res: Response) => {
  // Access authenticated user information
  const { pkpAddress } = req.user;

  // Fetch and return user data
  const userData = await userRepository.findByAddress(pkpAddress);
  res.json(userData);
};

// Use in Express route with authentication
app.get('/profile', authenticateUser, authenticatedRequestHandler(getUserProfile));
```
