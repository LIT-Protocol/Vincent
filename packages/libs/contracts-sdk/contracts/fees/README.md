# Fee Diamond Contract System

The Fee Diamond is a sophisticated smart contract system built using the Diamond Pattern (EIP-2535) that manages performance fees for DeFi protocols. It provides a unified interface for facilitating withdrawals and swaps across multiple DeFi platforms while automatically collecting performance fees on profitable operations.

## Overview

The Fee Diamond system allows Vincent's abilities to facilitate user withdrawals from DeFi protocols (currently Morpho and Aave) and automatically collect performance fees when users withdraw their funds. The system also supports token swaps on Aerodrome DEX with automatic fee collection from input tokens. All deposits are held directly by users, and the fee diamond is used to execute withdrawals and swaps, with fees collected at that point. The system tracks user deposits, calculates profits, and takes a configurable percentage of the profit as a fee. All functionality is indexed by appId, and collected fees are split between the Lit Foundation (appId 0) and the app that initiated the action.

### Key Features

- **Multi-Protocol Support**: Currently supports Morpho and Aave protocols
- **DEX Integration**: Supports token swaps on Aerodrome DEX with automatic fee collection
- **Performance Fee Collection**: Automatically calculates and collects fees only on profits
- **Swap Fee Collection**: Automatically collects fees from input tokens during swaps
- **User-Held Deposits**: All deposits are held directly by users, not the fee diamond
- **AppId Indexing**: All functionality is indexed by appId for proper fee attribution
- **Fee Split System**: Collected fees are automatically split between Lit Foundation and app managers
- **Full Withdrawal Only**: Simplified implementation that only supports full withdrawals
- **Deterministic Deployment**: Uses Create2 for consistent addresses across EVM chains
- **Admin Controls**: Owner can adjust fee percentages and withdraw Lit Foundation fees
- **App Manager Controls**: App managers with a valid oracle attestation can withdraw their portion of collected fees
- **Oracle-Verified Fee Withdrawals**: Lit Action oracles attest to the true Chronicle Yellowstone owner before fees can be withdrawn
- **User Recovery**: Users can discover their deposits even if the Vincent app disappears

## Architecture

The system follows the Diamond Pattern with the following components:

### Core Contract

- **`Fee.sol`**: Main diamond contract that routes calls to appropriate facets

### Storage Library

- **`LibFeeStorage.sol`**: Contains all storage structures and state management

### Facets (Implementation Contracts)

#### 1. MorphoPerfFeeFacet

Handles deposits and withdrawals for Morpho protocol vaults.

**Key Functions:**

- `depositToMorpho(uint40 appId, address vaultAddress, uint256 assetAmount)`: Deposits assets into a Morpho vault
- `withdrawFromMorpho(uint40 appId, address vaultAddress)`: Withdraws all funds from a Morpho vault

#### 2. AavePerfFeeFacet

Handles deposits and withdrawals for Aave protocol pools.

**Key Functions:**

- `depositToAave(uint40 appId, address poolAsset, uint256 assetAmount)`: Deposits assets into an Aave pool
- `withdrawFromAave(uint40 appId, address poolAsset, uint256 amount)`: Withdraws funds from an Aave pool

#### 3. FeeAdminFacet

Administrative functions for managing the fee system and withdrawing collected fees.

**Key Functions:**

Admin Functions (Owner only):

- `setPerformanceFeePercentage(uint256 newPercentage)`: Sets the performance fee percentage (in basis points)
- `setSwapFeePercentage(uint256 newPercentage)`: Sets the swap fee percentage (in basis points)
- `setLitAppFeeSplitPercentage(uint256 newPercentage)`: Sets the Lit Foundation/App fee split percentage (in basis points)
- `setAavePool(address newAavePool)`: Sets the Aave pool contract address
- `setAerodromeRouter(address newAerodromeRouter)`: Sets the Aerodrome router contract address
- `setVincentAppDiamondOnYellowstone(address newVincentAppDiamondOnYellowstone)`: Sets the Chronicle Yellowstone Vincent App Diamond contract address used for owner lookups
- `setLitFoundationWallet(address newLitFoundationWallet)`: Sets the Lit Foundation wallet address that can withdraw platform fees
- `setOwnerAttestationSigner(address newOwnerAttestationSigner)`: Sets the Lit Action PKP address that signs owner attestations

Fee Withdrawal Functions:

