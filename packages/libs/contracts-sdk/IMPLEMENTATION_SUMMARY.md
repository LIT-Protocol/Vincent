# Owner Attestation Signing Implementation

This document summarizes the implementation of the Lit Action oracle for signing owner attestations for the Fee Diamond contracts.

## Overview

We've created a complete Lit Action implementation that:

1. Reads from the Vincent Diamond contract on Chronicle Yellowstone to verify app ownership
2. Creates an `OwnerAttestation` structure
3. Signs it using a PKP
4. Returns the signature for use with `withdrawAppFees` on Fee Diamond contracts

## Files Created

### Lit Action Source Code (Not in Bundle)

Location: `packages/libs/contracts-sdk/lit-actions/`

1. **`internal/signOwnerAttestation.ts`**
   - Contains the core signing logic
   - Replicates the Solidity signing from `FeeTestCommon.sol`
   - Uses PKP via `Lit.Actions.signAndCombineEcdsa`

2. **`internal/readVincentContract.ts`**
   - Reads from Vincent Diamond on Chronicle Yellowstone
   - Verifies the caller is the app manager
   - Uses ethers.js to call `getApp(appId)`

3. **`raw-action-functions/signOwnerAttestation.ts`**
   - Main Lit Action logic
   - Orchestrates verification and signing
   - Creates attestation with timestamps

4. **`self-executing-actions/signOwnerAttestation.ts`**
   - Self-executing wrapper for the Lit Action
   - Handles Lit Action parameter passing
   - Entry point for bundling

### TypeScript SDK (In Bundle)

Location: `packages/libs/contracts-sdk/src/fees/`

5. **`signOwnerAttestation.ts`**
   - Exported function to call the Lit Action
   - Type definitions for parameters and results
   - Helper functions for Fee Diamond addresses

### Build Configuration

6. **`esbuild.lit-actions.config.js`**
   - Builds the Lit Action bundle
   - Generates IPFS CID metadata
   - Similar to wrapped-keys pattern

7. **`deno-fetch-shim.js`**
   - Shim for fetch in Lit Actions environment

8. **`scripts/deploy-lit-action.js`**
   - Deploys bundled code to IPFS via Pinata
   - Verifies CID matches metadata

### Configuration Updates

9. **`project.json`**
   - Added `action:build` target
   - Added `action:deploy` target
   - Added `action:only:deploy` target
   - Made `build:tsc` depend on `action:build`

10. **`package.json`**
    - Added `esbuild` devDependency
    - Added `ipfs-only-hash` devDependency
    - Added `@lit-protocol/esbuild-plugin-polyfill-node` devDependency
    - Added `@lit-protocol/types` dependency

11. **`.gitignore`**
    - Added `lit-actions/generated/` to ignore bundled outputs

### Documentation

12. **`lit-actions/README.md`**
    - Complete usage documentation
    - Build and deploy instructions
    - Security considerations

13. **`IMPLEMENTATION_SUMMARY.md`** (this file)

### Test Updates

14. **`test/fees/FeeTestCommon.sol`**
    - Updated `_signOwnerAttestation` with documentation
    - Added references to the real Lit Action implementation

## Build Commands

```bash
# Build the Lit Action
nx run contracts-sdk:action:build

# Deploy to IPFS (requires PINATA_JWT in .env)
nx run contracts-sdk:action:deploy

# Build the entire contracts-sdk (includes Lit Action build)
nx run contracts-sdk:build
```

## Usage Example

```typescript
import {
  signOwnerAttestation,
  getBaseSepoliaFeeDiamondAddress,
} from '@lit-protocol/vincent-contracts-sdk';
import { LitNodeClient } from '@lit-protocol/lit-node-client';

// Initialize Lit client
const litNodeClient = new LitNodeClient({
  litNetwork: 'datil-dev',
});
await litNodeClient.connect();

// Get session signatures (app would do this during auth flow)
const sessionSigs = await getSessionSigs(/* ... */);

// Sign the owner attestation
// The Lit Action automatically gets the Chronicle Yellowstone RPC URL
const result = await signOwnerAttestation({
  litNodeClient,
  sessionSigs,
  pkpPublicKey: '0x...', // PKP that can sign
  appId: 12345,
  owner: '0x...', // App manager address
  dstChainId: 84532, // Base Sepolia
  dstContract: getBaseSepoliaFeeDiamondAddress(),
  litActionIpfsCid: 'Qm...', // From generated metadata
});

// Use the signature to withdraw fees
await feeAdminFacet.withdrawAppFees(
  result.attestation.appId,
  tokenAddress,
  result.attestation,
  result.signature,
);
```

## Security Features

1. **Ownership Verification**: The Lit Action reads from Chronicle Yellowstone to verify the caller owns the app
2. **PKP Signing**: Uses decentralized PKP, no private key exposure
3. **Replay Protection**: Includes `dstChainId` and `dstContract` to prevent replay attacks
4. **Time Limits**: Attestations expire after 5 minutes (configurable)
5. **Immutable Code**: The Lit Action code is content-addressed via IPFS

## Contract Addresses

The Fee Diamond addresses are stored in `VINCENT_CONTRACT_ADDRESS_BOOK`:

```typescript
{
  fee: {
    baseSepolia: {
      address: '0x35705D6ad235DcA39c10B6E0EfBA84b5E90D2aC9',
      salt: 'DatilSalt',
    },
  },
}
```

## Next Steps

1. **Build the Lit Action**: Run `nx run contracts-sdk:action:build`
2. **Deploy to IPFS**: Run `nx run contracts-sdk:action:deploy` (requires PINATA_JWT)
3. **Get IPFS CID**: Read from `lit-actions/generated/signOwnerAttestation-metadata.json`
4. **Update Tests**: Use the deployed CID in integration tests
5. **Document**: Add the IPFS CID to the README or constants file

## Testing

For testing, you can use the mock in `FeeTestCommon.sol`:

```solidity
bytes memory signature = _signOwnerAttestation(oa, privateKey);
```

For production, always use the Lit Action via `signOwnerAttestation()` function.
