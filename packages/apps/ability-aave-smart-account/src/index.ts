// Drect re-export so consumers can have the same utilities this ability uses
// even if another ability uses a different version of the SDK
export * from '@lit-protocol/vincent-ability-sdk/gatedSigner';

export { bundledVincentAbility } from './generated/vincent-bundled-ability';

export {
  AAVE_POOL_ABI,
  CHAIN_TO_AAVE_ADDRESS_BOOK,
  getAaveAddresses,
  getAvailableMarkets,
  getATokens,
} from './lib/helpers/aave';
