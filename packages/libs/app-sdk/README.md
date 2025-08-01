# Vincent SDK

## Installation

```
npm install @lit-protocol/vincent-app-sdk
```

## Usage

# Client (Web)

## WebAuthClient

The Vincent Web Auth Client provides methods for managing user authentication, JWT tokens, and connect flows in Vincent applications.

### Methods

#### redirectToConnectPage()

Redirects the user to the Vincent connect page to obtain authorization. Once the user has completed the vincent connect flow
they will be redirected back to your app with a signed JWT that you can use to authenticate requests against your backend APIs

- When a JWT is expired, you need to use this method to get a new JWT

#### uriContainsVincentJWT()

Checks if the current window location contains a Vincent connect JWT. You can use this method to know that you should update connect state with the newly provided JWT

- Returns: Boolean indicating if the URI contains a connect JWT

#### decodeVincentJWT(expectedAudience)

Decodes a Vincent connect JWT. Performs basic sanity check but does not perform full verify() logic. You will want to run `verify()` from the jwt abilities to verify the JWT is fully valid and not expired etc.

- The expected audience is typically your app's domain -- it should be one of your valid redirectUri values from your Vincent app configuration

- Returns: An object containing both the original JWT string and the decoded JWT object

#### removeVincentJWTFromURI()

Removes the connect JWT parameter from the current URI. Call this after you have verified and stored the JWT for later usage.

### Basic Usage

```typescript
import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webaAthClient';
import { isExpired } from '@lit-protocol/vincent-app-sdk/jwt';

const vincentAppClient = getWebAuthClient({ appId: MY_APP_ID });
// ... In your app logic:
if (vincentAppClient.uriContainsVincentJWT()) {
  // Handle app logic for the user has just logged in
  const { decoded, jwt } = vincentAppClient.decodeVincentJWTFromUri(window.location.origin);
  // Store `jwt` for later usage; the user is now logged in.
} else {
  // Handle app logic for the user is _already logged in_ (check for stored & unexpired JWT)

  const jwt = localStorage.getItem('VINCENT_AUTH_JWT');
  if (jwt && isExpired(jwt)) {
    // User must re-log in
    vincentAppClient.redirectToConnectPage({ redirectUri: window.location.href });
  }

  if (!jwt) {
    // Handle app logic for the user is not yet logged in
    vincentAppClient.redirectToConnectPage({ redirectUri: window.location.href });
  }
}
```

# Backend

In your backend, you will have to verify the JWT to make sure the user has granted you the required permissions to act on their behalf.

## VincentAbilityClient

The Vincent Ability Client uses an ethers signer for your delegatee account to run Vincent Abilities on behalf of your app users.

This client will typically be used by an AI agent or your app backend service, as it requires a signer that conforms to the ethers v5 signer API, and with access to your delegatee account's private key to authenticate with the LIT network when executing the Vincent Ability.

### Configuration

```typescript
interface VincentAbilityClientConfig {
  ethersSigner: ethers.Signer; // An ethers v5 compatible signer
  vincentAbilityCid: string; // The CID of the Vincent Ability to execute
}
```

### Methods

#### execute(params: VincentAbilityParams): Promise<ExecuteJsResponse>

Executes a Vincent Ability with the provided parameters.

- `params`: Record<string, unknown> - Parameters to pass to the Vincent Ability
- Returns: Promise resolving to an ExecuteJsResponse from the LIT network

### Ability execution

```typescript
import { getVincentAbilityClient } from '@lit-protocol/vincent-app-sdk/abilityClient';
// Import the ability you want to execute
import { bundledVincentAbility as erc20BundledAbility } from '@lit-protocol/vincent-ability-erc20-approval';

// One of delegatee signers from your app's Vincent Dashboard
const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

// Initialize the Vincent Ability Client
const abilityClient = getVincentAbilityClient({
  ethersSigner: delegateeSigner,
  bundledVincentAbility: erc20BundledAbility,
});
const delegatorPkpEthAddress = '0x09182301238';

const abilityParams = {
  // Fill with the params your ability needs
};

// Run precheck to see if ability should be executed
const precheckResult = await client.precheck(abilityParams, {
  delegatorPkpEthAddress,
});

if (precheckResult.success === true) {
  // Execute the Vincent Ability
  const executeResult = await client.execute(abilityParams, {
    delegatorPkpEthAddress,
  });

  // ...ability has executed, you can check `executeResult` for details
}
```

### Usage

### Authentication

A basic Express authentication middleware factory function is provided with the SDK.

- Create an express middleware using `getAuthenticateUserExpressHandler()`
- Once you have added the middleware to your route, use `authenticatedRequestHandler()` to provide
  type-safe access to `req.user` in your downstream RequestHandler functions.
- When defining your authenticated routes, use the `ExpressAuthHelpers` type to type your functions and function arguments.

See getAuthenticateUserExpressHandler() documentation to see the source for the express authentication route handler

```typescript
import {
  authenticatedRequestHandler,
  getAuthenticateUserExpressHandler,
} from '@lit-protocol/vincent-app-sdk/expressMiddleware';

import type { AuthenticatedRequest } from '@lit-protocol/vincent-app-sdk/expressMiddleware';

const { ALLOWED_AUDIENCE } = process.env;

const authenticateUserMiddleware = getAuthenticateUserExpressHandler(ALLOWED_AUDIENCE);

// Define an authenticated route handler
const getUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  // Access authenticated user information
  const { pkpAddress } = req.user;

  // Fetch and return user data
  const userData = await userRepository.findByAddress(pkpAddress);
  res.json(userData);
};

// Use in Express route with authentication
app.get('/profile', authenticateUser, authenticatedRequestHandler(getUserProfile));
```

## JWT Authentication

### Overview

The JWT authentication system in Vincent SDK allows for secure communication between user applications and Vincent Abilities. JWTs are used to verify user connect and authorize ability executions.

### Authentication Flow

1. User initiates an action requiring Vincent Ability access
2. Application redirects to the Vincent connect page using `VincentWebAppClient.redirectToConnectPage()`
3. User provides login for the requested abilities/policies
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
- When a JWT expires, redirect the user to the connect page to obtain a new one using the `VincentWebAppClient`

## Release

Pre-requisites:

- You will need a valid npm account with access to the `@lit-protocol` organization.
- Run `pnpm vercel login` at sdk root to get a authentication token for vercel
- Also you will need to fill the `.env` file with the vercel project and org ids for the [vincent-docs](https://vercel.com/lit-protocol/vincent-docs) project.

Then run `pnpm release` on the repository root. It will prompt you to update the Vincent SDK version and then ask you to confirm the release.
This process will also generate a `CHANGELOG.md` record with the changes for the release and update typedoc in vercel after publishing the SDK.
