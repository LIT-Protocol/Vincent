# Vincent Aave Smart Account Ability

A Vincent Ability that acts as a secure, gated signer for Aave v3 operations. It is designed to work with ERC-4337 Smart Accounts (UserOperations) and EOAs (Transactions).

## Overview

This ability validates transactions or UserOperations destined for the Aave v3 protocol. It ensures that the operations are safe and aligned with the user's intent before signing them with the delegated Vincent PKP.

It uses the `createVincentGatedSignerAbility` from `@lit-protocol/vincent-ability-sdk/gatedSigner` to enforce a strict validation lifecycle:

1.  **Decode**: Decodes the transaction or userOperation calldata.
2.  **Simulation**: Simulates the transaction/userOperation on-chain.
3.  **Validation**:
    - Verifies interaction with authorized Aave contracts.
    - Checks for value extraction (no unexpected transfers or approvals).
    - Validates operation types (Approve, Supply, Withdraw, etc.).
4.  **Signing**: Signs the UserOperation (ECDSA or EIP-712) or Transaction (ECDSA) if all checks pass.

## Features

- **Smart Account Support**: Compatible with Kernel, Crossmint, Safe, and other ERC-4337 accounts.
- **EOA Support**: Can sign raw transactions for EOAs.
- **Protocol Safety**: Restricts interactions to the Aave v3 protocol.
- **Simulation-based Security**: Validates the actual on-chain effects of the transaction.

## Usage

This ability is typically used within a Vincent App. The backend service prepares an unsigned UserOperation or Transaction and sends it to the ability for validation and signing.

### Parameters

The ability accepts either a `UserOperation` or a `Transaction` object.

#### For UserOperations (Smart Accounts)

```typescript
const abilityParams = {
  alchemyRpcUrl: 'https://...', // Required for simulation
  entryPointAddress: '0x...',
  userOp: { ... }, // The UserOperation object
  // Optional parameters for Safe/EIP-712
  safe4337ModuleAddress: '0x...',
  eip712Params: { ... },
};
```

#### For Transactions (EOA)

```typescript
const abilityParams = {
  alchemyRpcUrl: 'https://...', // Required for simulation
  transaction: {
    to: '0x...',
    data: '0x...',
    value: '0x...',
    // ... other tx fields
  },
};
```

## Integration

For a full integration example, please refer to the `vincent-smart-account-integration` project, which demonstrates how to use this ability with various smart account providers.

## Development

### Building

```bash
nx build ability-aave-smart-account
```

### Testing

```bash
nx test ability-aave-smart-account
```
