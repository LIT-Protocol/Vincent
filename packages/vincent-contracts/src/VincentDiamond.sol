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
import "./facets/VincentLitActionFacet.sol";
import "./facets/VincentLitActionViewFacet.sol";
import "./facets/VincentUserFacet.sol";
import "./facets/VincentUserViewFacet.sol";

/**
 * @title Vincent Diamond
 * @notice Main diamond contract for the Vincent system that implements the EIP-2535 Diamond Standard
 * @dev This contract serves as a proxy delegating calls to various facet contracts
 *      based on function selectors, enabling modular functionality and upgradability
 */
contract VincentDiamond {
    /**
     * @notice Thrown when an invalid (zero address) PKP NFT contract is provided
     */
    error InvalidPKPNFTContract();

    /**
     * @notice Thrown when any of the facet addresses are invalid (zero address)
     */
    error InvalidFacetAddress();

    /**
     * @notice Thrown when an invalid (zero address) approved litActions manager is provided
     */
    error InvalidApprovedLitActionsManagerAddress();

    /**
     * @notice Thrown when ETH is sent directly to the contract without a function call
     */
    error DirectETHTransfersNotAllowed();

    /**
     * @dev Struct for facet addresses to avoid stack too deep errors in the constructor
     * @notice Holds all the facet addresses that comprise the diamond's functionality
     */
    struct FacetAddresses {
        // The facet implementing diamond inspection functions
        address diamondLoupeFacet;
        // The facet implementing ownership management functions
        address ownershipFacet;
        // The facet implementing app registration and management functions
        address vincentAppFacet;
        // The facet implementing app viewing functions
        address vincentAppViewFacet;
        // The facet implementing lit action registration and management functions
        address vincentLitActionFacet;
        // The facet implementing lit action viewing functions
        address vincentLitActionViewFacet;
        // The facet implementing user management functions
        address vincentUserFacet;
        // The facet implementing user data viewing functions
        address vincentUserViewFacet;
    }

    /**
     * @notice Initialize the diamond contract with all required facets and configuration
     * @dev Sets up all facets, configures storage, and initializes interface support
     * @param _contractOwner Address that will own the diamond contract
     * @param _diamondCutFacet Address of the facet implementing diamond cut functionality
     * @param _facets Struct containing addresses of all other facets
     * @param _pkpNFTContract Address of the PKP NFT contract used for sourcing PKP ownership
     * @param _approvedLitActionsManager Address authorized to manage list of approved litActions
     */
    constructor(
        address _contractOwner,
        address _diamondCutFacet,
        FacetAddresses memory _facets,
        address _pkpNFTContract,
        address _approvedLitActionsManager
    ) payable {
        // Validate inputs
        if (_pkpNFTContract == address(0)) revert InvalidPKPNFTContract();
        if (_diamondCutFacet == address(0)) revert InvalidFacetAddress();
        if (_approvedLitActionsManager == address(0)) revert InvalidApprovedLitActionsManagerAddress();

        // Validate all facet addresses
        if (
            _facets.diamondLoupeFacet == address(0) || _facets.ownershipFacet == address(0)
                || _facets.vincentAppFacet == address(0) || _facets.vincentAppViewFacet == address(0)
                || _facets.vincentLitActionFacet == address(0) || _facets.vincentLitActionViewFacet == address(0)
                || _facets.vincentUserFacet == address(0) || _facets.vincentUserViewFacet == address(0)
        ) {
            revert InvalidFacetAddress();
        }

        // Set the contract owner
        LibDiamond.setContractOwner(_contractOwner);

        // Initialize the approvedLitActionsManager
        VincentLitActionStorage.LitActionStorage storage ls = VincentLitActionStorage.litActionStorage();
        ls.approvedLitActionsManager = _approvedLitActionsManager;

        // Initialize Vincent storage with PKP NFT contract (inlined)
        VincentUserStorage.UserStorage storage us = VincentUserStorage.userStorage();
        us.PKP_NFT_FACET = IPKPNFTFacet(_pkpNFTContract);

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

        // Add VincentLitActionFacet
        cuts[4] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentLitActionFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentLitActionFacetSelectors()
        });

        // Add VincentLitActionViewFacet
        cuts[5] = IDiamondCut.FacetCut({
            facetAddress: _facets.vincentLitActionViewFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: getVincentLitActionViewFacetSelectors()
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

        LibDiamond.diamondCut(cuts, address(0), "");
    }

    /**
     * @dev The following internal functions retrieve function selectors for each facet.
     * These are used during diamond initialization to register each facet's functions
     * with the diamond proxy. Each function returns an array of function selectors (bytes4 values)
     * that identify the functions in the respective facet.
     */
    function getDiamondLoupeFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;
        selectors[4] = IERC165.supportsInterface.selector;
        return selectors;
    }

    function getOwnershipFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
        return selectors;
    }

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

    function getVincentAppViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = VincentAppViewFacet.getTotalAppCount.selector;
        selectors[1] = VincentAppViewFacet.getAppById.selector;
        selectors[2] = VincentAppViewFacet.getAppVersion.selector;
        selectors[3] = VincentAppViewFacet.getAppsByManager.selector;
        selectors[4] = VincentAppViewFacet.getAppByDelegatee.selector;
        selectors[5] = VincentAppViewFacet.getAuthorizedRedirectUriByHash.selector;
        selectors[6] = VincentAppViewFacet.getAuthorizedRedirectUrisByAppId.selector;
        return selectors;
    }

    function getVincentLitActionFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = VincentLitActionFacet.approveLitActions.selector;
        selectors[1] = VincentLitActionFacet.removeLitActionApprovals.selector;
        selectors[2] = VincentLitActionFacet.updateApprovedLitActionsManager.selector;
        return selectors;
    }

    function getVincentLitActionViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = VincentLitActionViewFacet.getLitActionIpfsCidByHash.selector;
        selectors[1] = VincentLitActionViewFacet.getAllApprovedLitActions.selector;
        selectors[2] = VincentLitActionViewFacet.isLitActionApproved.selector;
        selectors[3] = VincentLitActionViewFacet.getApprovedLitActionsManager.selector;
        return selectors;
    }

    function getVincentUserFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = VincentUserFacet.permitAppVersion.selector;
        selectors[1] = VincentUserFacet.unPermitAppVersion.selector;
        selectors[2] = VincentUserFacet.setToolPolicyParameters.selector;
        selectors[3] = VincentUserFacet.removeToolPolicyParameters.selector;
        return selectors;
    }

    function getVincentUserViewFacetSelectors() internal pure returns (bytes4[] memory) {
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = VincentUserViewFacet.getAllRegisteredAgentPkps.selector;
        selectors[1] = VincentUserViewFacet.getPermittedAppVersionForPkp.selector;
        selectors[2] = VincentUserViewFacet.getAllPermittedAppIdsForPkp.selector;
        selectors[3] = VincentUserViewFacet.validateToolExecutionAndGetPolicies.selector;
        selectors[4] = VincentUserViewFacet.getAllToolsAndPoliciesForApp.selector;
        return selectors;
    }

    /**
     * @notice Fallback function that forwards calls to the appropriate facet
     * @dev Implements diamond proxy pattern by delegating calls to the correct implementation contract
     *      Identifies the correct facet using the function selector from the calldata
     *      Any ETH value sent with the transaction will remain in this diamond contract
     *      since delegatecall executes the facet's code in the context of this contract
     */
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        // Get diamond storage
        assembly {
            ds.slot := position
        }
        // Get facet address from function selector
        address facet = address(bytes20(ds.facets[msg.sig]));
        require(facet != address(0), "Diamond: Function does not exist");
        // Execute external function from facet using delegatecall and return any value
        assembly {
            // Copy function selector and any arguments
            calldatacopy(0, 0, calldatasize())
            // Execute function call using the facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            // Get any return value
            returndatacopy(0, 0, returndatasize())
            // Return any return value or error back to the caller
            // If the delegatecall failed (result=0), forward the error data from the facet
            // If the delegatecall succeeded, forward the return data from the facet
            switch result
            case 0 { revert(0, returndatasize()) }
            default { return(0, returndatasize()) }
        }
    }

    /**
     * @notice Handles direct ETH transfers to the contract
     * @dev Prevents direct ETH transfers by reverting all receive calls
     */
    receive() external payable {
        revert DirectETHTransfersNotAllowed();
    }
}
