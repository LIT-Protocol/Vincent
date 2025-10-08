// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../diamond-base/libraries/LibDiamond.sol";

library LibFeeStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant FEE_STORAGE_SLOT = keccak256("lit.vincent.fee.storage");

    struct Deposit {
        uint256 assetAmount;
        uint256 vaultShares;
        uint256 vaultProvider; // 1 = Morpho, 2 = Aave
    }

    struct FeeStorage {
        // maps user address to a vault to a deposit
        mapping(address => mapping(address => Deposit)) deposits;
        // performance fee percentage, expressed in basis points
        // so 1000 = 10%.  multiply percentage by 100 to get basis points
        uint256 performanceFeePercentage;
        // set of tokens that have collected fees
        // used to track which tokens have collected fees
        // so we know where to look for collected fees
        EnumerableSet.AddressSet tokensWithCollectedFees;
    }

    function getStorage() internal pure returns (FeeStorage storage as_) {
        bytes32 slot = FEE_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}

