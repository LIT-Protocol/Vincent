# Lit Actions for Contracts SDK

This directory contains Lit Actions for the Vincent Contracts SDK.

## Owner Attestation Signing

The `signOwnerAttestation` Lit Action provides an oracle service that:

1. Reads from the Vincent Diamond contract on Chronicle Yellowstone to verify app ownership
2. Creates an `OwnerAttestation` structure
3. Signs it using a PKP (Programmable Key Pair)

This signature can then be used to call `withdrawAppFees` on the Fee Diamond contract deployed on other chains (e.g., Base Sepolia).

### Directory Structure

- `internal/` - Internal helper functions (not bundled separately)
  - `readVincentContract.ts` - Reads from Vincent Diamond to verify ownership
  - `signOwnerAttestation.ts` - Creates and signs the attestation
- `raw-action-functions/` - Main Lit Action logic
  - `signOwnerAttestation.ts` - The main action that orchestrates verification and signing
- `self-executing-actions/` - Self-executing wrappers (these get bundled)
  - `signOwnerAttestation.ts` - Self-executing wrapper for the Lit Action
- `generated/` - Build output (git-ignored)
  - `signOwnerAttestation.js` - Bundled Lit Action code
  - `signOwnerAttestation-metadata.json` - IPFS CID metadata

### Building

To build the Lit Actions:

```bash
# Build all Lit Actions
nx run contracts-sdk:action:build

# Or from the contracts-sdk directory
pnpm node ./esbuild.lit-actions.config.js
```

This will:

1. Bundle the TypeScript code using esbuild
2. Generate the JavaScript code string
3. Compute the IPFS CID hash
4. Create metadata files

### Deploying

To deploy the Lit Actions to IPFS:

```bash
# Deploy all Lit Actions (requires PINATA_JWT in .env)
nx run contracts-sdk:action:deploy

# Or deploy without rebuilding
nx run contracts-sdk:action:only:deploy
```

This will upload the bundled code to IPFS via Pinata and verify the CID matches the metadata.

### Usage in TypeScript

The `signOwnerAttestation` function in `src/fees/signOwnerAttestation.ts` provides a convenient wrapper:

```typescript
import {
  signOwnerAttestation,
  getBaseSepoliaFeeDiamondAddress,
} from '@lit-protocol/vincent-contracts-sdk';

// Sign an owner attestation using a Lit Action
// The Lit Action automatically gets the Chronicle Yellowstone RPC URL
const result = await signOwnerAttestation({
  litNodeClient,
  sessionSigs,
  pkpPublicKey: '0x...',
  appId: 12345,
  owner: '0x...', // The app manager address
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

### Testing

For testing purposes, you can use the mock implementation in `test/fees/FeeTestCommon.sol`:

```solidity
// This uses vm.sign for testing - don't use in production!
bytes memory signature = _signOwnerAttestation(oa, ownerAttestationSignerPrivateKey);
```

In production, always use the Lit Action via the TypeScript SDK to ensure:

- Proper ownership verification against Chronicle Yellowstone
- Decentralized signing via PKP
- No exposure of private keys

### Security

The Lit Action provides security guarantees:

1. **Ownership Verification**: Before signing, it reads from the Vincent Diamond on Chronicle Yellowstone to verify the caller is actually the app manager
2. **PKP Signing**: The signature is created using a PKP (Programmable Key Pair), which is decentralized and doesn't expose private keys
3. **Replay Protection**: The attestation includes `dstChainId` and `dstContract` to prevent cross-chain/cross-contract replay attacks
4. **Time Limits**: The attestation has an `expiresAt` timestamp (default 5 minutes) to prevent stale signatures
