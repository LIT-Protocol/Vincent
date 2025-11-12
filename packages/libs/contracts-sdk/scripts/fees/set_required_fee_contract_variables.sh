#!/bin/bash


if [ -f "$(dirname "$0")/../../.env" ]; then
  set -a  # automatically export all variables
  source "$(dirname "$0")/../../.env"
  set +a  # stop automatically exporting
else
  echo "Error: .env file not found in parent directory"
  exit 1
fi

# manually set your vars here
FEE_DIAMOND_ADDRESS="0x35705D6ad235DcA39c10B6E0EfBA84b5E90D2aC9"
OWNER_ATTESATION_SIGNER_ADDRESS="0x22d32f0355A7914665220dD7ff5f1983021CC2B0"

# per chain variables
RPC_URL="$BASE_SEPOLIA_RPC_URL"
AAVE_POOL_ADDRESS="0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"

cast send "$FEE_DIAMOND_ADDRESS" "setOwnerAttestationSigner(address)" "$OWNER_ATTESATION_SIGNER_ADDRESS" --rpc-url "$RPC_URL" --private-key "$VINCENT_DEPLOYER_PRIVATE_KEY" --confirmations 2

cast send "$FEE_DIAMOND_ADDRESS" "setAavePool(address)" "$AAVE_POOL_ADDRESS" --rpc-url "$RPC_URL" --private-key "$VINCENT_DEPLOYER_PRIVATE_KEY" --confirmations 2