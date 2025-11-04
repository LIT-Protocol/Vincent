// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../diamond-base/libraries/LibDiamond.sol";

library LibFeeStorage {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 internal constant FEE_STORAGE_SLOT = keccak256("lit.vincent.fee.storage");

    // app id 0 is the lit foundation
    uint40 internal constant LIT_FOUNDATION_APP_ID = 0;

    // chronicle yellowstone chain id
    uint256 internal constant CHRONICLE_YELLOWSTONE_CHAIN_ID = 175188;

    struct Deposit {
        uint256 assetAmount; // the amount of assets deposited
        uint256 vaultShares; // the amount of vault shares received - not relevant for Aave because it's rebasing
        uint256 vaultProvider; // 1 = Morpho, 2 = Aave
    }

    struct FeeStorage {
        // maps appId to a user address to a vault/pool asset address to a deposit
        mapping(uint40 => mapping(address => mapping(address => Deposit))) deposits;
        // performance fee percentage, expressed in basis points
        // so 1000 = 10%.  multiply percentage by 100 to get basis points
        uint256 performanceFeePercentage;
        // aerodrome swap fee percentage, expressed in basis points
        // so 25 = 0.25%.  multiply percentage by 100 to get basis points
        uint256 swapFeePercentage;
        // set of tokens that have collected fees
        // used to track which tokens have collected fees
        // so we know where to look for collected fees
        // maps app id to a set of tokens that have collected fees
        mapping(uint40 => EnumerableSet.AddressSet) tokensWithCollectedFees;
        // aave pool contract address for this chain
        address aavePool;
        // aerodrome router contract address for this chain
        address aerodromeRouter;
        // maps app id to a token address to the fees collected that should go to the app that initiated the action
        // based on the litAppFeeSplitPercentage and the amount of fees collected for that app
        mapping(uint40 => mapping(address => uint256)) collectedAppFees;
        // Lit Foundation / App fee split percentage, expressed in basis points
        // so 1000 = 10% goes to Lit Foundation, 90% goes to the app that initiated the action.  multiply percentage by 100 to get basis points
        uint256 litAppFeeSplitPercentage;
        // The address of a lit action derived wallet that will do a cross-chain read of the owner
        address ownerAttestationSigner;
        // The address of the lit foundation that will receive the fees
        address litFoundationWallet;
        // the address of the vincent app diamond contract on chronicle yellowstone
        address vincentAppDiamondOnYellowstone;

    }

    function getStorage() internal pure returns (FeeStorage storage as_) {
        bytes32 slot = FEE_STORAGE_SLOT;
        assembly {
            as_.slot := slot
        }
    }
}
