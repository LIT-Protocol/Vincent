---
title: Vincent SDK API Reference
sidebar_position: 1
---

import TypeDocWrapper from '@site/src/components/TypeDocWrapper';

# Vincent SDK API Reference

<TypeDocWrapper>

The Vincent SDK provides a comprehensive set of TypeScript APIs for integrating wallet delegation into your applications. The detailed API documentation is generated automatically from the source code using TypeDoc.

## Key Components

The SDK provides several key components:

- **VincentSDK**: The main SDK class for interacting with Vincent
- **Authentication**: Methods for authenticating users and agents
- **Delegations**: Creating and managing wallet delegations
- **Tools**: Predefined tools and custom tool creation utilities

## Installation

```bash
npm install @lit-protocol/vincent-sdk
# or
yarn add @lit-protocol/vincent-sdk
# or
pnpm add @lit-protocol/vincent-sdk
```

## Usage Examples

### Initializing the SDK

```typescript
import { VincentSDK } from '@lit-protocol/vincent-sdk';

// Initialize the SDK
const vincentSDK = new VincentSDK({
  // Configuration options
});
```

### Creating a Delegation

```typescript
// Create a delegation
const delegation = await vincentSDK.createDelegation({
  // Delegation parameters
});
```

## API Reference

Please visit the [detailed API reference documentation](/api/reference) generated from the TypeScript source code.

</TypeDocWrapper> 