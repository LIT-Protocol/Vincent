import { initFeatureFlags } from './index';
import Environments from './environments.json';
import FeatureFlags from './flags.json';
import { env } from '../src/config/env';

const currentEnvironment = env.VITE_VINCENT_ENV;

const Features = initFeatureFlags({
  flagState: FeatureFlags,
  currentEnvironment,
  environments: Environments,
});

export default Features;
