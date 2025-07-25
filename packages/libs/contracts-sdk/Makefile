-include .env

.PHONY: help build test test-verbose test-match deploy-vincent deploy-vincent-datil get-abis update-facet

help: ## Display this help screen
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

build: ## Build the contracts
	forge build

test: ## Run the tests
	forge test

test-verbose: ## Run the tests with verbose output
	forge test -vvv

test-match: ## Run tests matching a pattern. Usage: make test-match PATTERN=MyTest
	@if [ -z "$(PATTERN)" ]; then \
		echo "Error: PATTERN parameter is required. Usage: make test-match PATTERN=MyTest"; \
		exit 1; \
	fi
	forge test --match-contract $(PATTERN) -vvv

deploy-vincent-datil: ## Deploy the Vincent Diamond contract to Datil network only
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Vincent Diamond to Datil network ($(VINCENT_DEPLOYMENT_RPC_URL))..."
	@echo "Using PKP NFT contract: $(DATIL_PKP_NFT_CONTRACT_ADDRESS)"
	@forge script script/DeployVincentDiamond.sol:DeployVincentDiamond --sig "deployToDatil()" -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

update-facet: ## Update a specific facet in the Vincent Diamond contract. Usage: make update-facet FACET_NAME=VincentAppViewFacet
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(FACET_NAME)" ]; then \
		echo "Error: FACET_NAME parameter is required. Usage: make update-facet FACET_NAME=VincentAppViewFacet"; \
		echo "Available facets: VincentAppFacet, VincentAppViewFacet, VincentUserFacet, VincentUserViewFacet"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DIAMOND_ADDRESS)" ]; then \
		echo "Error: VINCENT_DIAMOND_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Updating facet $(FACET_NAME) in the Vincent Diamond contract on Datil network..."
	@echo "Using diamond address: $(VINCENT_DIAMOND_ADDRESS)"
	@FACET_TO_UPDATE=$(FACET_NAME) forge script script/UpdateFacet.sol:SmartUpdateFacet -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

get-abis: ## Get human-readable ABIs for all facets
	@mkdir -p abis
	# @echo "Getting ABI for DiamondCutFacet..."
	# @forge inspect DiamondCutFacet abi > abis/DiamondCutFacet.abi.json
	# @echo "Getting ABI for DiamondLoupeFacet..."
	# @forge inspect DiamondLoupeFacet abi > abis/DiamondLoupeFacet.abi.json
	# @echo "Getting ABI for OwnershipFacet..."
	# @forge inspect OwnershipFacet abi > abis/OwnershipFacet.abi.json
	@echo "Getting ABI for VincentAppFacet..."
	@forge inspect VincentAppFacet abi --json > abis/VincentAppFacet.abi.json
	@echo "Getting ABI for VincentAppViewFacet..."
	@forge inspect VincentAppViewFacet abi --json > abis/VincentAppViewFacet.abi.json
	@echo "Getting ABI for VincentUserFacet..."
	@forge inspect VincentUserFacet abi --json > abis/VincentUserFacet.abi.json
	@echo "Getting ABI for VincentUserViewFacet..."
	@forge inspect VincentUserViewFacet abi --json > abis/VincentUserViewFacet.abi.json
	@echo "ABIs written to abis/*.abi.json"
