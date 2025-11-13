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
OWNER_ATTESATION_SIGNER_ADDRESS="0xDB03b39d7a7af6f437D03B61104cC3972238C563"

# per chain variables
RPC_URL="$BASE_SEPOLIA_RPC_URL"
AAVE_POOL_ADDRESS="0x8bAB6d1b75f19e9eD9fCe8b9BD338844fF79aE27"

cast send --rpc-url "$RPC_URL" --private-key "$VINCENT_DEPLOYER_PRIVATE_KEY" --confirmations 3 "$FEE_DIAMOND_ADDRESS" "setOwnerAttestationSigner(address)" "$OWNER_ATTESATION_SIGNER_ADDRESS"

cast send --rpc-url "$RPC_URL" --private-key "$VINCENT_DEPLOYER_PRIVATE_KEY" --confirmations 3 "$FEE_DIAMOND_ADDRESS" "setAavePool(address)" "$AAVE_POOL_ADDRESS"