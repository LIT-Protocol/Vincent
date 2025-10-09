// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;
/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import { LibDiamond } from "../diamond-base/libraries/LibDiamond.sol";
import { IDiamondCut } from "../diamond-base/interfaces/IDiamondCut.sol";
import { IDiamondLoupe } from "../diamond-base/interfaces/IDiamondLoupe.sol";
import { IERC173 } from "../diamond-base/interfaces/IERC173.sol";
import { IERC165 } from "../diamond-base/interfaces/IERC165.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { LibFeeStorage } from "./LibFeeStorage.sol";

// When no function exists for function called
error FunctionNotFound(bytes4 _functionSelector);

// This is used in diamond constructor
// more arguments are added to this struct
// this avoids stack too deep errors
struct FeeArgs {
    address owner;
    address init;
    bytes initCalldata;
}

contract Fee {
    /**
     * @notice Thrown when ETH is sent directly to the contract without a function call
     */
    error DirectETHTransfersNotAllowed();
    
    constructor(
        IDiamondCut.FacetCut[] memory _diamondCut,
        FeeArgs memory _args
    ) payable {
        LibDiamond.setContractOwner(_args.owner);
        LibDiamond.diamondCut(_diamondCut, _args.init, _args.initCalldata);

        // default to 10% performance fee
        LibFeeStorage.getStorage().performanceFeePercentage = 1000;
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