- `withdrawAppFees(uint40 appId, address tokenAddress, FeeUtils.OwnerAttestation calldata ownerAttestation, bytes calldata ownerAttestationSig)`: Withdraws collected fees for a specific app and token after verifying a Lit Action signature that attests to the Chronicle Yellowstone owner
- `withdrawPlatformFees(address tokenAddress)`: Withdraws Lit Foundation fees (appId 0) for a specific token (only callable by Lit Foundation wallet)

View Functions:

- `tokensWithCollectedFees(uint40 appId)`: Returns list of tokens that have collected fees for a specific app
- `tokensWithCollectedFeesLength(uint40 appId)`: Returns the count of tokens with collected fees for a specific app
- `tokensWithCollectedFeesAtIndex(uint40 appId, uint256 index)`: Returns the token address at a specific index in the collected fees set
- `collectedAppFees(uint40 appId, address tokenAddress)`: Returns the amount of collected fees for a specific app and token
- `aerodromeRouter()`: Returns the current Aerodrome router address
- `aavePool()`: Returns the current Aave pool address
- `performanceFeePercentage()`: Returns the current performance fee percentage
- `swapFeePercentage()`: Returns the current swap fee percentage
- `litAppFeeSplitPercentage()`: Returns the current Lit/App fee split percentage
- `litFoundationWallet()`: Returns the Lit Foundation wallet address
- `ownerAttestationSigner()`: Returns the owner attestation signer address
- `vincentAppDiamondOnYellowstone()`: Returns the Vincent App Diamond address on Chronicle Yellowstone
- `verifyOwnerAttestation(uint40 appId, FeeUtils.OwnerAttestation calldata oa, bytes calldata sig)`: Verifies an owner attestation signature (public view function)

#### 4. AerodromeSwapFeeFacet

Handles token swaps on Aerodrome DEX with automatic fee collection from input tokens.

**Key Functions:**

- `swapExactTokensForTokensOnAerodrome(uint40 appId, uint256 amountIn, uint256 amountOutMin, IRouter.Route[] calldata routes, address to, uint256 deadline)`: Executes token swaps on Aerodrome and collects fees from input tokens

#### 5. FeeViewsFacet

Read-only functions for querying deposit information and collected fees.

**Key Functions:**

- `deposits(uint40 appId, address user, address vaultAddress)`: Returns deposit information for a user/vault pair
- `collectedAppFees(uint40 appId, address tokenAddress)`: Returns the amount of collected fees for a specific app and token

## How It Works

### Deposit Process

1. **User Authorization**: User approves the Fee Diamond to spend their tokens
2. **Deposit Execution**: Ability calls `depositToMorpho()` or `depositToAave()` with the appId
3. **Asset Transfer**: Tokens are transferred from user to the Fee Diamond contract
4. **Protocol Interaction**: Contract deposits tokens into the target DeFi protocol
5. **Record Keeping**: Contract records the deposit amount and vault shares for the user, indexed by appId
6. **User Receives Shares**: User receives vault shares (Morpho) or aTokens (Aave) directly

### Withdrawal Process

