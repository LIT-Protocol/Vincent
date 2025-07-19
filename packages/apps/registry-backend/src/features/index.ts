import { getFeatureFlags } from '@lit-protocol/flags';

import type { Features } from './features';

import Flags from './featureState.json';

const envVarName = 'LIT_FEATURE_ENV';

const Features = getFeatureFlags({
  envVarName,
  featureState: Flags,
}) as Features;

export { Features };
