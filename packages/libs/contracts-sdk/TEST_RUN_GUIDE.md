# Running the Owner Attestation E2E Test

This guide explains how to run the complete E2E integration test for owner attestation signing.

## Prerequisites

1. **Environment Variables**: Create a `.env` file in the project root with:

```bash
# Private key for test wallet on Base Sepolia
# This wallet will execute deposit/withdraw transactions
TEST_BASE_SEPOLIA_PRIVATE_KEY=0x...

# Private key for app owner wallet
# Funded on Chronicle Yellowstone, will create the app and receive fees
TEST_APP_OWNER_PRIVATE_KEY=0x...

# Private key for wallet with USDC on Base Sepolia
# Used to fund the test wallet with USDC
AAVE_USDC_PRIVATE_KEY=0x...

# Vincent Diamond address on Chronicle Yellowstone (prod)
VINCENT_PROD_DIAMOND_ADDRESS=0xa3a602F399E9663279cdF63a290101cB6560A87e
```

2. **Wallet Funding**:
   - `TEST_APP_OWNER_PRIVATE_KEY`: Needs ETH on Chronicle Yellowstone (for gas to register app)
   - `TEST_BASE_SEPOLIA_PRIVATE_KEY`: Needs ETH on Base Sepolia (for gas)
   - `AAVE_USDC_PRIVATE_KEY`: Needs ~100 USDC on Base Sepolia

## Running the Test

```bash
# From the project root
nx run contracts-sdk:test-e2e:fees

# Or with verbose output
nx run contracts-sdk:test-e2e:fees --verbose
```

## What the Test Does

The test performs a complete end-to-end flow with NO mocking:

### Step 1: App Creation (Chronicle Yellowstone)

- Generates a random app ID
- Registers the app on the Vincent Diamond contract on Chronicle Yellowstone
- Uses the real production Vincent Diamond

### Step 2: Funding (Base Sepolia)

- Transfers 100 USDC from funding wallet to test wallet
- Verifies the transfer succeeded

### Step 3: Deposit to Aave (Base Sepolia)

- Approves 50 USDC to the Fee Diamond
- Deposits the USDC to Aave through the Fee Diamond
- Verifies the deposit was recorded

### Step 4: Withdraw from Aave (Base Sepolia)

- Withdraws the deposit from Aave
- Collects any fees (may be zero for immediate withdrawal)
- Checks collected fee amount

### Step 5: Get Lit Session Signatures (Datil)

- Connects to the Datil Lit Network
- Generates session signatures for the app owner
- Authorizes PKP signing and Lit Action execution

### Step 6: Sign Owner Attestation (Datil)

- Calls the deployed Lit Action on IPFS
- Lit Action reads from Chronicle Yellowstone to verify ownership
- Lit Action signs the attestation with the PKP
- Returns signature and attestation data

### Step 7: Withdraw App Fees (Base Sepolia)

- Uses the signed attestation to withdraw collected fees
- Transfers fees from Fee Diamond to app owner wallet

### Step 8: Verification

- Checks that funds arrived in app owner wallet
- Verifies fee balance was cleared
- Asserts the amount matches expected fees

## Expected Output

```
Test wallet (Base Sepolia): 0x...
App owner wallet (Chronicle Yellowstone): 0x...
Funding wallet (Base Sepolia): 0x...
✅ Connected to Lit Network (Datil)

📝 Step 1: Creating app on Chronicle Yellowstone...
Generated App ID: 123456789
✅ App registered on Chronicle Yellowstone

💰 Step 2: Funding test wallet with USDC...
Funding wallet USDC balance: 1000.0 USDC
✅ Transferred 100.0 USDC to test wallet
Test wallet USDC balance: 100.0 USDC

📥 Step 3: Depositing USDC to Aave through Fee Diamond...
Approving 50.0 USDC...
✅ Approved USDC
Depositing to Aave...
✅ Deposited to Aave
Deposit recorded: 50.0 USDC

📤 Step 4: Withdrawing from Aave...
✅ Withdrawn from Aave
Collected app fees: 0.0 USDC
⚠️  No fees collected (expected for immediate withdrawal). Skipping fee withdrawal test.

🎉 E2E test completed successfully!
```

## Troubleshooting

### "No fees collected"

This is expected if you withdraw immediately. The test will skip the fee withdrawal part. To test with actual fees, you would need to wait for Aave interest to accrue (hours/days in real scenarios).

### "Funding wallet does not have enough USDC"

Get Base Sepolia USDC:

- Use a testnet faucet
- Bridge from Base Sepolia faucet
- Contact team for test USDC

### "Transaction failed"

- Check gas balances on both chains
- Verify contract addresses in constants are correct
- Ensure RPC endpoints are accessible

### Lit Action Errors

- Verify the IPFS CID is correct
- Check that the PKP public key matches
- Ensure Datil network is accessible

### Timeout

- The test has a 5-minute timeout
- Network congestion can cause delays
- Try again during off-peak hours

## Test Duration

Typical run time: 2-4 minutes

- Network latency: ~30 seconds
- Transaction confirmations: ~1-2 minutes
- Lit Action execution: ~30-60 seconds
- Multiple RPC calls: ~30 seconds

## Security Note

⚠️ **This test uses REAL testnets:**

- Actual transactions are broadcast
- Real Lit Action execution on Datil
- Testnet ETH and USDC are consumed
- Private keys must be kept secure

## Success Criteria

The test passes when:

- ✅ App is registered on Chronicle Yellowstone
- ✅ USDC is transferred to test wallet
- ✅ Deposit to Aave succeeds
- ✅ Withdrawal from Aave succeeds
- ✅ Lit Action signs attestation successfully
- ✅ If fees collected, withdrawal to owner succeeds
- ✅ All balances and states are verified

## Next Steps

After a successful test run:

1. Monitor the app on Chronicle Yellowstone explorer
2. Check the Fee Diamond balance on Base Sepolia
3. Verify no lingering deposits or fees
4. Document any issues or edge cases found

## Related Documentation

- [Lit Actions README](./lit-actions/README.md)
- [Fee Lit Actions README](./lit-actions/fees/README.md)
- [Fee Test README](./test/fees/README.md)
- [Fee Contracts README](./contracts/fees/README.md)
