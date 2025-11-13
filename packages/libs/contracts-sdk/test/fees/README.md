# Fee Contract E2E Tests

This directory contains end-to-end integration tests for the Fee Diamond contracts and Owner Attestation signing.

## Test Files

- `signOwnerAttestation.e2e.spec.ts` - Full E2E integration test that validates the complete flow of signing owner attestations using a deployed Lit Action on real testnets

## E2E Test Flow

The `signOwnerAttestation.e2e.spec.ts` test validates the complete production flow:

1. **App Creation**: Creates a real app on Chronicle Yellowstone (production network) using the Vincent Diamond
2. **Funding**: Transfers USDC from the funding wallet to the test wallet on Base Sepolia
3. **Deposit**: Deposits USDC to Aave through the Fee Diamond on Base Sepolia
4. **Withdrawal**: Withdraws from Aave, collecting any fees
5. **Lit Action**: Uses the deployed Lit Action on Datil to sign an owner attestation
6. **Fee Withdrawal**: Withdraws collected app fees using the signed attestation
7. **Verification**: Asserts that funds arrived in the app owner wallet

## Environment Variables Required

Add these to your root `.env` file:

```bash
# Private key for test wallet on Base Sepolia (will receive USDC and execute transactions)
TEST_BASE_SEPOLIA_PRIVATE_KEY=0x...

# Private key for app owner wallet (funded on Chronicle Yellowstone)
# This wallet will create the app and receive the collected fees
TEST_APP_OWNER_PRIVATE_KEY=0x...

# Private key for wallet with USDC on Base Sepolia (used to fund test wallet)
AAVE_USDC_PRIVATE_KEY=0x...

# Vincent Diamond address on Chronicle Yellowstone (prod)
VINCENT_PROD_DIAMOND_ADDRESS=0xa3a602F399E9663279cdF63a290101cB6560A87e
```

## Running the Tests

```bash
# Run all fee E2E tests
nx run contracts-sdk:test-e2e:fees

# Run with specific test file
nx run contracts-sdk:test-e2e:fees --testPathPattern=signOwnerAttestation
```

## Test Details

### Networks Used

- **Chronicle Yellowstone**: 175188 (for app registration)
- **Base Sepolia**: 84532 (for fee contract interactions)
- **Datil**: Lit Network for executing Lit Actions

### Contracts Used

- **Fee Diamond**: `0x35705D6ad235DcA39c10B6E0EfBA84b5E90D2aC9` (Base Sepolia)
- **Vincent Diamond**: `0xa3a602F399E9663279cdF63a290101cB6560A87e` (Chronicle Yellowstone)
- **Lit Action**: `QmSWgViHHR1yZ7tGKZMCdHHCZrA6WpXrExshGaQBWiPpfe` (IPFS)
- **USDC**: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (Base Sepolia)
- **Aave Pool**: `0x07eA79F68B2B3df564D0A34F8e19D9B1e339814b` (Base Sepolia)

### Test Timeout

- 5 minutes (300 seconds) to allow for:
  - Network latency
  - Transaction confirmations on testnets
  - Lit Action execution
  - Multiple blockchain interactions

## Security Notes

⚠️ **This test uses REAL testnets and the REAL Datil Lit Network:**

- Transactions are actually broadcast to Chronicle Yellowstone and Base Sepolia
- The Lit Action runs on the actual Datil network nodes
- No mocking or simulation - this is a true integration test
- Requires funded wallets with testnet ETH and USDC

## Troubleshooting

### Test Hangs or Times Out

- Check that wallets have sufficient testnet ETH for gas
- Verify USDC balance in funding wallet
- Ensure Chronicle Yellowstone RPC is accessible
- Confirm Base Sepolia RPC is responding

### "Funding wallet does not have enough USDC"

- The `AAVE_USDC_PRIVATE_KEY` wallet needs at least 100 USDC on Base Sepolia
- Get Base Sepolia USDC from faucets or bridges

### "App already exists"

- The test generates a random app ID, but collisions are possible
- The test will use the existing app if it belongs to the same owner
- If issues persist, try running the test again (new random ID will be generated)

### Lit Action Errors

- Verify the Lit Action IPFS CID is correct in constants
- Ensure the PKP public key matches the deployed action
- Check that session signatures are valid

## Development

When modifying the test:

1. Test locally with small amounts first
2. Verify all environment variables are set
3. Check that the Lit Action is deployed and accessible
4. Monitor gas usage on testnets

## Related Documentation

- [Lit Actions README](../../lit-actions/README.md)
- [Fee Lit Actions README](../../lit-actions/fees/README.md)
- [Implementation Summary](../../IMPLEMENTATION_SUMMARY.md)
- [Fee Contracts README](../../contracts/fees/README.md)
