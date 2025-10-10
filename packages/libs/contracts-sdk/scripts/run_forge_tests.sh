#!/bin/bash

# Enable automatic export of variables
set -o allexport
# Source the .env file
source ./.env
# Disable automatic export of variables
set +o allexport

# run the tests
forge test --ffi -vv --fork-url $BASE_RPC_URL