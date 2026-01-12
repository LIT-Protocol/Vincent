// src/lib/handlers/constants.ts

export const LIT_DATIL_PUBKEY_ROUTER_ADDRESS = '0xF182d6bEf16Ba77e69372dD096D8B70Bc3d5B475';

declare const __VINCENT_REGISTRY_LIT_CHAIN__: string | undefined;

export const VINCENT_REGISTRY_LIT_CHAIN =
  typeof __VINCENT_REGISTRY_LIT_CHAIN__ === 'string' ? __VINCENT_REGISTRY_LIT_CHAIN__ : 'base';
