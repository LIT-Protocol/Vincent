# Fee Diamond Contract System

The Fee Diamond is a sophisticated smart contract system built using the Diamond Pattern (EIP-2535) that manages performance fees for DeFi protocols. It provides a unified interface for tracking deposits and withdrawals across multiple DeFi platforms while automatically collecting performance fees on profitable withdrawals.

## Overview

The Fee Diamond system allows Vincent's abilities to deposit user funds into DeFi protocols (currently Morpho and Aave) and automatically collect performance fees when users withdraw their funds. The system tracks user deposits, calculates profits, and takes a configurable percentage of the profit as a fee.

### Key Features

- **Multi-Protocol Support**: Currently supports Morpho and Aave protocols
- **Performance Fee Collection**: Automatically calculates and collects fees only on profits
- **Full Withdrawal Only**: Simplified implementation that only supports full withdrawals
- **Deterministic Deployment**: Uses Create2 for consistent addresses across EVM chains
- **Admin Controls**: Owner can adjust fee percentages and withdraw collected fees
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

- `depositToMorpho(address vaultAddress, uint256 assetAmount)`: Deposits assets into a Morpho vault
- `withdrawFromMorpho(address vaultAddress)`: Withdraws all funds from a Morpho vault

#### 2. AavePerfFeeFacet

Handles deposits and withdrawals for Aave protocol pools.

**Key Functions:**

- `depositToAave(address poolAsset, uint256 assetAmount)`: Deposits assets into an Aave pool
- `withdrawFromAave(address poolAsset)`: Withdraws all funds from an Aave pool

#### 3. FeeAdminFacet

Administrative functions for managing the fee system.

**Key Functions:**

- `setPerformanceFeePercentage(uint256 newPercentage)`: Sets the performance fee percentage (in basis points)
- `withdrawTokens(address tokenAddress)`: Withdraws collected fees for a specific token
- `setAavePool(address newAavePool)`: Sets the Aave pool contract address
- `tokensWithCollectedFees()`: Returns list of tokens that have collected fees

#### 4. FeeViewsFacet

Read-only functions for querying deposit information.

**Key Functions:**

- `deposits(address user, address vaultAddress)`: Returns deposit information for a user/vault pair
- `userVaultOrPoolAssetAddresses(address user)`: Returns all vault/pool addresses a user has deposits in

## How It Works

### Deposit Process

1. **User Authorization**: User approves the Fee Diamond to spend their tokens
2. **Deposit Execution**: Ability calls `depositToMorpho()` or `depositToAave()`
3. **Asset Transfer**: Tokens are transferred from user to the Fee Diamond contract
4. **Protocol Interaction**: Contract deposits tokens into the target DeFi protocol
5. **Record Keeping**: Contract records the deposit amount and vault shares for the user

### Withdrawal Process

1. **Withdrawal Request**: User calls `withdrawFromMorpho()` or `withdrawFromAave()`
2. **Profit Calculation**: Contract calculates profit by comparing withdrawal amount to original deposit
3. **Fee Calculation**: If there's a profit, calculates performance fee (percentage of profit)
4. **Asset Distribution**:
   - Performance fee remains in the contract
   - Remaining amount (original deposit + user's share of profit) goes to user
5. **Cleanup**: Deposit records are cleared and user's vault list is updated

### Fee Calculation

The performance fee is calculated as:

```
if (withdrawalAmount > originalDepositAmount) {
    profit = withdrawalAmount - originalDepositAmount
    performanceFee = profit * performanceFeePercentage / 10000
    userReceives = withdrawalAmount - performanceFee
}
```

Where `performanceFeePercentage` is expressed in basis points (1000 = 10%).

## Storage Structure

The system uses a sophisticated storage structure to track:

- **User Deposits**: Maps user address → vault address → deposit details
- **Performance Fee Percentage**: Configurable fee rate in basis points
- **Collected Fees Tracking**: Set of token addresses that have collected fees
- **User Vault Tracking**: Set of vault/pool addresses per user for recovery
- **Protocol Configuration**: Aave pool contract address

## Example Usage

You can use the full diamond ABI with all the facets in `abis/FeeDiamond.abi.json`, instead of interfacing with the facets directly. The examples below are for the facets directly, but if you loaded the FeeDiamond ABI in you could use all the same functions.

### Basic Deposit and Withdrawal

```solidity
// Deposit 1000 USDC into Morpho
morphoPerfFeeFacet.depositToMorpho(morphoVaultAddress, 1000e6);

// Later, withdraw all funds (with performance fee applied to profits)
morphoPerfFeeFacet.withdrawFromMorpho(morphoVaultAddress);
```

### Admin Operations

```solidity
// Set performance fee to 5% (500 basis points)
feeAdminFacet.setPerformanceFeePercentage(500);

// Withdraw collected USDC fees
feeAdminFacet.withdrawTokens(usdcAddress);

// Get list of tokens with collected fees
address[] memory feeTokens = feeAdminFacet.tokensWithCollectedFees();
```

### Querying User Deposits

```solidity
// Get deposit information for a user
LibFeeStorage.Deposit memory deposit = feeViewsFacet.deposits(userAddress, vaultAddress);

// Get all vaults a user has deposits in
address[] memory userVaults = feeViewsFacet.userVaultOrPoolAssetAddresses(userAddress);
```

## Security Features

- **Reentrancy Protection**: Deposit records are cleared before external calls
- **Access Control**: Only contract owner can modify fee settings and withdraw fees
- **Input Validation**: Comprehensive error handling for invalid operations
- **Provider Validation**: Prevents mixing deposits between different protocols

## Deployment

The contracts are deployed deterministically using Create2, ensuring the same contract address across all EVM chains when using the same deployer.

## Error Handling

The system includes comprehensive error handling:

- `DepositNotFound`: When trying to withdraw from a non-existent deposit
- `NotMorphoVault`/`NotAavePool`: When trying to withdraw from wrong protocol
- `DepositAlreadyExistsWithAnotherProvider`: When trying to deposit to same vault with different protocol
- `CallerNotOwner`: When non-owner tries to call admin functions

## Testing

Comprehensive test suites are available in `test/fees/`:

- `MorphoFee.t.sol`: Unit tests for Morpho functionality
- `AaveFeeForkTest.t.sol`: Fork tests for Aave integration
- `MorphoFeeForkTest.t.sol`: Fork tests for Morpho integration

## Future Enhancements

- Support for partial withdrawals
- Additional DeFi protocol integrations
- More sophisticated fee calculation methods
- Batch operations for multiple vaults
