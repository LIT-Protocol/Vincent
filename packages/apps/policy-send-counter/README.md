# Vincent Policy Send Counter

A policy that can be attached to Vincent abilitys to limit the number of transactions that can be sent within a specific time period.

## Overview

The Vincent Policy Send Counter is part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK. It allows users to set transaction count limits for abilitys, providing an additional layer of security and control.

## Features

- Set maximum transaction limits per time period
- Track transaction counts across multiple abilitys
- Configurable by users through the Vincent Dashboard

## Installation

```bash
npm install @lit-protocol/vincent-policy-send-counter
```

## Usage

This policy can be integrated with Vincent Abilities to enforce transaction count limits:

```typescript
import {
  createVincentAbilityPolicy,
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-send-counter';

const abilityParamsSchema = z.object({
  // Your ability's parameter schema
});

const sendCounterPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  // Map your ability's parameters to the policy's expected parameters if needed
  abilityParameterMappings: {
    /* your parameter mappings */
  },
});

export const myAbility = createVincentAbility({
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([sendCounterPolicy]),
  // ... rest of ability implementation
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
