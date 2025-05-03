# Lit Protocol Feature Flags

This package enables the use of feature flags across Lit Protocol projects. These feature flags serve as code guards around
functionality being implemented, enabling developers to iterate on more complex features while still being able to
deploy small changes. Feature flags are enabled per environment, allowing finer granularity on how the functionality
is rolled out.

> **Note:** This package is forked from NEAR Wallet's feature flags implementation. Credit to NEAR Protocol for the original code.

## Getting started

Modifying feature flags is done using the NX target we've set up. Simply run:

```
pnpm feature-flags
```

This will run the flag editor tool from your workspace root. The first time you run it, the tool will create the necessary files if they don't exist yet.

The tool prompts you for the intended action, currently one of:
- Creating a new feature flag and setting the environments in which it should be enabled.
- Modifying an existing feature flag to be enabled or disabled in the desired environments.
- Deleting an existing feature flag.
- Adding or removing environments.

The tool manages files in a `features/` directory at your workspace root, so it is crucial that no changes are made to this directory's contents outside the feature flags tool once configured.

## Using Feature Flags

The feature flags tool maintains the following files in the `features/` directory:
- `environments.json`: The valid environments for the application, in the form of `"ENV_NAME": "env_value"`.
- `flags.json`: The set of flags enabled per environment.
- `features.d.ts`: TypeScript type definitions for your feature flags, automatically generated.

To use these feature flags in your application, create a `features.ts` file that initializes the proxy object:

```ts
import { initFeatureFlags } from '@lit-protocol/feature-flags';

import Environments from '../../features/environments.json';
import Flags from '../../features/flags.json';

// Determine the current environment from env variables
const currentEnvironment = process.env.LIT_ENV || 'development';

export const Features = initFeatureFlags({
    currentEnvironment,
    environments: Environments,
    flagState: Flags,
});
```

Once configured, the proxy object can be used to check the state of a feature by referring to
the flag name, e.g. `const isFeatureXEnabled = Features.FEATURE_X`. The proxy object will throw an exception if the
flag does not exist.

## Examples

The following outlines initial example templates for the required files. This code is required to correctly
set up the `Features` proxy object for use in a project.

#### features/environments.json
```json
{
  "PREVIEW": "preview",
  "PRODUCTION": "production"
}
```

#### features/flags.json
```json
{
  "EXPERIMENTAL_FEATURE": {
    "createdBy": "developer.name",
    "createdAt": "2023-10-20T14:30:00.000Z",
    "development": {
      "enabled": true,
      "lastEditedBy": "developer.name",
      "lastEditedAt": "2023-10-20T14:30:00.000Z"
    },
    "staging": {
      "enabled": true,
      "lastEditedBy": "developer.name",
      "lastEditedAt": "2023-10-20T14:30:00.000Z"
    },
    "production": {
      "enabled": false,
      "lastEditedBy": "developer.name",
      "lastEditedAt": "2023-10-20T14:30:00.000Z"
    }
  }
}
```

## License

This project is based on code from NEAR Protocol and maintains the same MIT license.
