# expressAuthHelpers

expressAuthHelpers are used to add a VincentJWT-specific authentication to your Express.js server routes

- Create an express middleware using [getAuthenticateUserExpressHandler](functions/getAuthenticateUserExpressHandler.md)
- Once you have added the middleware to your route, use [authenticatedRequestHandler](functions/authenticatedRequestHandler.md) to provide
type-safe access to `req.user` in your downstream RequestHandler functions.

## Example

```typescript
import { expressAuthHelpers } from '@lit-protocol/vincent-sdk';
const { authenticatedRequestHandler, getAuthenticateUserExpressHandler } = expressAuthHelpers;

import type { ExpressAuthHelpers } from '@lit-protocol/vincent-sdk';

const { ALLOWED_AUDIENCE } = process.env;

const authenticateUserMiddleware = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);

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

## Functions

- [authenticatedRequestHandler](functions/authenticatedRequestHandler.md)
- [getAuthenticateUserExpressHandler](functions/getAuthenticateUserExpressHandler.md)
