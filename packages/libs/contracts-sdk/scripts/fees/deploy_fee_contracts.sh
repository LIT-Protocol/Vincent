#!/bin/bash

# Check if network name parameter is provided
if [ -z "$1" ]; then
  echo "Error: Network name is required"
  echo "Usage: $0 <network-name>"
  echo "Example: $0 base_sepolia"
  exit 1
fi

# Uppercase the network name
NETWORK_NAME=$(echo "$1" | tr '[:lower:]' '[:upper:]')

# Load environment variables from .env file in parent directory
if [ -f "$(dirname "$0")/../../.env" ]; then
  set -a  # automatically export all variables
  source "$(dirname "$0")/../../.env"
  set +a  # stop automatically exporting
else
  echo "Error: .env file not found in parent directory"
  exit 1
fi

# Construct variable names using the network name
RPC_URL_VAR="${NETWORK_NAME}_RPC_URL"

# Check for required environment variables
MISSING_VARS=()

if [ -z "$VINCENT_DEPLOYER_PRIVATE_KEY" ]; then
  MISSING_VARS+=("VINCENT_DEPLOYER_PRIVATE_KEY")
fi

if [ -z "${!RPC_URL_VAR}" ]; then
  MISSING_VARS+=("$RPC_URL_VAR")
fi

if [ -z "$ETHERSCAN_API_KEY" ]; then
  MISSING_VARS+=("ETHERSCAN_API_KEY")
fi

if [ -z "$VINCENT_PROD_DIAMOND_ADDRESS" ]; then
  MISSING_VARS+=("VINCENT_PROD_DIAMOND_ADDRESS")
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "Error: The following required environment variables are not set:"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  echo ""
  echo "Please ensure these variables are defined in the .env file"
  exit 1
fi

forge script script/DeployFeeDiamond.sol:DeployFeeDiamond \
  --sig "deployAndSetDefaults(address)" "$VINCENT_PROD_DIAMOND_ADDRESS" \
  --private-key "$VINCENT_DEPLOYER_PRIVATE_KEY" \
  --rpc-url "${!RPC_URL_VAR}" \
  --broadcast \
  --slow \
  --verify \
  --ffi \
  --etherscan-api-key "$ETHERSCAN_API_KEY"