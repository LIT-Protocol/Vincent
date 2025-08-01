---
category: Developers
title: Authenticating Vincent Users
---

# Authenticating Users Using the Vincent Web App Client

Exported from the Vincent App SDK, the Vincent Web App Client provides methods for securely authenticating users and obtaining their consent to execute Vincent Abilities on their behalf.

Using the Web App Client, you can direct users to the Vincent Connect page where:

- New users can review the Abilities your App is requesting permission to execute and configure the Vincent Policies that govern their use.
- Returning users can log in and confirm both their identity and the specific App Version they’ve previously authorized to act on their behalf.

This guide walks you through the process of authenticating Vincent Users in your frontend application using the Web App Client.

# Vincent JWT Overview

At the end of the Vincent Connect flow, the User’s Agent Wallet signs a JWT and returns it as a URL parameter in the redirect URI. This JWT proves that:

- The User has been authenticated using their Agent Wallet
- The User has granted your Vincent App permission to act on their behalf

## JWT Structure

Each Vincent JWT contains the following claims in its payload:

- `pkp`: An object representing the User’s Agent Wallet, including their ethAddress, publicKey, and tokenId
- `app`: The Vincent App the JWT was issued for, including:
  - `id`: The App ID
  - `version`: The specific App Version the User has authorized
- `authentication`: The method used to authenticate the User, such as:
  - `type`: "email", "phone", or "passkey"
  - `value`: (Optional) identifier used during authentication (e.g. email address)
- `aud`: The audience this JWT is valid for (typically your app’s domain or redirect URI)
- `exp`: Expiration timestamp (in seconds since Unix epoch)

In addition to the payload, the JWT also includes:

- `header`: Standard JWT header containing algorithm and type information
- `signature`: A signature from the User’s Agent Wallet proving the JWT was signed using their Agent Wallet
- `data`: The raw, unsigned payload string used during signing

