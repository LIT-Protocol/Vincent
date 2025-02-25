-include .env

.PHONY: all test clean deploy

# Default target
all: clean remove-forge-artifacts test

# Load environment variables
PRIVATE_KEY ?= $(shell grep PRIVATE_KEY .env | cut -d '=' -f2)
RPC_URL ?= https://yellowstone-rpc.litprotocol.com/

help:
	@echo "Usage:"
	@echo "  make deploy [ARGS=...] - Deploy contracts with optional forge arguments"
	@echo "  make test              - Run forge tests"
	@echo "  make clean             - Remove build artifacts"
	@echo "  make remove-forge-artifacts - Remove forge artifacts"

# Build & test
build:
	forge build

test:
	forge test -vv

# Clean up
clean: remove-forge-artifacts
	rm -rf cache
	rm -rf out

remove-forge-artifacts:
	rm -rf broadcast
	rm -rf artifacts

# Deployment
deploy:
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY is not set in .env file"; \
		exit 1; \
	fi
	forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(RPC_URL) \
		--private-key $(PRIVATE_KEY) \
		--broadcast \
		$(ARGS)
