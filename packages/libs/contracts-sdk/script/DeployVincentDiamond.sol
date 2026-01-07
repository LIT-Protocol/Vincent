// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/VincentDiamond.sol";
import "../contracts/diamond-base/facets/DiamondCutFacet.sol";
import "../contracts/diamond-base/facets/DiamondLoupeFacet.sol";
import "../contracts/diamond-base/facets/OwnershipFacet.sol";
import "../contracts/facets/VincentAppFacet.sol";
import "../contracts/facets/VincentAppViewFacet.sol";
import "../contracts/facets/VincentUserFacet.sol";
import "../contracts/facets/VincentUserViewFacet.sol";
import "../contracts/facets/VincentERC2771Facet.sol";
import "../contracts/VincentBase.sol";
import "../contracts/diamond-base/interfaces/IDiamondCut.sol";
import "../contracts/diamond-base/interfaces/IDiamondLoupe.sol";
import "../contracts/diamond-base/interfaces/IERC165.sol";
import "../contracts/diamond-base/interfaces/IERC173.sol";

/**
 * @title Vincent Diamond Deployment Script
 * @notice Foundry script for deploying the Vincent Diamond to multiple networks using CREATE2
 * @dev Uses environment variables for deployment configuration and CREATE2 for deterministic addresses
 * @custom:env VINCENT_DEPLOYER_PRIVATE_KEY - Private key of the deployer
 * @custom:env VINCENT_GELATO_FORWARDER_ADDRESS - Gelato trusted forwarder address for EIP-2771 gasless transactions
 */
contract DeployVincentDiamond is Script {
    /**
     * @notice Error thrown when required environment variables are missing
     */
    error MissingEnvironmentVariable(string name);

    /**
     * @notice Deploy facets for the diamond
     * @param create2Salt Salt for CREATE2 deployment to generate deterministic addresses
     * @return facets Array of deployed facet addresses
     * @return diamondCutFacetAddress Address of the DiamondCutFacet
     */
    function deployFacets(bytes32 create2Salt)
        internal
        returns (VincentDiamond.FacetAddresses memory facets, address diamondCutFacetAddress)
    {
        // Deploy facets using CREATE2 for deterministic addresses
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet{salt: create2Salt}();
        DiamondLoupeFacet diamondLoupeFacet = new DiamondLoupeFacet{salt: create2Salt}();
        OwnershipFacet ownershipFacet = new OwnershipFacet{salt: create2Salt}();
        VincentAppFacet appFacet = new VincentAppFacet{salt: create2Salt}();
        VincentAppViewFacet appViewFacet = new VincentAppViewFacet{salt: create2Salt}();
        VincentUserFacet userFacet = new VincentUserFacet{salt: create2Salt}();
        VincentUserViewFacet userViewFacet = new VincentUserViewFacet{salt: create2Salt}();
        VincentERC2771Facet erc2771Facet = new VincentERC2771Facet{salt: create2Salt}();

        // Create facets struct
        facets = VincentDiamond.FacetAddresses({
            diamondLoupeFacet: address(diamondLoupeFacet),
            ownershipFacet: address(ownershipFacet),
            vincentAppFacet: address(appFacet),
            vincentAppViewFacet: address(appViewFacet),
            vincentUserFacet: address(userFacet),
            vincentUserViewFacet: address(userViewFacet),
            vincentERC2771Facet: address(erc2771Facet)
        });

        diamondCutFacetAddress = address(diamondCutFacet);

        return (facets, diamondCutFacetAddress);
    }

    /**
     * @notice Log deployment details
     * @param network Network name
     * @param diamond Diamond contract address
     * @param facets Struct containing deployed facet addresses
     */
    function logDeployment(string memory network, address diamond, VincentDiamond.FacetAddresses memory facets)
        internal
        pure
    {
        console.log("Vincent Diamond deployed for", network, "to:", address(diamond));
        console.log("DiamondLoupeFacet:", facets.diamondLoupeFacet);
        console.log("OwnershipFacet:", facets.ownershipFacet);
        console.log("VincentAppFacet:", facets.vincentAppFacet);
        console.log("VincentAppViewFacet:", facets.vincentAppViewFacet);
        console.log("VincentUserFacet:", facets.vincentUserFacet);
        console.log("VincentUserViewFacet:", facets.vincentUserViewFacet);
        console.log("VincentERC2771Facet:", facets.vincentERC2771Facet);
    }

    /**
     * @notice Deploy to a specific network
     * @param network Network name for logging
     * @param create2Salt Salt for CREATE2 deployment to generate deterministic addresses
     * @return address The address of the deployed registry
     */
    function deployToNetwork(string memory network, bytes32 create2Salt) public returns (address) {
        // Get private key from environment variable
        uint256 deployerPrivateKey = vm.envUint("VINCENT_DEPLOYER_PRIVATE_KEY");
        if (deployerPrivateKey == 0) {
            revert MissingEnvironmentVariable("VINCENT_DEPLOYER_PRIVATE_KEY");
        }

        // Get the deployer address
        address deployerAddress = vm.addr(deployerPrivateKey);

        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);

        // Deploy facets and get facet addresses using CREATE2
        (VincentDiamond.FacetAddresses memory facets, address diamondCutFacetAddress) = deployFacets(create2Salt);

        // Get the Gelato trusted forwarder from environment variable (defaults to address(0) if not set)
        // Setting to address(0) disables EIP-2771 meta-transaction support
        address gelatoForwarder = vm.envOr("VINCENT_GELATO_FORWARDER_ADDRESS", address(0));
        console.log("Gelato trusted forwarder for chain", block.chainid, ":", gelatoForwarder);

        // Deploy the Diamond with the diamondCut facet and all other facets in one transaction using CREATE2
        VincentDiamond diamond = new VincentDiamond{salt: create2Salt}(
            deployerAddress, // contract owner
            diamondCutFacetAddress, // diamond cut facet
            facets, // all other facets
            gelatoForwarder // trusted forwarder for EIP-2771
        );

        // Stop broadcasting transactions
        vm.stopBroadcast();

        // Log deployment details
        logDeployment(network, address(diamond), facets);

        return address(diamond);
    }

    /**
     * @notice Deploy to Datil network
     */
    function deployToDatil() public returns (address) {
        return deployToNetwork("Datil", keccak256("VincentCreate2Salt_2"));
    }

    /**
     * @notice Deploy to Base Sepolia network
     */
    function deployToBaseSepolia() public returns (address) {
        return deployToNetwork("Base Sepolia", keccak256("VincentCreate2Salt_2"));
    }

    /**
     * @notice Deploy to Base Mainnet network
     */
    function deployToBaseMainnet() public returns (address) {
        return deployToNetwork("Base Mainnet", keccak256("VincentCreate2Salt_2"));
    }

    /**
     * @notice Main deployment function
     */
    function run() public {
        // Deploy to all networks
        deployToDatil();
    }
}
