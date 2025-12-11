// Direct re-export so consumers can have the same utilities this ability uses
// even if another ability uses a different version of the SDK
export * from '@lit-protocol/vincent-ability-sdk/gatedSigner';

export { bundledVincentAbility } from './generated/vincent-bundled-ability';

export {
  type Transaction,
  AAVE_POOL_ABI,
  CHAIN_TO_AAVE_ADDRESS_BOOK,
  getAaveAddresses,
  getAaveApprovalTx,
  getAaveBorrowTx,
  getAaveRepayTx,
  getAaveSupplyTx,
  getAaveWithdrawTx,
  getAvailableMarkets,
  getATokens,
  getFeeContractAddress,
} from './lib/helpers/aave';
