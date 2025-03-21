// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/VincentDiamond.sol";
import "../src/diamond-base/facets/DiamondCutFacet.sol";
import "../src/diamond-base/facets/DiamondLoupeFacet.sol";
import "../src/diamond-base/facets/OwnershipFacet.sol";
import "../src/facets/VincentToolFacet.sol";
import "../src/facets/VincentToolViewFacet.sol";
import "../src/facets/VincentAppFacet.sol";
import "../src/facets/VincentAppViewFacet.sol";
import "../src/facets/VincentUserFacet.sol";
import "../src/facets/VincentUserViewFacet.sol";
import "../src/VincentBase.sol";
import "../src/diamond-base/interfaces/IDiamondCut.sol";
import "../src/diamond-base/interfaces/IDiamondLoupe.sol";
import "../src/diamond-base/interfaces/IERC165.sol";
import "../src/diamond-base/interfaces/IERC173.sol";

/// @title Vincent Diamond Deployment Script
/// @notice Foundry script for deploying the Vincent Diamond to multiple networks
/// @dev Uses environment variables for private key and PKP NFT contract addresses
/// @custom:env VINCENT_DEPLOYER_PRIVATE_KEY - Private key of the deployer
/// @custom:env DATIL_PKP_NFT_CONTRACT_ADDRESS - PKP NFT contract address on Datil
contract DeployVincentDiamond is Script {
    /// @notice Error thrown when required environment variables are missing
    error MissingEnvironmentVariable(string name);

    /// @notice Deploy facets for the diamond
    /// @return facets Array of deployed facet addresses
    /// @return diamondCutFacetAddress Address of the DiamondCutFacet
    function deployFacets()
        internal
        returns (VincentDiamond.FacetAddresses memory facets, address diamondCutFacetAddress)
    {
        // Deploy facets
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet();
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        VincentToolFacet toolFacet = new VincentToolFacet();
        VincentToolViewFacet toolViewFacet = new VincentToolViewFacet();
        VincentAppFacet appFacet = new VincentAppFacet();
        VincentAppViewFacet appViewFacet = new VincentAppViewFacet();
        VincentUserFacet userFacet = new VincentUserFacet();
        VincentUserViewFacet userViewFacet = new VincentUserViewFacet();

        // Create facets struct
        facets = VincentDiamond.FacetAddresses({
            diamondLoupeFacet: address(diamondLoupeFacet),
            ownershipFacet: address(ownershipFacet),
            vincentAppFacet: address(appFacet),
            vincentAppViewFacet: address(appViewFacet),
            vincentToolFacet: address(toolFacet),
            vincentToolViewFacet: address(toolViewFacet),
            vincentUserFacet: address(userFacet),
            vincentUserViewFacet: address(userViewFacet)
        });

        diamondCutFacetAddress = address(diamondCutFacet);

        return (facets, diamondCutFacetAddress);
    }

    /// @notice Log deployment details
    /// @param network Network name
    /// @param diamond Diamond contract address
    /// @param pkpNFTAddress PKP NFT contract address
    /// @param approvedToolsManager Approved tools manager address
    /// @param facets Struct containing deployed facet addresses
    function logDeployment(
        string memory network,
        address diamond,
        address pkpNFTAddress,
        address approvedToolsManager,
        VincentDiamond.FacetAddresses memory facets
    ) internal view {
        console.log("Vincent Diamond deployed for", network, "to:", address(diamond));
        console.log("Using PKP NFT contract:", pkpNFTAddress);
        console.log("Approved Tools Manager:", approvedToolsManager);
        console.log("DiamondLoupeFacet:", facets.diamondLoupeFacet);
        console.log("OwnershipFacet:", facets.ownershipFacet);
        console.log("VincentAppFacet:", facets.vincentAppFacet);
        console.log("VincentAppViewFacet:", facets.vincentAppViewFacet);
        console.log("VincentToolFacet:", facets.vincentToolFacet);
        console.log("VincentToolViewFacet:", facets.vincentToolViewFacet);
        console.log("VincentUserFacet:", facets.vincentUserFacet);
        console.log("VincentUserViewFacet:", facets.vincentUserViewFacet);
    }

    /// @notice Deploy to a specific network
    /// @param network Network name for logging
    /// @param pkpNFTAddress PKP NFT contract address
    /// @return address The address of the deployed registry
    function deployToNetwork(string memory network, address pkpNFTAddress) public returns (address) {
        // Validate PKP NFT address
        if (pkpNFTAddress == address(0)) {
            revert MissingEnvironmentVariable(string.concat(network, " PKP NFT contract address"));
        }

        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert MissingEnvironmentVariable("VINCENT_DEPLOYER_PRIVATE_KEY");
        }

        // Get the deployer address
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Get approved tools manager address - this is required
        address approvedToolsManager;
        try vm.envAddress("APPROVED_TOOLS_MANAGER_ADDRESS") returns (address managedAddress) {
            if (managedAddress != address(0)) {
                approvedToolsManager = managedAddress;
                console.log("Using approved tools manager:", approvedToolsManager);
            } else {
                revert MissingEnvironmentVariable("APPROVED_TOOLS_MANAGER_ADDRESS (zero address provided)");
            }
        } catch {
            revert MissingEnvironmentVariable("APPROVED_TOOLS_MANAGER_ADDRESS");
        }

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy facets and get facet addresses
        (VincentDiamond.FacetAddresses memory facets, address diamondCutFacetAddress) = deployFacets();

        // Deploy the Diamond with the diamondCut facet and all other facets in one transaction
        VincentDiamond diamond = new VincentDiamond(
            deployerAddress, // contract owner
            diamondCutFacetAddress, // diamond cut facet
            facets, // all other facets
            pkpNFTAddress, // PKP NFT contract address - set immutably
            approvedToolsManager // approved tools manager
        );

        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Log deployment details
        logDeployment(network, address(diamond), pkpNFTAddress, approvedToolsManager, facets);

        return address(diamond);
    }

    /// @notice Deploy to Datil network
    function deployToDatil() public returns (address) {
        address pkpNFTAddress = vm.envAddress("DATIL_PKP_NFT_CONTRACT_ADDRESS");
        return deployToNetwork("Datil", pkpNFTAddress);
    }

    /// @notice Main deployment function
    function run() public {
        // Deploy to all networks
        deployToDatil();
    }
}
