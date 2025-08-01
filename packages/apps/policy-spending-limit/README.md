# Vincent Policy Spending Limit

A policy that can be attached to Vincent abilities to avoid them spending more than a user-defined limit in a specific period of time.

## Overview

The Vincent Policy Spending Limit is part of the Vincent Abilities ecosystem and is built using the Vincent Ability SDK. It allows users to set spending limits for abilities that interact with their funds, providing an additional layer of security and control.

## Features

- Set maximum spending limits per period
- Track spending across multiple abilities
- Configurable by users through the Vincent Dashboard

## Installation

```bash
npm install @lit-protocol/vincent-policy-spending-limit
```

## Usage

This policy can be integrated with Vincent Abilities to enforce spending limits:

```typescript
import {
  createVincentAbilityPolicy,
  createVincentAbility,
  supportedPoliciesForAbility,
} from '@lit-protocol/vincent-ability-sdk';
import { bundledVincentPolicy } from '@lit-protocol/vincent-policy-spending-limit';

const abilityParamsSchema = z.object({
  buy: z.boolean(),
});

const spendingLimitPolicy = createVincentAbilityPolicy({
  abilityParamsSchema,
  bundledVincentPolicy,
  abilityParameterMappings: { buy: 'buyAmount' },
});

export const myTokenSwapAbility = createVincentAbility({
  abilityParamsSchema,
  supportedPolicies: supportedPoliciesForAbility([spendingLimitPolicy]),
  // ... rest of ability implementation
});
```

## Building

Run `nx build policy-spending-limit` to build the library.

## Running unit tests

Run `nx test policy-spending-limit` to execute the unit tests via [Jest](https://jestjs.io).

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
