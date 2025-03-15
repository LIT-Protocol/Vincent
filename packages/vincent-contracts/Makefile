-include .env

.PHONY: help build test test-verbose test-match deploy-vincent deploy-vincent-datil-dev deploy-vincent-datil-test deploy-vincent-datil get-abis update-facet

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

deploy-vincent: ## Deploy the Vincent Diamond contract to all Datil networks
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Vincent Diamond to $(VINCENT_DEPLOYMENT_RPC_URL)..."
	@echo "Using PKP NFT contracts:"
	@echo "  Datil Dev:  $(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)"
	@echo "  Datil Test: $(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)"
	@echo "  Datil:      $(DATIL_PKP_NFT_CONTRACT_ADDRESS)"
	@forge script script/DeployVincentDiamond.sol:DeployVincentDiamond -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

deploy-vincent-datil-dev: ## Deploy the Vincent Diamond contract to Datil Dev network only
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Vincent Diamond to Datil Dev network ($(VINCENT_DEPLOYMENT_RPC_URL))..."
	@echo "Using PKP NFT contract: $(DATIL_DEV_PKP_NFT_CONTRACT_ADDRESS)"
	@forge script script/DeployVincentDiamond.sol:DeployVincentDiamond --sig "deployToDatilDev()" -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

deploy-vincent-datil-test: ## Deploy the Vincent Diamond contract to Datil Test network only
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Vincent Diamond to Datil Test network ($(VINCENT_DEPLOYMENT_RPC_URL))..."
	@echo "Using PKP NFT contract: $(DATIL_TEST_PKP_NFT_CONTRACT_ADDRESS)"
	@forge script script/DeployVincentDiamond.sol:DeployVincentDiamond --sig "deployToDatilTest()" -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

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

update-facet: ## Update a specific facet in the Vincent Diamond contract. Usage: make update-facet NETWORK=datil-dev FACET_NAME=VincentAppViewFacet
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(NETWORK)" ]; then \
		echo "Error: NETWORK parameter is required. Usage: make update-facet NETWORK=datil-dev FACET_NAME=VincentAppViewFacet"; \
		echo "Available networks: datil-dev, datil-test, datil"; \
		exit 1; \
	fi
	@if [ -z "$(FACET_NAME)" ]; then \
		echo "Error: FACET_NAME parameter is required. Usage: make update-facet NETWORK=datil-dev FACET_NAME=VincentAppViewFacet"; \
		echo "Available facets: VincentAppFacet, VincentAppViewFacet, VincentToolFacet, VincentToolViewFacet, VincentUserFacet, VincentUserViewFacet"; \
		exit 1; \
	fi
	@if [ "$(NETWORK)" = "datil-dev" ]; then \
		if [ -z "$(VINCENT_DIAMOND_ADDRESS_DATIL_DEV)" ]; then \
			echo "Error: VINCENT_DIAMOND_ADDRESS_DATIL_DEV is not set in .env"; \
			exit 1; \
		fi; \
		export VINCENT_DIAMOND_ADDRESS=$(VINCENT_DIAMOND_ADDRESS_DATIL_DEV); \
		echo "Using Datil Dev network with diamond address: $(VINCENT_DIAMOND_ADDRESS_DATIL_DEV)"; \
	elif [ "$(NETWORK)" = "datil-test" ]; then \
		if [ -z "$(VINCENT_DIAMOND_ADDRESS_DATIL_TEST)" ]; then \
			echo "Error: VINCENT_DIAMOND_ADDRESS_DATIL_TEST is not set in .env"; \
			exit 1; \
		fi; \
		export VINCENT_DIAMOND_ADDRESS=$(VINCENT_DIAMOND_ADDRESS_DATIL_TEST); \
		echo "Using Datil Test network with diamond address: $(VINCENT_DIAMOND_ADDRESS_DATIL_TEST)"; \
	elif [ "$(NETWORK)" = "datil" ]; then \
		if [ -z "$(VINCENT_DIAMOND_ADDRESS_DATIL)" ]; then \
			echo "Error: VINCENT_DIAMOND_ADDRESS_DATIL is not set in .env"; \
			exit 1; \
		fi; \
		export VINCENT_DIAMOND_ADDRESS=$(VINCENT_DIAMOND_ADDRESS_DATIL); \
		echo "Using Datil Production network with diamond address: $(VINCENT_DIAMOND_ADDRESS_DATIL)"; \
	else \
		echo "Error: Invalid NETWORK parameter. Available networks: datil-dev, datil-test, datil"; \
		exit 1; \
	fi
	@echo "Updating facet $(FACET_NAME) in the Vincent Diamond contract..."
	@FACET_TO_UPDATE=$(FACET_NAME) VINCENT_DIAMOND_ADDRESS=$(shell if [ "$(NETWORK)" = "datil-dev" ]; then echo "$(VINCENT_DIAMOND_ADDRESS_DATIL_DEV)"; elif [ "$(NETWORK)" = "datil-test" ]; then echo "$(VINCENT_DIAMOND_ADDRESS_DATIL_TEST)"; else echo "$(VINCENT_DIAMOND_ADDRESS_DATIL)"; fi) forge script script/UpdateFacet.sol:UpdateFacet -vvv \
		--broadcast \
		--private-key $(VINCENT_DEPLOYER_PRIVATE_KEY) \
		--rpc-url $(VINCENT_DEPLOYMENT_RPC_URL)

get-abis: ## Get human-readable ABIs for all facets
	# @echo "Getting ABI for DiamondCutFacet..."
	# @forge inspect DiamondCutFacet abi > abis/DiamondCutFacet.abi.json
	# @echo "Getting ABI for DiamondLoupeFacet..."
	# @forge inspect DiamondLoupeFacet abi > abis/DiamondLoupeFacet.abi.json
	# @echo "Getting ABI for OwnershipFacet..."
	# @forge inspect OwnershipFacet abi > abis/OwnershipFacet.abi.json
	@echo "Getting ABI for VincentToolFacet..."
	@forge inspect VincentToolFacet abi > abis/VincentToolFacet.abi.json
	@echo "Getting ABI for VincentToolViewFacet..."
	@forge inspect VincentToolViewFacet abi > abis/VincentToolViewFacet.abi.json
	@echo "Getting ABI for VincentAppFacet..."
	@forge inspect VincentAppFacet abi > abis/VincentAppFacet.abi.json
	@echo "Getting ABI for VincentAppViewFacet..."
	@forge inspect VincentAppViewFacet abi > abis/VincentAppViewFacet.abi.json
	@echo "Getting ABI for VincentUserFacet..."
	@forge inspect VincentUserFacet abi > abis/VincentUserFacet.abi.json
	@echo "Getting ABI for VincentUserViewFacet..."
	@forge inspect VincentUserViewFacet abi > abis/VincentUserViewFacet.abi.json
	@echo "ABIs written to abis/*.abi.json" 