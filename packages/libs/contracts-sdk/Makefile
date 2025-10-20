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

deploy-vincent-datil: ## Deploy the Vincent Diamond contract to Datil network only. Used for both dev & prod deployments.
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

update-facet: ## Update a specific facet in the Vincent Diamond contract. Usage: make update-facet FACET_NAME=VincentAppViewFacet DEPLOYMENT_TYPE=dev|prod
	@if [ -z "$(VINCENT_DEPLOYMENT_RPC_URL)" ]; then \
		echo "Error: VINCENT_DEPLOYMENT_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(VINCENT_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: VINCENT_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(FACET_NAME)" ]; then \
		echo "Error: FACET_NAME parameter is required. Usage: make update-facet FACET_NAME=VincentAppViewFacet DEPLOYMENT_TYPE=dev|prod"; \
		echo "Available facets: VincentAppFacet, VincentAppViewFacet, VincentUserFacet, VincentUserViewFacet"; \
		exit 1; \
	fi
	@if [ -z "$(DEPLOYMENT_TYPE)" ]; then \
		echo "Error: DEPLOYMENT_TYPE parameter is required. Usage: make update-facet FACET_NAME=VincentAppViewFacet DEPLOYMENT_TYPE=dev|prod"; \
		exit 1; \
	fi
	@if [ "$(DEPLOYMENT_TYPE)" != "dev" ] && [ "$(DEPLOYMENT_TYPE)" != "prod" ]; then \
		echo "Error: DEPLOYMENT_TYPE must be either 'dev' or 'prod'"; \
		exit 1; \
	fi
	@if [ "$(DEPLOYMENT_TYPE)" = "dev" ]; then \
		if [ -z "$(VINCENT_DEV_DIAMOND_ADDRESS)" ]; then \
			echo "Error: VINCENT_DEV_DIAMOND_ADDRESS is not set in .env for dev deployment"; \
			exit 1; \
		fi; \
	else \
		if [ -z "$(VINCENT_PROD_DIAMOND_ADDRESS)" ]; then \
			echo "Error: VINCENT_PROD_DIAMOND_ADDRESS is not set in .env for prod deployment"; \
			exit 1; \
		fi; \
	fi
	@echo "Updating facet $(FACET_NAME) in the Vincent Diamond contract on Datil network..."
	@echo "Deployment type: $(DEPLOYMENT_TYPE)"
	@VINCENT_DIAMOND_ADDRESS=$$(if [ "$(DEPLOYMENT_TYPE)" = "dev" ]; then echo "$(VINCENT_DEV_DIAMOND_ADDRESS)"; else echo "$(VINCENT_PROD_DIAMOND_ADDRESS)"; fi); \
		echo "Using diamond address: $$VINCENT_DIAMOND_ADDRESS"; \
		FACET_TO_UPDATE=$(FACET_NAME) VINCENT_DIAMOND_ADDRESS=$$VINCENT_DIAMOND_ADDRESS forge script script/UpdateFacet.sol:SmartUpdateFacet -vvv \
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

	@echo "Merging facet ABIs into abis/FeeDiamond.abi.json..."
	@jq -s '[.[].abi] | add | unique_by(.type, .name, ((.inputs // []) | map(.type) | join(",")))' \
		out/OwnershipFacet.sol/OwnershipFacet.json \
		out/FeeViewsFacet.sol/FeeViewsFacet.json \
		out/FeeAdminFacet.sol/FeeAdminFacet.json \
		out/MorphoPerfFeeFacet.sol/MorphoPerfFeeFacet.json \
		out/AavePerfFeeFacet.sol/AavePerfFeeFacet.json \
		> abis/FeeDiamond.abi.json
	@echo "✅ Combined ABI written to abis/FeeDiamond.abi.json"

	@echo "ABIs written to abis/*.abi.json"
