#!/bin/bash

# Enable automatic export of variables
set -o allexport
# Source the .env file
source ./.env
# Disable automatic export of variables
set +o allexport

# Get the latest Base block number and export it
# this is necessary because if we don't pass a specific block number for `forge test`,
# then reads will passthrough to the chain, and cause timestamp issues.
# because we will read stuff from the real chain with state that has the real block.timestamp which can be ahead of the fork
# which can cause overflow/underflow issues when doing things like block.timestamp - lastUpdate, in morpho, for example
# where lastUpdate is the timestamp of the last update to the morpho market
LATEST_BLOCK=$(cast block-number --rpc-url "$BASE_RPC_URL")
echo "Latest Base block number: $LATEST_BLOCK"

# run the tests
forge coverage --ffi -vvv --fork-url "$BASE_RPC_URL" --fork-block-number "$LATEST_BLOCK" --ir-minimum