> **Note:** To access these claims, use [decodeVincentJWT](#decodevincentjwt) in your frontend.

## Authentication Flow

1. Your App redirects the user to the Vincent Connect Page using `redirectToConnectPage`
2. The User reviews the Abilities your App wants to use and configures the Policies that will govern them
3. Upon approval, the User is redirected back to your App with a signed JWT in the URL
4. Your App extracts and verifies the JWT using `decodeVincentJWT` in your frontend
   - **Note:** For your backend it's **critical** that you verify the Vincent JWT that's submitted to your backend to authenticate the User. This is done by importing the `verify` method from the `@lit-protocol/vincent-app-sdk/jwt` package, and as shown [here](#verifying-the-vincent-jwt-on-your-backend).
5. The verified JWT can now be stored and used to:
   - Authenticate requests to your backend APIs
   - Execute Vincent Abilities on behalf of the User

# How the Vincent Web App Client Works

The `getWebAuthClient` function from the `@lit-protocol/vincent-app-sdk/webAuthClient` package creates a Web App Client instance tied to your Vincent App’s ID. This client exposes a set of methods for handling user connections and JWT management for your App's frontend.

The Web App Client exposes the following methods:

## `redirectToConnectPage`

Redirects the user to the Vincent Connect Page, and once the User has completed the Connect flow, they will be redirected back to your App with a signed JWT that you can use to authenticate requests against your backend APIs.

- New Users are shown the Abilities your App wants to execute and can configure the Vincent Policies that govern their use.
- Returning Users can log in and confirm their prior delegation to your App.
- When a Vincent JWT is expired, use this method to get a new JWT

## `uriContainsVincentJWT`

Returns `true` if the current URL contains a Vincent connect JWT, indicating the User has just completed the connect flow and should be authenticated.

If this method returns `false`, you should use the `redirectToConnectPage` method to to authenticate the User.

## `decodeVincentJWT`

Extracts and verifies the Vincent connect JWT returned in the URL after a user completes the Connect flow.

This method performs full validation, including:

- Verifying that the JWT was signed by the Vincent User’s Agent Wallet
- Ensuring the JWT has not expired
- Confirming the JWT was issued specifically for your App, by checking that the redirect URI that received the JWT from the Vincent Connect Page is included in the JWT's audience claim

If the JWT is valid, it returns the decoded JWT object containing identity and delegation details (as described in the [JWT Structure](#jwt-structure) section). If the JWT is invalid, expired, or mis-scoped, an error is thrown.

## `removeVincentJWTFromURI`

Use this method to remove the Vincent JWT query parameter from the current URL after you’ve extracted and stored it. You should call this method after you've called `decodeVincentJWT`, validated the JWT, and stored it locally to be used when making authenticated requests to your backend APIs.

# Creating a Web App Client

To initialize the Web App Client, import and call the `getWebAuthClient` function with your App’s ID:

```typescript
import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webAuthClient';

const vincentAppClient = getWebAuthClient({ appId: process.env.MY_VINCENT_APP_ID });
```

The `getWebAuthClient` takes an object as an argument with the following properties:

- `appId`: The ID of your Vincent App.
  - This ID can be found on your [Vincent App Dashboard](https://dashboard.heyvincent.ai/):

![Vincent App Dashboard](../images/vincent-app-dashboard.png)

# Handling Connect Flow

Use the following pattern to manage connect and redirect flows in your frontend:

```typescript
import { getWebAuthClient } from '@lit-protocol/vincent-app-sdk/webAuthClient';
import { isExpired } from '@lit-protocol/vincent-app-sdk/jwt';

const vincentAppClient = getWebAuthClient({ appId: process.env.MY_VINCENT_APP_ID });

if (vincentAppClient.uriContainsVincentJWT()) {
  const { decodedJWT, jwtStr } = vincentAppClient.decodeVincentJWT(window.location.origin);

  // Store JWT for later use
  localStorage.setItem('VINCENT_AUTH_JWT', jwtStr);

  // Clean up the URL
  vincentAppClient.removeVincentJWTFromURI();

  // Proceed with App logic for an authenticated User
} else {
  const storedJwt = localStorage.getItem('VINCENT_AUTH_JWT');
  const isExpired = storedJwt ? jwt.isExpired(storedJwt) : true;

  if (!storedJwt || isExpired) {
    vincentAppClient.redirectToConnectPage({ redirectUri: window.location.href });
  }

  // Proceed with App logic for an authenticated User
}
```

> **Note:** The `redirectUri` given to `redirectToConnectPage` is where the user will be sent with the signed Vincent JWT after completing the Vincent Connect flow.
>
> This **must** be one of the [Authorized Redirect URIs](Creating-Apps.md#authorized-redirect-uris) you've configured for your App.

## Verifying the Vincent JWT on your backend

It's critical that you verify the Vincent JWT that's submitted to your backend to authenticate the User. This is done by importing the `verify` method from the `@lit-protocol/vincent-app-sdk/jwt` package, and as shown here:

```typescript
import { verify } from '@lit-protocol/vincent-app-sdk/jwt';

const vincentJwtSubmittedToBackend = '...';
const jwtAudience = 'https://my-redirect-uri.com';

const decodedVincentJWT = verify(vincentJwtSubmittedToBackend, jwtAudience);
```

Where the `verify` method takes two arguments:

- The Vincent JWT string that was returned to you by the Vincent Connect flow
- The `jwtAudience` string, which is the redirect URI that received the JWT from the Vincent Connect Page

The `verify` method will throw an error if the JWT is invalid, expired, or mis-scoped, otherwise it's considered valid and was created specifically for your App.

# Wrapping Up

By integrating the Vincent Web App Client, your App now supports secure authentication for Vincent Users.

You’ve learned how to:

- Redirect users to the Vincent Connect Page using `redirectToConnectPage`
- Detect when a User returns from the Connect flow with `uriContainsVincentJWT`
- Decode and validate the returned JWT using `decodeVincentJWT`
- Store the JWT for authenticated requests to your backend APIs
- Re-initiate the Connect flow when a JWT is missing or expired

With this in place, your frontend is ready to authenticate Users and safely execute Vincent Abilities on their behalf—within the boundaries they’ve configured through Vincent Policies.

## Next Steps

- Dive into the [Executing Vincent Abilities](./Executing-Abilities.md) guide to learn how to use the Vincent Ability Client to execute your App's Ability on behalf of an authenticated User
- Explore the [Creating Vincent Abilities](../Ability-Developers/Getting-Started.md) guide to learn how to create your own Vincent Abilities
- Explore the [Creating Vincent Policies](../Policy-Developers/Creating-Policies.md) guide to learn how to create your own Vincent Policies