1. **Withdrawal Request**: User calls `withdrawFromMorpho()` or `withdrawFromAave()` with the appId
2. **Share Transfer**: User transfers their vault shares/aTokens to the Fee Diamond contract
3. **Profit Calculation**: Contract calculates profit by comparing withdrawal amount to original deposit
4. **Fee Calculation**: If there's a profit, calculates performance fee (percentage of profit)
5. **Fee Split**: Collected fees are automatically split between Lit Foundation (appId 0) and the app (based on litAppFeeSplitPercentage)
6. **Asset Distribution**:
   - Performance fee remains in the contract (split between Lit Foundation and app)
   - Remaining amount (original deposit + user's share of profit) goes to user
7. **Cleanup**: Deposit records are cleared and user's vault list is updated

### Aerodrome Swap Process

1. **User Authorization**: User approves the Fee Diamond to spend their input tokens
2. **Fee Calculation**: Contract calculates swap fee from the input amount (percentage of input tokens)
3. **Token Transfer**: Input tokens are transferred from user to the Fee Diamond contract
4. **Fee Deduction**: Swap fee is deducted from the input amount before executing the swap
5. **Swap Execution**: Contract executes the swap on Aerodrome DEX with the reduced input amount
6. **Fee Split**: The calculated fee is automatically split between Lit Foundation (appId 0) and the app (based on litAppFeeSplitPercentage)
7. **Token Distribution**: Swapped output tokens are transferred to the user
8. **Fee Tracking**: Input token address is added to the set of tokens with collected fees for both Lit Foundation and the app

### Fee Split System

The fee diamond implements an automatic fee split system where collected fees are divided between the Lit Foundation and the app that initiated the action:

1. **Lit Foundation (appId 0)**: Receives a configurable percentage of all collected fees
2. **App Manager**: Receives the remaining percentage of fees collected from their app's actions
3. **Automatic Split**: Fees are automatically split when collected using the `litAppFeeSplitPercentage` setting
4. **Separate Withdrawal**: Each party can withdraw their portion independently using `withdrawAppFees()`

### App Fee Withdrawal Process

1. **Signature Request**: The app owner requests a signature from the Lit Action oracle. The action queries the Chronicle Yellowstone chain to confirm the current owner of the Vincent app.
2. **Owner Attestation**: The Lit Action signs a `FeeUtils.OwnerAttestation` payload containing the source and destination chain IDs, the Vincent app diamond addresses, the appId, the verified owner wallet, and a short-lived validity window.
3. **Transaction Submission**: The app owner submits `withdrawAppFees(appId, tokenAddress, ownerAttestation, ownerAttestationSig)` with the attestation and signature.
4. **On-Chain Verification**: The Fee Diamond verifies the signature against the configured oracle signer and ensures the indicated owner matches the transaction sender before releasing the fees.
5. **Fee Distribution**: After verification, the contract transfers the accumulated fees for the app and token to the caller.

**Fee Split Calculation:**

```
litFoundationAmount = totalFee * litAppFeeSplitPercentage / 10000
appAmount = totalFee - litFoundationAmount
```

Where `litAppFeeSplitPercentage` is expressed in basis points (e.g., 1000 = 10% to Lit Foundation, 90% to app).

### Fee Calculation

#### Performance Fees (Morpho/Aave)

The performance fee is calculated as:

```
if (withdrawalAmount > originalDepositAmount) {
    profit = withdrawalAmount - originalDepositAmount
    performanceFee = profit * performanceFeePercentage / 10000
    userReceives = withdrawalAmount - performanceFee
}
```

Where `performanceFeePercentage` is expressed in basis points (1000 = 10%).

#### Swap Fees (Aerodrome)

The swap fee is calculated as:

```
swapFee = amountIn * swapFeePercentage / 10000
actualAmountIn = amountIn - swapFee
amountOutMin = amountOutMin - (amountOutMin * swapFeePercentage / 10000)
```

Where `swapFeePercentage` is expressed in basis points (e.g., 50 = 0.5%). The fee is collected from the input token and accumulates in the contract for later withdrawal by the owner.

## Storage Structure

The system uses a sophisticated storage structure to track:

- **User Deposits**: Maps appId → user address → vault address → deposit details
- **Performance Fee Percentage**: Configurable fee rate in basis points
- **Swap Fee Percentage**: Configurable swap fee rate in basis points
- **Lit App Fee Split Percentage**: Configurable split rate between Lit Foundation and apps in basis points
- **Collected Fees Tracking**: Maps appId → set of token addresses that have collected fees
- **Collected App Fees**: Maps appId → token address → amount of collected fees
- **Protocol Configuration**: Aave pool contract address and Aerodrome router address
- **Vincent App Diamond on Yellowstone**: Address of the Vincent App Diamond contract on Chronicle Yellowstone for app manager verification
- **Owner Attestation Signer**: Address of the Lit Action PKP that signs owner attestations
- **Lit Foundation Wallet**: Address that can withdraw platform fees (appId 0)

## Example Usage

You can use the full diamond ABI with all the facets in `abis/FeeDiamond.abi.json`, instead of interfacing with the facets directly. The examples below are for the facets directly, but if you loaded the FeeDiamond ABI in you could use all the same functions.

### Basic Deposit and Withdrawal

```solidity
uint40 appId = 12345; // Your app's ID

// Deposit 1000 USDC into Morpho
morphoPerfFeeFacet.depositToMorpho(appId, morphoVaultAddress, 1000e6);

// Later, withdraw all funds (with performance fee applied to profits)
morphoPerfFeeFacet.withdrawFromMorpho(appId, morphoVaultAddress);
```

### Aerodrome Token Swaps

```solidity
uint40 appId = 12345; // Your app's ID

// Create swap route (USDC to WETH)
IRouter.Route[] memory routes = new IRouter.Route[](1);
routes[0] = IRouter.Route(usdcAddress, wethAddress, false, address(0));

// Execute swap with fee collection
aerodromeSwapFeeFacet.swapExactTokensForTokensOnAerodrome(
    appId,              // app ID
    1000e6,             // 1000 USDC input
    0,                  // minimum output (adjusted internally for fees)
    routes,             // swap route
    userAddress,        // recipient
    block.timestamp + 1 hours // deadline
);
```

### Admin Operations

```solidity
// Set performance fee to 5% (500 basis points)
feeAdminFacet.setPerformanceFeePercentage(500);

// Set swap fee to 0.5% (50 basis points)
feeAdminFacet.setSwapFeePercentage(50);

// Set Lit Foundation fee split to 10% (1000 basis points)
feeAdminFacet.setLitAppFeeSplitPercentage(1000);

// Set Aerodrome router address
feeAdminFacet.setAerodromeRouter(aerodromeRouterAddress);

// Set Vincent App Diamond address on Chronicle Yellowstone
feeAdminFacet.setVincentAppDiamondOnYellowstone(vincentAppDiamondOnYellowstone);

// Set Lit Foundation wallet
feeAdminFacet.setLitFoundationWallet(litFoundationWalletAddress);

// Set owner attestation signer (Lit Action PKP address)
feeAdminFacet.setOwnerAttestationSigner(pkpAddress);

// Build owner attestation payload signed by the Lit Action oracle
FeeUtils.OwnerAttestation memory ownerAttestation = FeeUtils.OwnerAttestation({
    srcChainId: chronicleChainId,
    srcContract: vincentAppDiamondOnYellowstone,
    owner: appOwner,
    appId: appId,
    issuedAt: block.timestamp,
    expiresAt: block.timestamp + 5 minutes,
    dstChainId: block.chainid,
    dstContract: address(feeAdminFacet)
});
bytes memory ownerAttestationSig = /* signature returned from Lit Action */;

// Withdraw app fees after oracle verification
feeAdminFacet.withdrawAppFees(appId, usdcAddress, ownerAttestation, ownerAttestationSig);

// Withdraw Lit Foundation fees (appId 0)
feeAdminFacet.withdrawPlatformFees(usdcAddress);

// Get list of tokens with collected fees for Lit Foundation
address[] memory litFeeTokens = feeAdminFacet.tokensWithCollectedFees(0);

// Get list of tokens with collected fees for a specific app
address[] memory appFeeTokens = feeAdminFacet.tokensWithCollectedFees(appId);
```

### Querying User Deposits

```solidity
uint40 appId = 12345; // Your app's ID

// Get deposit information for a user
LibFeeStorage.Deposit memory deposit = feeViewsFacet.deposits(appId, userAddress, vaultAddress);

// Get collected fees for Lit Foundation
uint256 litFees = feeViewsFacet.collectedAppFees(0, tokenAddress);

// Get collected fees for a specific app
uint256 appFees = feeViewsFacet.collectedAppFees(appId, tokenAddress);
```

## Security Features

- **Reentrancy Protection**: Deposit records are cleared before external calls
- **Access Control**: Only contract owner can modify fee settings and withdraw Lit Foundation fees
- **App Manager Access Control**: Only app managers holding a valid Lit Action owner attestation can withdraw their app's collected fees
- **Input Validation**: Comprehensive error handling for invalid operations
- **Provider Validation**: Prevents mixing deposits between different protocols
- **AppId Validation**: All functions require valid appId parameters

## Deployment

The contracts are deployed deterministically using Create2, ensuring the same contract address across all EVM chains when using the same deployer.

### Automated Multi-Chain Deployment

The fee contracts can be deployed to all Aave-supported chains using the automated deployment script at `scripts/fees/deployFeeContracts.ts`. This script handles:

- **Idempotent Deployments**: Automatically skips chains that are already deployed
- **Balance Checking**: Verifies deployer has sufficient funds before attempting deployment
- **Aave Pool Configuration**: Automatically sets the Aave pool address from the `@bgd-labs/aave-address-book` package
- **Gas Price Handling**: Automatically handles special gas requirements (e.g., Polygon's minimum priority fee)
- **Real-time Progress**: Streams forge script output so you can monitor deployment progress
- **Output Formatting**: Generates properly formatted output for copying into `constants.ts`

#### Prerequisites

1. **Environment Variables**: Set the following in your `.env` file:

   ```bash
   VINCENT_DEPLOYER_PRIVATE_KEY=<your-deployer-private-key>
   VINCENT_PROD_DIAMOND_ADDRESS=<vincent-prod-diamond-address>
   ETHERSCAN_API_KEY=<your-etherscan-api-key>

   # RPC URLs for each chain (format: <NETWORK_NAME>_RPC_URL)
   MAINNET_RPC_URL=<ethereum-mainnet-rpc-url>
   POLYGON_RPC_URL=<polygon-mainnet-rpc-url>
   AVALANCHE_RPC_URL=<avalanche-mainnet-rpc-url>
   ARBITRUM_ONE_RPC_URL=<arbitrum-mainnet-rpc-url>
   OPTIMISM_RPC_URL=<optimism-mainnet-rpc-url>
   BASE_RPC_URL=<base-mainnet-rpc-url>
   BNB_RPC_URL=<bnb-mainnet-rpc-url>
   GNOSIS_RPC_URL=<gnosis-mainnet-rpc-url>
   SCROLL_RPC_URL=<scroll-mainnet-rpc-url>
   METIS_RPC_URL=<metis-mainnet-rpc-url>
   LINEA_RPC_URL=<linea-mainnet-rpc-url>
   ZKSYNC_RPC_URL=<zksync-mainnet-rpc-url>
   SEPOLIA_RPC_URL=<sepolia-testnet-rpc-url>
   BASE_SEPOLIA_RPC_URL=<base-sepolia-testnet-rpc-url>
   ARBITRUM_ONE_SEPOLIA_RPC_URL=<arbitrum-sepolia-testnet-rpc-url>
   OPTIMISM_SEPOLIA_RPC_URL=<optimism-sepolia-testnet-rpc-url>
   SCROLL_SEPOLIA_RPC_URL=<scroll-sepolia-testnet-rpc-url>
   ```

2. **Funded Deployer Wallet**: Ensure the deployer wallet has sufficient native tokens on each chain for gas fees

3. **Dependencies**: The script requires `@bgd-labs/aave-address-book` package (already included in `package.json`)

#### Running the Deployment

From the `packages/libs/contracts-sdk` directory, run:

```bash
nx run contracts-sdk:deploy:fee-contracts
```

Or using the shorter form:

```bash
nx deploy:fee-contracts contracts-sdk
```

#### What the Script Does

1. **Checks Existing Deployments**: Reads `VINCENT_CONTRACT_ADDRESS_BOOK.fee` from `constants.ts` to determine which chains are already deployed

2. **For Each Chain**:
   - Validates RPC URL is configured
   - Checks deployer balance (throws error if zero)
   - If not already deployed:
     - Runs `forge script` to deploy the fee diamond contract
     - Streams output in real-time so you can monitor progress
     - Parses the deployed contract address from the output
   - If already deployed:
     - Uses the existing address from `constants.ts`
   - Configures Aave Pool:
     - Checks if Aave pool is set on the deployed contract
     - If set to `0x00...000`, fetches the correct Aave pool address from `@bgd-labs/aave-address-book`
     - Calls `setAavePool()` with appropriate gas prices (handles Polygon's special requirements)

3. **Outputs Results**: After all deployments, outputs formatted results that can be copied into `VINCENT_CONTRACT_ADDRESS_BOOK.fee` in `constants.ts`

#### Supported Chains

The script automatically deploys to all Aave-supported chains:

**Mainnets:**

- Ethereum (1)
- Polygon (137)
- Avalanche (43114)
- Arbitrum (42161)
- Optimism (10)
- Base (8453)
- BNB Chain (56)
- Gnosis (100)
- Scroll (534352)
- Metis (1088)
- Linea (59144)
- ZkSync (324)

**Testnets:**

- Sepolia (11155111)
- Base Sepolia (84532)
- Arbitrum Sepolia (421614)
- Optimism Sepolia (11155420)
- Scroll Sepolia (534351)

#### Gas Price Handling

The script automatically handles special gas requirements:

- **Polygon**: Sets minimum priority fee of 30 gwei (above Polygon's 25 gwei minimum)
- **Other Chains**: Uses standard EIP-1559 fee data from the network

#### Manual Deployment (Single Chain)

If you need to deploy to a single chain manually, you can use the shell script:

```bash
bash scripts/fees/deploy_fee_contracts_to_one_chain.sh <network-name>
```

Example:

```bash
bash scripts/fees/deploy_fee_contracts_to_one_chain.sh base_sepolia
```

After manual deployment, you'll need to manually set the Aave pool address:

```solidity
feeAdminFacet.setAavePool(aavePoolAddress);
```

#### Updating Constants

After deployment, copy the output from the script into `packages/libs/contracts-sdk/src/constants.ts`:

```typescript
export const VINCENT_CONTRACT_ADDRESS_BOOK = {
  fee: {
    84532: {
      chainName: 'baseSepolia',
      address: '0x...',
      salt: 'DatilCreate2Salt',
    },
    // ... other chains
  },
};
```

## Error Handling

The system includes comprehensive error handling:

- `DepositNotFound`: When trying to withdraw from a non-existent deposit
- `NotMorphoVault`/`NotAavePool`: When trying to withdraw from wrong protocol
- `DepositAlreadyExistsWithAnotherProvider`: When trying to deposit to same vault with different protocol
- `CallerNotOwner`: When non-owner tries to call admin functions
- `CallerNotAppManager`: When non-app-manager tries to withdraw app fees
- `ZeroAppId`: When appId is 0 (reserved for Lit Foundation)

## Testing

Comprehensive test suites are available in `test/fees/`:

- `MorphoFee.t.sol`: Unit tests for Morpho functionality
- `AaveFeeForkTest.t.sol`: Fork tests for Aave integration
- `MorphoFeeForkTest.t.sol`: Fork tests for Morpho integration
- `AerodromeFeeForkTest.t.sol`: Fork tests for Aerodrome swap integration
- `FeeTestCommon.sol` and the fork tests include helpers that mock the Lit Action oracle by locally signing `OwnerAttestation` payloads, demonstrating how fee withdrawals are authorized.

## Future Enhancements

- Support for partial withdrawals
- Additional DeFi protocol integrations
- More sophisticated fee calculation methods
- Batch operations for multiple vaults

# Cross-chain claiming

If the fees accrue on Base, how does the app developer withdraw them? The app developer's wallet is on Chronicle, not on Base.

Options:

1. Lit oracle. A Lit Action queries Chronicle, and retrieves the owner for the appId. It signs the appId, the wallet address, and some kind of challenge to prevent replays (could be a recent blockhash, could be a timestamp). Before claiming, the user hits this Lit Action and gets the signed proof. They provide the signed proof with their claim txn, and the fee contract verifies it.
2. Hyperlane cross-chains comms. This would require a txn on Chronicle, to initiate the cross-chain message, which would pop-out on Base and go to the Fee contract. The Fee contract would store the owner from this message with a timestamp. The user can then claim using the same wallet, and the Fee contract will check that the wallet sent in the cross-chain message matches the wallet they're making the txn with.
3. Data mirroring. Every time the a developer creates an app or changes their owner address, we use a Lit Action to check that data on Chronicle, and send it into any target chains that are collecting fees. Therefore, the owner address is already present on the target chain (Base, in the example) and the user just makes a normal txn to withdraw their fees. The downside of this approach is that we have to write the owner address on every change to every chain there could be fees on, and we have to pay gas to do that. On networks like Base that's small, but on eth for example, it could get pricey, and there's a bit of a DoS attack here where the dev changes their owner address often to drain the gas from this wallet. We would have to put some restrictions in like "you can only change owner address 10 times a year" or something. But creating new apps is free and permissionless, so they can just create new apps to get around the 10 change limit and drain the wallet.

We could do this via Hyperlane cross-chain messaging.

## Solution

We're going to go with solution 1 for simplicity and cheapness.

Payload for the Lit Action to sign:

```
struct OwnerAttestation {
    uint256 srcChainId;        // typically Chronicle chain Id
    address srcContract;       // typically the VincentAppDiamond contract
    address owner;             // owner address from the L3
    uint256 appId;             // the Vincent appId that this user is an owner of
    uint256 issuedAt;          // unix time from Lit Action
    uint256 expiresAt;            // issuedAt + 5 minutes
    uint256 dstChainId;        // destination chain id to prevent cross-chain replay
    address dstContract;       // destination chain verifier contract, to prevent cross-contract replay
}
```

The `withdrawAppFees` function now consumes this attestation alongside the oracle's signature. The signature must come from the configured Lit Action signer, and the attested `owner` must match the caller address. This guarantees that withdrawals on destination chains such as Base are only executed by the true app owner as recorded on the Chronicle Yellowstone chain.
