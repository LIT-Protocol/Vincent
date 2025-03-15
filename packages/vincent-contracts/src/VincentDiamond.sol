// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Diamond Cut Interface
 * @author Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
 * @dev EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
 */
import {LibDiamond} from "./diamond-base/libraries/LibDiamond.sol";
import {IDiamondCut} from "./diamond-base/interfaces/IDiamondCut.sol";
import "./LibVincentDiamondStorage.sol";
import "./diamond-base/interfaces/IDiamondLoupe.sol";
import "./diamond-base/interfaces/IERC165.sol";
import "./diamond-base/interfaces/IERC173.sol";
import "./facets/VincentAppFacet.sol";
import "./facets/VincentAppViewFacet.sol";
import "./facets/VincentToolFacet.sol";
import "./facets/VincentToolViewFacet.sol";
import "./facets/VincentUserFacet.sol";
import "./facets/VincentUserViewFacet.sol";

/// @title Vincent Diamond
/// @notice Main diamond contract for Vincent system
/// @dev Implements EIP-2535 Diamond Standard
contract VincentDiamond {
    error InvalidPKPNFTContract();
    error InvalidFacetAddress();

    /// @dev Struct for facet addresses to avoid stack too deep errors
    struct FacetAddresses {
        address diamondLoupeFacet;
        address ownershipFacet;
        address vincentAppFacet;
        address vincentAppViewFacet;
        address vincentToolFacet;
        address vincentToolViewFacet;
        address vincentUserFacet;
        address vincentUserViewFacet;
    }

    /// @notice Initialize the diamond with the contract owner, all facet addresses, and PKP NFT contract
    /// @param _contractOwner Address of the contract owner
    /// @param _diamondCutFacet Address of the DiamondCutFacet
    /// @param _facets Struct containing all other facet addresses
    /// @param _pkpNFTContract Address of the PKP NFT contract
    constructor(
        address _contractOwner,
        address _diamondCutFacet,
        FacetAddresses memory _facets,
        address _pkpNFTContract
    ) payable {
        // Validate inputs
        if (_pkpNFTContract == address(0)) revert InvalidPKPNFTContract();
        if (_diamondCutFacet == address(0)) revert InvalidFacetAddress();

        // Validate all facet addresses
        if (
            _facets.diamondLoupeFacet == address(0) || _facets.ownershipFacet == address(0)
                || _facets.vincentAppFacet == address(0) || _facets.vincentAppViewFacet == address(0)
                || _facets.vincentToolFacet == address(0) || _facets.vincentToolViewFacet == address(0)
                || _facets.vincentUserFacet == address(0) || _facets.vincentUserViewFacet == address(0)
        ) {
            revert InvalidFacetAddress();
        }

        // Set the contract owner
        LibDiamond.setContractOwner(_contractOwner);

        // Initialize ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;

        // First add the diamondCut facet
        IDiamondCut.FacetCut[] memory diamondCut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory diamondCutSelectors = new bytes4[](1);
        diamondCutSelectors[0] = IDiamondCut.diamondCut.selector;
        diamondCut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: diamondCutSelectors
        });
        LibDiamond.diamondCut(diamondCut, address(0), "");

        // Now add all other facets
        IDiamondCut.FacetCut[] memory cuts = new IDiamondCut.FacetCut[](8);

        // Add DiamondLoupeFacet
        cuts[0] = IDiamondCut.FacetCut({
            facetAddress: _facets.diamondLoupeFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getDiamondLoupeFacetSelectors()
        });

        // Add OwnershipFacet
        cuts[1] = IDiamondCut.FacetCut({
            facetAddress: _facets.ownershipFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getOwnershipFacetSelectors()
        });

        // Add VincentAppFacet
        cuts[2] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentAppFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentAppFacetSelectors()
        });

        // Add VincentAppViewFacet
        cuts[3] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentAppViewFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentAppViewFacetSelectors()
        });

        // Add VincentToolFacet
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentToolFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentToolFacetSelectors()
        });

        // Add VincentToolViewFacet
        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentToolViewFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentToolViewFacetSelectors()
        });

        // Add VincentUserFacet
        cuts[6] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentUserFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentUserFacetSelectors()
        });

        // Add VincentUserViewFacet
        cuts[7] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentUserViewFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentUserViewFacetSelectors()
        });

        // Add all other facets directly using LibDiamond.diamondCut
        LibDiamond.diamondCut(cuts, address(0), "");

        // Initialize Vincent storage with PKP NFT contract (inlined)
        VincentUserStorage.UserStorage storage us = VincentUserStorage.userStorage();
        us.PKP_NFT_FACET = IPKPNFTFacet(_pkpNFTContract);
    }

    /// @dev Get Diamond Loupe facet selectors
    function getDiamondLoupeFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;
        selectors[4] = IERC165.supportsInterface.selector;
        return selectors;
    }

    /// @dev Get Ownership facet selectors
    function getOwnershipFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
        return selectors;
    }

    /// @dev Get VincentAppFacet selectors
    function getVincentAppFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = VincentAppFacet.registerApp.selector;
        selectors[1] = VincentAppFacet.registerNextAppVersion.selector;
        selectors[2] = VincentAppFacet.enableAppVersion.selector;
        selectors[3] = VincentAppFacet.addAuthorizedRedirectUri.selector;
        selectors[4] = VincentAppFacet.removeAuthorizedRedirectUri.selector;
        selectors[5] = VincentAppFacet.addDelegatee.selector;
        selectors[6] = VincentAppFacet.removeDelegatee.selector;
        return selectors;
    }

    /// @dev Get VincentAppViewFacet selectors
    function getVincentAppViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = VincentAppViewFacet.getTotalAppCount.selector;
        selectors[1] = VincentAppViewFacet.getAppById.selector;
        selectors[2] = VincentAppViewFacet.getAppVersion.selector;
        selectors[3] = VincentAppViewFacet.getAppsByManager.selector;
        selectors[4] = VincentAppViewFacet.getAppByDelegatee.selector;
        selectors[5] = VincentAppViewFacet.getAuthorizedRedirectUriByHash.selector;
        selectors[6] = VincentAppViewFacet.getAuthorizedRedirectUrisByAppId.selector;
        selectors[7] = bytes4(0); // Not used, keep array size for backward compatibility
        return selectors;
    }

    /// @dev Get VincentToolFacet selectors
    function getVincentToolFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = VincentToolFacet.registerTool.selector;
        selectors[1] = VincentToolFacet.registerTools.selector;
        return selectors;
    }

    /// @dev Get VincentToolViewFacet selectors
    function getVincentToolViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = VincentToolViewFacet.getToolIpfsCidByHash.selector;
        selectors[1] = VincentToolViewFacet.getAllRegisteredTools.selector;
        return selectors;
    }

    /// @dev Get VincentUserFacet selectors
    function getVincentUserFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = VincentUserFacet.permitAppVersion.selector;
        selectors[1] = VincentUserFacet.unPermitAppVersion.selector;
        selectors[2] = VincentUserFacet.setToolPolicyParameters.selector;
        selectors[3] = VincentUserFacet.removeToolPolicyParameters.selector;
        return selectors;
    }

    /// @dev Get VincentUserViewFacet selectors
    function getVincentUserViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
        selectors[1] = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        selectors[2] = VincentUserViewFacet.getAllPermittedAppIdsForPkp.selector;
        selectors[3] = VincentUserViewFacet.validateToolExecutionAndGetPolicies.selector;
        selectors[4] = VincentUserViewFacet.getAllToolsAndPoliciesForApp.selector;
        return selectors;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        // get diamond storage
        assembly {
            ds.slot := position
        }
        // get facet from function selector
        address facet = address(bytes20(ds.facets[msg.sig]));
        require(facet != address(0), "Diamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value.
        assembly {
            // copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // get any return value
            returndatacopy(0, 0, returndatasize())
            // return any return value or error back to the caller
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    receive() external payable {
        revert("Diamond: Does not accept direct ETH transfers");
    }
}
