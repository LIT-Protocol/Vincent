> **getAuthenticateUserExpressHandler**(`allowedAudience`): (`req`, `res`, `next`) => `Promise`\<`void`\>

Defined in: [packages/sdk/src/express-authentication-middleware/express.ts:114](https://github.com/LIT-Protocol/Vincent/blob/main/packages/sdk/src/express-authentication-middleware/express.ts#L114)

Creates an Express middleware function to authenticate a user using a JWT token.

This middleware checks the `Authorization` header for a Bearer token, verifies the token, and checks its audience.
If the token is valid, it attaches the user information (decoded JWT, raw token, and PKP address) to the request object as `req.user`.
If the token is missing or invalid, it returns a 401 Unauthorized response with an error message.

NOTE: Wrap your route handler functions with `authenticatedRequestHandler()` to assert the type of `Request` and to
ensure that `req.user` was correctly set before your route handler is run.

See [express.js documentation](https://expressjs.com/en/guide/writing-middleware.html) for details on writing your route handler

## Parameters

### allowedAudience

`string`

## Returns

> (`req`, `res`, `next`): `Promise`\<`void`\>

### Parameters

#### req

`Request`

#### res

`Response`

#### next

`NextFunction`

### Returns

`Promise`\<`void`\>

## Example

```typescript
import { expressAuthHelpers } from '@lit-protocol/vincent-sdk';
const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-sdk';

// In your environment configuration
const ALLOWED_AUDIENCE = 'https://yourapp.example.com';

// Create the authentication middleware
const authenticateUser = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);

// Define a handler that requires authentication
const getProtectedResource = (req: ExpressAuthHelpers['AuthenticatedRequest'], res: Response) => {
  // The request is now authenticated
  // No need for type casting as the handler is properly typed
  const { pkpAddress } = req.user;
  res.json({ message: `Hello, user with PKP address ${pkpAddress}` });
};

// Apply to routes that require authentication by using authenticatedRequestHandler
app.get('/protected-resource', authenticateUser, authenticatedRequestHandler(getProtectedResource));
```

You can see the source for `getAuthenticateUserExpressHandler()` below; use this as a reference to implement
your own midddleware/authentication for other frameworks! Pull requests are welcome.

```ts
export const getAuthenticateUserExpressHandler =
  (allowedAudience: string) => async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      res.status(401).json({ error: `Invalid authorization header - expected "Bearer <token>"` });
      return;
    }

    const [scheme, rawJWT] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ error: `Expected "Bearer" scheme, got "${scheme}"` });
      return;
    }

    try {
      const decodedJWT = verify(rawJWT, allowedAudience);
      if (!decodedJWT) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      (req as AuthenticatedRequest).user = {
        decodedJWT,
        rawJWT,
      };

      next();
    } catch (e) {
      res.status(401).json({ error: `Invalid token: ${(e as Error).message}` });
    }
  };
```
