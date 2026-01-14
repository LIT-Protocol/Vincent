import { env } from './env';

const { VITE_ENV } = env;

const REGISTRY_CONFIG = {
  development: { url: 'http://localhost:3000', domain: 'localhost:5173' },
  staging: {
    url: 'https://staging.registry.heyvincent.ai',
    domain: 'staging.registry.heyvincent.ai',
  },
  production: { url: 'https://registry.heyvincent.ai', domain: 'registry.heyvincent.ai' },
} as const;

const config = REGISTRY_CONFIG[VITE_ENV as keyof typeof REGISTRY_CONFIG] || REGISTRY_CONFIG.staging;

export const registryUrl = config.url;
export const registryDomain = config.domain;
