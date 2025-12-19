// Direct re-export so consumers can have the same utilities this ability uses
// even if another ability uses a different version of the SDK
export * from '@lit-protocol/vincent-ability-sdk/gatedSigner';

export { bundledVincentAbility } from './generated/vincent-bundled-ability';

export {
  fetchRelayLinkAddresses,
  getRelayClient,
  getRelayLinkQuote,
  isRelayLinkAddress,
  isTestnet,
  type RelayLinkAppFee,
  type RelayLinkQuoteParams,
  type RelayLinkQuoteResponse,
  type RelayLinkTransactionData,
} from './lib/helpers/relay-link';

// ZeroDev smart account helpers for preparing and submitting UserOps
export {
  relayTransactionToUserOp,
  transactionsToZerodevUserOp,
  submitSignedUserOp,
  type ZerodevTransaction,
  type RelayTransactionToUserOpParams,
  type TransactionsToZerodevUserOpParams,
  type SubmitSignedUserOpParams,
} from './lib/helpers/zerodev';

// Crossmint smart account helpers
export {
  transactionsToCrossmintUserOp,
  sendPermittedCrossmintUserOperation,
  type CrossmintTransaction,
  type TransactionsToCrossmintUserOpParams,
  type SendPermittedCrossmintUserOperationParams,
} from './lib/helpers/crossmint';

// Safe smart account helpers
export {
  transactionsToSafeUserOp,
  sendPermittedSafeUserOperation,
  type SafeTransaction,
  type TransactionsToSafeUserOpParams,
  type SendPermittedSafeUserOperationParams,
} from './lib/helpers/safe';
