# Vincent Policy Send Counter

A policy that can be attached to Vincent tools to limit the number of transactions that can be sent within a specific time period.

## Overview

The Vincent Policy Send Counter is part of the Vincent Tools ecosystem and is built using the Vincent Tool SDK. It allows users to set transaction count limits for tools, providing an additional layer of security and control.

## Features

- Set maximum transaction limits per time period
- Track transaction counts across multiple tools
- Configurable by users through the Vincent Dashboard

## Installation

```bash
npm install @lit-protocol/vincent-policy-send-counter
```

## Usage

This policy can be integrated with Vincent Tools to enforce transaction count limits:

```typescript
import {
  createVincentToolPolicy,
  createVincentTool,
  supportedPoliciesForTool,
} from '@lit-protocol/vincent-tool-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-send-counter';

const toolParamsSchema = z.object({
  // Your tool's parameter schema
});

const sendCounterPolicy = createVincentToolPolicy({
  toolParamsSchema,
  bundledVincentPolicy,
  // Map your tool's parameters to the policy's expected parameters if needed
  toolParameterMappings: {
    /* your parameter mappings */
  },
});

export const myTool = createVincentTool({
  toolParamsSchema,
  supportedPolicies: supportedPoliciesForTool([sendCounterPolicy]),
  // ... rest of tool implementation
});
```

## Building

```bash
nx build policy-send-counter
```

## Running Tests

```bash
nx test policy-send-counter
```

## Contributing

Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
