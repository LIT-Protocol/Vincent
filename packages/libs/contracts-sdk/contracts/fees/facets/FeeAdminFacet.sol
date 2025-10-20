// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "../LibFeeStorage.sol";
import {LibDiamond} from "../../diamond-base/libraries/LibDiamond.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {FeeUtils} from "../FeeUtils.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title FeeAdminFacet
 * @notice A facet of the Fee Diamond that a Vincent admin can use to withdraw collected fees
 */
contract FeeAdminFacet {
    using EnumerableSet for EnumerableSet.AddressSet;

    /* ========== Modifiers ========== */
    modifier onlyOwner() {
        if (msg.sender != LibDiamond.contractOwner()) {
            revert FeeUtils.CallerNotOwner();
        }
        _;
    }

    /* ========== VIEWS ========== */

    /**
     * @notice Gets the performance fee percentage
     * @return the performance fee percentage in basis points
     * so 1000 = 10%.  multiply percentage by 100 to get basis points
     */
    function performanceFeePercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().performanceFeePercentage;
    }

    /**
     * @notice Gets the swap fee percentage
     * @return the swap fee percentage in basis points
     * so 25 = 0.25%.  multiply percentage by 100 to get basis points
     */
    function swapFeePercentage() external view returns (uint256) {
        return LibFeeStorage.getStorage().swapFeePercentage;
    }

    /**
     * @notice Gets the entire list of tokens that have collected fees
     * if this list gets too long and the view call is timing out,
     * you can use the "one at a time" functions below
     * @return the list of tokens that have collected fees
     */
    function tokensWithCollectedFees() external view returns (address[] memory) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.values();
    }

    /**
     * @notice Gets the length of the tokensWithCollectedFees set
     * @return the length of the tokensWithCollectedFees set
     */
    function tokensWithCollectedFeesLength() external view returns (uint256) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.length();
    }

    /**
     * @notice Gets the token at the given index in the tokensWithCollectedFees set
     * @param index the index of the token to get
     * @return the token at the given index
     */
    function tokensWithCollectedFeesAtIndex(uint256 index) external view returns (address) {
        return LibFeeStorage.getStorage().tokensWithCollectedFees.at(index);
    }

    /**
     * @notice Gets the aave pool contract address for this chain
     * @return the aave pool contract address for this chain
     */
    function aavePool() external view returns (address) {
        return LibFeeStorage.getStorage().aavePool;
    }

    /**
     * @notice Gets the aerodrome router contract address for this chain
     * @return the aerodrome router contract address for this chain
     */
    function aerodromeRouter() external view returns (address) {
        return LibFeeStorage.getStorage().aerodromeRouter;
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    /**
     * @notice Withdraws a token from the fee contract.
     * Can only remove the full balance of the token
     * @param tokenAddress the address of the token to withdraw
     * @dev this can only be called by the owner
     */
    function withdrawTokens(address tokenAddress) external onlyOwner {
        // remove the token from the set of tokens that have collected fees
        // since we're withdrawing the full balance of the token
        LibFeeStorage.getStorage().tokensWithCollectedFees.remove(tokenAddress);

        // get the token
        IERC20 token = IERC20(tokenAddress);
        uint256 amount = token.balanceOf(address(this));

        // transfer the token to the owner
        token.transfer(msg.sender, amount);
    }

    /**
     * @notice Sets the performance fee percentage
     * @param newPerformanceFeePercentage the new performance fee percentage
     * in basis points
     * so 1000 = 10%.  multiply percentage by 100 to get basis points
     * @dev this can only be called by the owner
     */
    function setPerformanceFeePercentage(uint256 newPerformanceFeePercentage) external onlyOwner {
        LibFeeStorage.getStorage().performanceFeePercentage = newPerformanceFeePercentage;
    }

    /**
     * @notice Sets the swap fee percentage
     * @param newSwapFeePercentage the new swap fee percentage
     * in basis points
     * so 25 = 0.25%.  multiply percentage by 100 to get basis points
     * @dev this can only be called by the owner
     */
    function setSwapFeePercentage(uint256 newSwapFeePercentage) external onlyOwner {
        LibFeeStorage.getStorage().swapFeePercentage = newSwapFeePercentage;
    }

    /**
     * @notice Sets the aave pool contract address for this chain
     * @param newAavePool the new aave pool contract address for this chain
     * @dev this can only be called by the owner
     */
    function setAavePool(address newAavePool) external onlyOwner {
        LibFeeStorage.getStorage().aavePool = newAavePool;
    }

    /**
     * @notice Sets the aerodrome router contract address for this chain
     * @param newAerodromeRouter the new aerodrome router contract address for this chain
     * @dev this can only be called by the owner
     */
    function setAerodromeRouter(address newAerodromeRouter) external onlyOwner {
        LibFeeStorage.getStorage().aerodromeRouter = newAerodromeRouter;
    }
}
