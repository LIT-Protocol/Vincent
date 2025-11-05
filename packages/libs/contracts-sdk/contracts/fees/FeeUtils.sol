// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./LibFeeStorage.sol";

library FeeUtils {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct OwnerAttestation {
        uint256 srcChainId; // typically Chronicle chain Id
        address srcContract; // typically the VincentAppDiamond contract
        address owner; // owner address from the L3
        uint40 appId; // the Vincent appId that this user is an owner of
        uint256 issuedAt; // unix time from Lit Action
        uint256 expiresAt; // issuedAt + 5 minutes
        uint256 dstChainId; // destination chain id to prevent cross-chain replay
        address dstContract; // destination chain verifier contract, to prevent cross-contract replay
    }

    /* ========== ERRORS ========== */
    error CallerNotOwner();
    error ZeroAppId();

    /* ========== EVENTS ========== */
    event DepositAdded(uint40 indexed appId, address indexed token, uint256 amount, uint256 vaultProvider);
    event DepositWithdrawn(uint40 indexed appId, address indexed token, uint256 amount, uint256 vaultProvider);
    event FeeCollected(uint40 indexed appId, address indexed token, uint256 amount);

    /* ========== FUNCTIONS ========== */

    /**
     * @notice Internal function used to split the fees between the lit foundation and the app
     * @param appId the app id that is collecting the fees
     * @param token the token address that the fees are being paid in, like USDC for example
     * @param amount the amount of fees to split between the lit foundation and the app
     * @dev the fees are split based on the litAppFeeSplitPercentage
     */
    function splitFees(uint40 appId, address token, uint256 amount) internal {
        if (amount == 0) return;
        uint256 litAmount = amount * LibFeeStorage.getStorage().litAppFeeSplitPercentage / 10000;
        uint256 appAmount = amount - litAmount;

        // add the token to the set of tokens that have collected fees
        LibFeeStorage.getStorage().tokensWithCollectedFees[LibFeeStorage.LIT_FOUNDATION_APP_ID].add(address(token));
        LibFeeStorage.getStorage().tokensWithCollectedFees[appId].add(address(token));

        // add the amount to the collected fees for the app
        LibFeeStorage.getStorage().collectedAppFees[LibFeeStorage.LIT_FOUNDATION_APP_ID][address(token)] += litAmount;
        LibFeeStorage.getStorage().collectedAppFees[appId][address(token)] += appAmount;

        emit FeeCollected(LibFeeStorage.LIT_FOUNDATION_APP_ID, token, litAmount);
        emit FeeCollected(appId, token, appAmount);
    }
}
