# Vincent Policy Spending Limit

A policy that can be attached to Vincent tools to avoid them spending more than a user-defined limit in a specific period of time.

## Overview

The Vincent Policy Spending Limit is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It allows users to set spending limits for tools that interact with their funds, providing an additional layer of security and control.

## Features

- Set maximum spending limits per period
- Track spending across multiple tools
- Configurable by users through the Vincent Dashboard

## Installation

```bash
npm install @lit-protocol/vincent-policy-spending-limit
```

## Usage

This policy can be integrated with Vincent Tools to enforce spending limits:

```typescript
import {
  createVincentToolPolicy,
  createVincentTool,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';

const toolParamsSchema = z.object({
  buy: z.boolean(),
});

const spendingLimitPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  toolParameterMappings: { buy: 'buyAmount' },
});

export const myTokenSwapTool = createVincentTool({
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([spendingLimitPolicy]),
  // ... rest of tool implementation
});
```

## Building

Run `nx build vincent-policy-spending-limit` to build the library.

## Running unit tests

Run `nx test vincent-policy-spending-limit` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
