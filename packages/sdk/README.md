# Vincent SDK

## Installation

```
npm install @lit-protocol/vincent-sdk
```

## Usage

# Client (Web)

## VincentWebAppClient

The Vincent Web App Client provides methods for managing user authentication, JWT tokens, and consent flows in Vincent applications.

### Methods

#### redirectToConsentPage()

Redirects the user to the Vincent consent page to obtain authorization. Once the user has completed the vincent consent flow
they will be redirected back to your app with a signed JWT that you can use to authenticate requests against your backend APIs 

- When a JWT is expired, you need to use this method to get a new JWT

#### isLoginUri()

Checks if the current window location contains a Vincent login JWT. You can use this method to know that you should update login state with the newly provided JWT

- Returns: Boolean indicating if the URI contains a login JWT

#### decodeVincentLoginJWT(expectedAudience)

Decodes a Vincent login JWT. Performs basic sanity check but does not perform full verify() logic.  You will want to run `verify()` from the jwt tools to verify the JWT is fully valid and not expired etc.

- The expected audience is typically your app's domain -- it should be one of your valid redirectUri values from your Vincent app configuration

- Returns: An object containing both the original JWT string and the decoded JWT object


#### removeLoginJWTFromURI()

Removes the login JWT parameter from the current URI. Call this after you have verified and stored the JWT for later usage.

### Basic Usage

```typescript
import { getVincentWebAppClient, jwt } from '@lit-protocol/vincent-sdk';

const { isExpired } = jwt;

const vincentAppClient = getVincentWebAppClient({ appId: MY_APP_ID });
// ... In your app logic:
if(vincentAppClient.isLogin()) {
  // Handle app logic for the user has just logged in
  const { decoded, jwt } = vincentAppClient.decodeVincentLoginJWT(window.location.origin);
  // Store `jwt` for later usage; the user is now logged in.
} else {
  // Handle app logic for the user is _already logged in_ (check for stored & unexpired JWT)
  
  const jwt = localStorage.getItem('VINCENT_AUTH_JWT');
  if(jwt && isExpired(jwt)) {
    // User must re-log in
    vincentAppClient.redirectToConsentPage({ redirectUri: window.location.href });
  }

  if(!jwt) {
    // Handle app logic for the user is not yet logged in
    vincentAppClient.redirectToConsentPage({ redirectUri: window.location.href });
  }
}
```

# Backend

In your backend, you will have to verify the JWT to make sure the user has granted you the required permissions to act on their behalf.

## VincentToolClient

The Vincent Tool Client uses an ethers signer for your delegatee account to run Vincent Tools on behalf of your app users.

This client will typically be used by an AI agent or your app backend service, as it requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's private key to authenticate with the LIT network when executing the Vincent Tool.

### Configuration

```typescript
interface VincentToolClientConfig {
  ethersSigner: ethers.Signer;  // An ethers v5 compatible signer
  vincentToolCid: string;       // The CID of the Vincent Tool to execute
}
```

### Methods

#### execute(params: VincentToolParams): Promise<ExecuteJsResponse>

Executes a Vincent Tool with the provided parameters.

- `params`: Record<string, unknown> - Parameters to pass to the Vincent Tool
- Returns: Promise resolving to an ExecuteJsResponse from the LIT network

### Usage

### Authentication
A basic Express authentication middleware factory function is provided with the SDK.
- Create an express middleware using `getAuthenticateUserExpressHandler()`
- Once you have added the middleware to your route, use `authenticatedRequestHandler()` to provide
  type-safe access to `req.user` in your downstream RequestHandler functions.
- When defining your authenticated routes, use the `ExpressAuthHelpers` type to type your functions and function arguments.

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

### Tool execution
```typescript
import { getVincentToolClient } from '@lit-protocol/vincent-sdk';

const ALLOWED_AUDIENCE = 'YOUR_FRONTEND_URL';

const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

// Initialize the Vincent Tool Client
const toolClient = getVincentToolClient({
  ethersSigner: delegateeSigner,
  vincentToolCid: 'your-vincent-tool-cid'
});

// Execute the Vincent Tool
const response = await toolClient.execute({
  // Tool-specific parameters
  param1: 'value1',
  param2: 'value2'
});
```


## JWT Authentication

### Overview

The JWT authentication system in Vincent SDK allows for secure communication between user applications and Vincent Tools. JWTs are used to verify user consent and authorize tool executions.

### Authentication Flow

1. User initiates an action requiring Vincent Tool access
2. Application redirects to the Vincent consent page using `VincentWebAppClient.redirectToConsentPage()`
3. User provides consent for the requested tools/policies
4. User is redirected back to the application with a JWT in the URL
5. Application validates and stores the JWT using `VincentWebAppClient` methods
6. JWT is used to authenticate with the app backend 

### JWT Structure

Vincent JWTs contain:
- User account identity information (pkpAddress and pkpPublicKey)
- Expiration timestamp
- Signature from the Vincent authorization service

### Error Handling

When JWT validation fails, descriptive error messages are thrown to help with troubleshooting.

### Usage Notes

- JWTs have an expiration time after which they are no longer valid
- When a JWT expires, redirect the user to the consent page to obtain a new one using the `VincentWebAppClient`


