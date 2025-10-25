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
- **App Manager Controls**: App managers can withdraw their portion of collected fees
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

- `setPerformanceFeePercentage(uint256 newPercentage)`: Sets the performance fee percentage (in basis points)
- `setSwapFeePercentage(uint256 newPercentage)`: Sets the swap fee percentage (in basis points)
- `setLitAppFeeSplitPercentage(uint256 newPercentage)`: Sets the Lit Foundation/App fee split percentage (in basis points)
- `withdrawAppFees(uint40 appId, address tokenAddress)`: Withdraws collected fees for a specific app and token
- `setAavePool(address newAavePool)`: Sets the Aave pool contract address
- `setAerodromeRouter(address newAerodromeRouter)`: Sets the Aerodrome router contract address
- `setVincentAppDiamond(address newVincentAppDiamond)`: Sets the Vincent App Diamond contract address
- `aerodromeRouter()`: Returns the current Aerodrome router address
- `tokensWithCollectedFees(uint40 appId)`: Returns list of tokens that have collected fees for a specific app
- `collectedAppFees(uint40 appId, address tokenAddress)`: Returns the amount of collected fees for a specific app and token

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
- **Vincent App Diamond**: Address of the Vincent App Diamond contract for app manager verification

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

// Set Vincent App Diamond address
feeAdminFacet.setVincentAppDiamond(vincentAppDiamondAddress);

// Withdraw Lit Foundation fees (appId 0)
feeAdminFacet.withdrawAppFees(0, usdcAddress);

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
- **App Manager Access Control**: Only app managers can withdraw their app's collected fees
- **Input Validation**: Comprehensive error handling for invalid operations
- **Provider Validation**: Prevents mixing deposits between different protocols
- **AppId Validation**: All functions require valid appId parameters

## Deployment

The contracts are deployed deterministically using Create2, ensuring the same contract address across all EVM chains when using the same deployer.

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

## Future Enhancements

- Support for partial withdrawals
- Additional DeFi protocol integrations
- More sophisticated fee calculation methods
- Batch operations for multiple vaults
