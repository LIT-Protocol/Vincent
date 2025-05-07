import { getFeatureFlags } from '@lit-protocol/flags';

import Environments from './environments.json';
import Flags from './flags.json';
import type { Features } from './features';

const envVarName = 'LIT_FEATURE_ENV';

const Features = getFeatureFlags({
  envVarName,
  environments: Environments,
  flagState: Flags,
}) as Features;

export { Features };
