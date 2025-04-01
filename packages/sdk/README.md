# Vincent SDK

## Installation

```
npm install @lit-protocol/vincent-sdk
```

## Usage

### Client

In client app you would want to use the Vincent SDK to get the user consent with the application tools and policies and get a JWT they can use to interact with your backend.

```typescript
import { VincentSDK } from '@lit-protocol/vincent-sdk';

const APP_ID = 'YOUR_REGISTERED_APP_ID';
const REDIRECT_URI = 'https://your-redirect-uri.com';

const vincentSdk = new VincentSDK({ consentPageUrl: 'https://dashboard.heyvincent.ai' });

// 1. Send user to Vincent consent page to get their approved delegation and fetch a JWT
function getJWT() {
  vincentSdk.redirectConsentPage(APP_ID, REDIRECT_URI);
}

// 2. Fetch the JWT at your redirect uri
function getJWT() {
  const jwt = new URLSearchParams(window.location.search).get('jwt');
  // store the JWT somewhere until it expires
}

// 3. Use the JWT to make requests to your backend
async function makeRequest(jwt: string) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  };

  const response = await fetch('https://your-backend-url.com/api/data', {
    method: 'GET',
    headers: headers,
  });

  // Handle the response
}
```

### Backend

In your backend, you will have to verify the JWT to make sure the user has granted you the required permissions to act on their behalf.

```typescript
import { VincentSDK } from '@lit-protocol/vincent-sdk';

const ALLOWED_AUDIENCE = 'YOUR_FRONTEND_URL';

const delegateeSigner = new ethers.Wallet('YOUR_DELEGATEE_PRIVATE_KEY');

const vincentSdk = new VincentSDK();

const processRequest = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;

  const [scheme, jwt] = authHeader.split(' ');
  if (!vincentSdk.verifyJWT(jwt, ALLOWED_AUDIENCE)) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const decodedJWT = vincentSdk.decodeJWT(jwt);

  // You can get the user's address and public key from the decoded JWT, among other things
  // const userAddress = decodedJWT.payload.pkpAddress,
  // const userPublicKey = decodedJWT.payload.pkpPublicKey,

  // You can now execute a tool on behalf of the user using the approved delegation (tools and policies)
  const result = await vincentSdk.executeTool(delegateeSigner, 'YOUR_TOOL_ID', {
    // Your tool params
    foo: 'bar',
  });
};
```


